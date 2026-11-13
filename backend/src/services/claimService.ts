import { prisma } from '../config/prisma.js';
import { generateClaimReferenceNumber } from '../utils/refGenerator.js';
import { NotificationClient } from './notificationClient.js';
import { ClaimStatus, FoundItemStatus } from '../domain/enums.js';

export class ClaimService {
  static async createClaim(data: {
    itemId: string;
    claimantId: string;
    claimDescription: string;
    identifyingCharacteristics: string;
    supportingEvidence?: string;
  }) {
    const item = await prisma.item.findUnique({
      where: { id: data.itemId },
      include: { reporter: true },
    });

    if (!item) {
      throw { statusCode: 404, message: 'Item to claim was not found.' };
    }

    if (item.itemType !== 'FOUND') {
      throw { statusCode: 400, message: 'Claims can only be filed against FOUND items.' };
    }

    if (item.status === 'RETURNED' || item.status === 'CLOSED') {
      throw { statusCode: 400, message: 'This item has already been collected or resolved and cannot accept claims.' };
    }

    // Rule: Prevent users from claiming their own found listings
    if (item.reporterId === data.claimantId) {
      throw { statusCode: 400, message: 'You cannot submit an ownership claim for an item you reported found yourself.' };
    }

    // Rule: Prevent duplicate active claims from the same user for the same item
    const existingClaim = await prisma.claim.findFirst({
      where: {
        itemId: data.itemId,
        claimantId: data.claimantId,
        status: { in: ['PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'APPROVED'] },
      },
    });

    if (existingClaim) {
      throw {
        statusCode: 409,
        message: `You already have an active claim (${existingClaim.referenceNumber}) for this item.`,
      };
    }

    const referenceNumber = generateClaimReferenceNumber();

    const claim = await prisma.$transaction(async (tx) => {
      const createdClaim = await tx.claim.create({
        data: {
          referenceNumber,
          itemId: data.itemId,
          claimantId: data.claimantId,
          claimDescription: data.claimDescription,
          identifyingCharacteristics: data.identifyingCharacteristics,
          supportingEvidence: data.supportingEvidence || null,
          status: 'PENDING',
        },
        include: {
          item: true,
          claimant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              studentId: true,
              department: true,
            },
          },
        },
      });

      // Update item status to CLAIM_PENDING if currently ACTIVE
      if (item.status === 'ACTIVE') {
        await tx.item.update({
          where: { id: item.id },
          data: { status: 'CLAIM_PENDING' },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: data.claimantId,
          action: 'CLAIM_SUBMITTED',
          entityType: 'CLAIM',
          entityId: createdClaim.id,
          details: `Submitted claim ${referenceNumber} for item ${item.referenceNumber}`,
        },
      });

      return createdClaim;
    });

    // Notify the Finder/Reporter about the new claim
    await NotificationClient.send({
      userId: item.reporterId,
      type: 'CLAIM_SUBMITTED',
      title: 'New Ownership Claim Submitted',
      message: `A student has submitted an ownership claim for your found item "${item.itemName}". Please review the claim details.`,
      link: `/claim-verification/${claim.id}`,
      metadata: {
        itemReference: item.referenceNumber,
        itemName: item.itemName,
        claimReference: claim.referenceNumber,
      },
    });

    return claim;
  }

  static async getClaims(filter: {
    claimantId?: string;
    itemId?: string;
    status?: string;
    currentUserId: string;
    userRole: string;
  }) {
    const where: any = {};

    // Normal student can only view claims they filed, OR claims on items they reported found
    if (filter.userRole !== 'ADMIN') {
      if (filter.claimantId && filter.claimantId === filter.currentUserId) {
        where.claimantId = filter.currentUserId;
      } else if (filter.itemId) {
        // Verify user owns the item
        const item = await prisma.item.findUnique({ where: { id: filter.itemId } });
        if (!item || item.reporterId !== filter.currentUserId) {
          throw { statusCode: 403, message: 'Access denied to claims for this item.' };
        }
        where.itemId = filter.itemId;
      } else {
        // Default: return user's own claims
        where.claimantId = filter.currentUserId;
      }
    } else {
      // Admin can filter by anything
      if (filter.claimantId) where.claimantId = filter.claimantId;
      if (filter.itemId) where.itemId = filter.itemId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    const claims = await prisma.claim.findMany({
      where,
      include: {
        item: {
          include: {
            images: true,
            category: true,
          },
        },
        claimant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            studentId: true,
            department: true,
            yearOfStudy: true,
          },
        },
        collection: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return claims;
  }

  static async getClaimById(id: string, currentUserId: string, userRole: string) {
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        item: {
          include: {
            images: true,
            category: true,
            reporter: {
              select: {
                id: true,
                fullName: true,
                email: true,
                department: true,
              },
            },
          },
        },
        claimant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            studentId: true,
            department: true,
            yearOfStudy: true,
            profileImage: true,
          },
        },
        collection: {
          include: {
            confirmedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!claim) {
      throw { statusCode: 404, message: 'Claim not found.' };
    }

    // Check authorization: must be claimant, item reporter, or admin
    const isClaimant = claim.claimantId === currentUserId;
    const isReporter = claim.item.reporterId === currentUserId;
    const isAdmin = userRole === 'ADMIN';

    if (!isClaimant && !isReporter && !isAdmin) {
      throw { statusCode: 403, message: 'You are not authorized to view this claim.' };
    }

    return claim;
  }

  static async reviewClaim(id: string, reviewerId: string, reviewerRole: string, data: {
    status: 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFORMATION_REQUIRED' | 'UNDER_REVIEW';
    rejectionReason?: string;
    verificationNotes?: string;
  }) {
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { item: true, claimant: true },
    });

