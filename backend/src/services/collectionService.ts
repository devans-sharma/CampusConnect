import { prisma } from '../config/prisma.js';
import { NotificationClient } from './notificationClient.js';

export class CollectionService {
  static async scheduleCollection(data: {
    claimId: string;
    schedulerId: string;
    schedulerRole: string;
    collectionLocation: string;
    collectionInstructions: string;
    scheduledAt: string;
  }) {
    const claim = await prisma.claim.findUnique({
      where: { id: data.claimId },
      include: { item: true, claimant: true },
    });

    if (!claim) {
      throw { statusCode: 404, message: 'Claim not found.' };
    }

    if (claim.status !== 'APPROVED') {
      throw { statusCode: 400, message: 'Collection can only be scheduled for an APPROVED claim.' };
    }

    // Must be admin or finder
    if (claim.item.reporterId !== data.schedulerId && data.schedulerRole !== 'ADMIN') {
      throw { statusCode: 403, message: 'You are not authorized to arrange collection for this item.' };
    }

    const scheduledDate = new Date(data.scheduledAt);

    const collection = await prisma.$transaction(async (tx) => {
      // Upsert collection record
      const record = await tx.collection.upsert({
        where: { claimId: data.claimId },
        create: {
          claimId: data.claimId,
          collectionLocation: data.collectionLocation,
          collectionInstructions: data.collectionInstructions,
          scheduledAt: scheduledDate,
          status: 'SCHEDULED',
        },
        update: {
          collectionLocation: data.collectionLocation,
          collectionInstructions: data.collectionInstructions,
          scheduledAt: scheduledDate,
          status: 'SCHEDULED',
        },
        include: {
          claim: {
            include: { item: true, claimant: true },
          },
        },
      });

      // Update item status to AWAITING_COLLECTION
      await tx.item.update({
        where: { id: claim.itemId },
        data: { status: 'AWAITING_COLLECTION' },
      });

      await tx.auditLog.create({
        data: {
          actorId: data.schedulerId,
          action: 'COLLECTION_SCHEDULED',
          entityType: 'COLLECTION',
          entityId: record.id,
          details: `Collection scheduled at ${data.collectionLocation} for ${scheduledDate.toISOString()}`,
        },
      });

      return record;
    });

    // Notify claimant
    await NotificationClient.send({
      userId: claim.claimantId,
      type: 'COLLECTION_SCHEDULED',
      title: 'Collection Handover Scheduled',
      message: `Your item collection is scheduled for ${scheduledDate.toLocaleString()} at ${data.collectionLocation}. Instructions: ${data.collectionInstructions}`,
      link: `/collection/${collection.id}`,
      metadata: {
        itemReference: claim.item.referenceNumber,
        itemName: claim.item.itemName,
        location: data.collectionLocation,
        scheduledAt: scheduledDate.toLocaleString(),
      },
    });

    return collection;
  }

  static async confirmCollection(id: string, actorId: string, actorRole: string, handoverNotes?: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        claim: {
          include: {
            item: true,
            claimant: true,
          },
        },
      },
    });

    if (!collection) {
      throw { statusCode: 404, message: 'Collection record not found.' };
    }

    // Must be admin or finder
    if (collection.claim.item.reporterId !== actorId && actorRole !== 'ADMIN') {
      throw { statusCode: 403, message: 'Only campus administrators or the item finder can confirm item handover.' };
    }

    if (collection.status === 'COLLECTED') {
      throw { statusCode: 400, message: 'This collection has already been confirmed as collected.' };
    }

    const now = new Date();

    const confirmed = await prisma.$transaction(async (tx) => {
      const updatedCollection = await tx.collection.update({
        where: { id },
        data: {
          status: 'COLLECTED',
          collectedAt: now,
          confirmedById: actorId,
          handoverNotes: handoverNotes || 'Handover verified and completed successfully.',
        },
        include: {
          claim: {
            include: { item: true, claimant: true },
          },
          confirmedBy: {
            select: { id: true, fullName: true, role: true },
          },
        },
      });

      // Update item status to RETURNED
      await tx.item.update({
        where: { id: collection.claim.itemId },
        data: { status: 'RETURNED' },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'COLLECTION_CONFIRMED',
          entityType: 'COLLECTION',
          entityId: id,
          details: `Confirmed item handover for ${collection.claim.item.referenceNumber}. Collected by ${collection.claim.claimant.fullName}`,
        },
      });

      return updatedCollection;
    });

    // Notify claimant
    await NotificationClient.send({
      userId: collection.claim.claimantId,
      type: 'ITEM_RETURNED',
      title: 'Item Handover Completed',
      message: `Your item "${collection.claim.item.itemName}" has been officially marked as collected and returned. Thank you for using CampusConnect!`,
      link: `/dashboard`,
      metadata: {
        itemReference: collection.claim.item.referenceNumber,
        itemName: collection.claim.item.itemName,
      },
    });

    return confirmed;
  }

  static async getCollectionById(id: string, currentUserId: string, userRole: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        claim: {
          include: {
            item: {
              include: { images: true, category: true },
            },
            claimant: {
              select: { id: true, fullName: true, email: true, studentId: true, department: true },
            },
          },
        },
        confirmedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    if (!collection) {
      throw { statusCode: 404, message: 'Collection record not found.' };
    }

    const isClaimant = collection.claim.claimantId === currentUserId;
    const isFinder = collection.claim.item.reporterId === currentUserId;
    const isAdmin = userRole === 'ADMIN';

    if (!isClaimant && !isFinder && !isAdmin) {
      throw { statusCode: 403, message: 'Access denied to this collection record.' };
    }

    return collection;
  }
}