    if (!claim) {
      throw { statusCode: 404, message: 'Claim not found.' };
    }

    // Check permission: only item reporter or admin can review
    if (claim.item.reporterId !== reviewerId && reviewerRole !== 'ADMIN') {
      throw { statusCode: 403, message: 'Only the item finder or campus administrators can review this claim.' };
    }

    // Business rule: A claim cannot be approved if already rejected
    if (claim.status === 'REJECTED') {
      throw { statusCode: 400, message: 'A rejected claim cannot be directly approved. The claimant must submit a new claim.' };
    }

    // Business rule: Rejection requires a reason
    if (data.status === 'REJECTED' && (!data.rejectionReason || data.rejectionReason.trim().length === 0)) {
      throw { statusCode: 400, message: 'A rejection reason is strictly required when rejecting an ownership claim.' };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedClaim = await tx.claim.update({
        where: { id },
        data: {
          status: data.status,
          rejectionReason: data.status === 'REJECTED' ? data.rejectionReason : null,
          verificationNotes: data.verificationNotes || claim.verificationNotes,
        },
        include: {
          item: true,
          claimant: true,
        },
      });

      if (data.status === 'APPROVED') {
        // Update item status to CLAIM_APPROVED
        await tx.item.update({
          where: { id: claim.itemId },
          data: { status: 'CLAIM_APPROVED' },
        });

        // Reject other pending claims for this item
        await tx.claim.updateMany({
          where: {
            itemId: claim.itemId,
            id: { not: id },
            status: { in: ['PENDING', 'UNDER_REVIEW'] },
          },
          data: {
            status: 'REJECTED',
            rejectionReason: 'Another ownership claim was verified and approved for this item.',
          },
        });
      } else if (data.status === 'REJECTED') {
        // Check if other active claims exist on this item
        const remainingActiveClaims = await tx.claim.count({
          where: {
            itemId: claim.itemId,
            id: { not: id },
            status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
          },
        });

        if (remainingActiveClaims === 0) {
          await tx.item.update({
            where: { id: claim.itemId },
            data: { status: 'ACTIVE' },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: `CLAIM_${data.status}`,
          entityType: 'CLAIM',
          entityId: id,
          details: `Claim ${claim.referenceNumber} status set to ${data.status}. Reason/Notes: ${data.rejectionReason || data.verificationNotes || 'None'}`,
        },
      });

      return updatedClaim;
    });

    // Send notifications according to decision
    if (data.status === 'APPROVED') {
      await NotificationClient.send({
        userId: claim.claimantId,
        type: 'CLAIM_APPROVED',
        title: 'Ownership Claim Approved!',
        message: `Congratulations! Your ownership claim for "${claim.item.itemName}" (${claim.item.referenceNumber}) has been approved. A collection schedule will be arranged shortly.`,
        link: `/dashboard`,
        metadata: {
          itemReference: claim.item.referenceNumber,
          itemName: claim.item.itemName,
          claimReference: claim.referenceNumber,
        },
      });
    } else if (data.status === 'REJECTED') {
      await NotificationClient.send({
        userId: claim.claimantId,
        type: 'CLAIM_REJECTED',
        title: 'Ownership Claim Decision Update',
        message: `Your claim for "${claim.item.itemName}" was not approved. Reason: ${data.rejectionReason}`,
        link: `/dashboard`,
        metadata: {
          itemReference: claim.item.referenceNumber,
          itemName: claim.item.itemName,
          claimReference: claim.referenceNumber,
        },
      });
    } else if (data.status === 'ADDITIONAL_INFORMATION_REQUIRED') {
      await NotificationClient.send({
        userId: claim.claimantId,
        type: 'INFO_REQUESTED',
        title: 'Additional Claim Information Required',
        message: `The reviewer has requested more details regarding your claim for "${claim.item.itemName}". Note: ${data.verificationNotes || 'Please provide additional ownership proof.'}`,
        link: `/claim-verification/${claim.id}`,
        metadata: {
          itemReference: claim.item.referenceNumber,
          itemName: claim.item.itemName,
          claimReference: claim.referenceNumber,
        },
      });
    }

    return updated;
  }
}
