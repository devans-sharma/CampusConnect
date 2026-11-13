import { prisma } from '../config/prisma.js';
import { generateItemReferenceNumber } from '../utils/refGenerator.js';
import { MatchingEngine } from '../domain/matchingEngine.js';
import { LostItemStatus, FoundItemStatus } from '../domain/enums.js';

export interface ItemFilters {
  search?: string;
  itemType?: 'LOST' | 'FOUND';
  categoryId?: string;
  location?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export class ItemService {
  /**
   * Sanitizes item objects so that privateVerificationDetails is NEVER leaked
   * unless the requesting user is the reporter or an ADMIN.
   */
  static sanitizeItem(item: any, currentUserId?: string, userRole?: string): any {
    if (!item) return null;

    const isAuthorized = (currentUserId && item.reporterId === currentUserId) || userRole === 'ADMIN';

    if (!isAuthorized) {
      const sanitized = { ...item };
      delete sanitized.privateVerificationDetails;
      return sanitized;
    }

    return item;
  }

  static async createItem(data: {
    reporterId: string;
    itemName: string;
    categoryId: string;
    itemType: 'LOST' | 'FOUND';
    publicDescription: string;
    privateVerificationDetails?: string;
    location: string;
    dateOccurred: string;
    colour?: string;
    brand?: string;
    distinguishingFeatures?: string;
    currentHoldingLocation?: string;
    contactPreference?: string;
    imageUrls?: string[];
    primaryImageIndex?: number;
  }) {
    const referenceNumber = generateItemReferenceNumber();

    const initialStatus = 'ACTIVE';

    const item = await prisma.$transaction(async (tx) => {
      const createdItem = await tx.item.create({
        data: {
          referenceNumber,
          reporterId: data.reporterId,
          itemName: data.itemName,
          categoryId: data.categoryId,
          itemType: data.itemType,
          publicDescription: data.publicDescription,
          privateVerificationDetails: data.privateVerificationDetails || null,
          location: data.location,
          dateOccurred: new Date(data.dateOccurred),
          colour: data.colour || null,
          brand: data.brand || null,
          distinguishingFeatures: data.distinguishingFeatures || null,
          currentHoldingLocation: data.currentHoldingLocation || (data.itemType === 'FOUND' ? 'With Finder' : null),
          contactPreference: data.contactPreference || 'IN_APP',
          status: initialStatus,
        },
      });

      // Insert images if provided
      if (data.imageUrls && data.imageUrls.length > 0) {
        const primaryIdx = data.primaryImageIndex ?? 0;
        await tx.itemImage.createMany({
          data: data.imageUrls.slice(0, 5).map((url, idx) => ({
            itemId: createdItem.id,
            imageUrl: url,
            isPrimary: idx === primaryIdx,
          })),
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: data.reporterId,
          action: 'ITEM_CREATED',
          entityType: 'ITEM',
          entityId: createdItem.id,
          details: `Reported ${data.itemType} item: ${data.itemName} (${referenceNumber})`,
        },
      });

      return tx.item.findUnique({
        where: { id: createdItem.id },
        include: {
          category: true,
          images: true,
          reporter: {
            select: {
              id: true,
              fullName: true,
              department: true,
              profileImage: true,
            },
          },
        },
      });
    });

    // Check potential matches if it's a LOST item
    let potentialMatches: any[] = [];
    if (data.itemType === 'LOST') {
      const candidateFoundItems = await prisma.item.findMany({
        where: {
          itemType: 'FOUND',
          status: { in: ['ACTIVE', 'CLAIM_PENDING'] },
        },
        include: {
          category: true,
          images: true,
        },
      });
      potentialMatches = MatchingEngine.findMatches(item, candidateFoundItems);
    }

    return {
      item,
      potentialMatches: potentialMatches.slice(0, 5),
    };
  }

  static async getItems(filters: ItemFilters, currentUserId?: string, userRole?: string) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 12));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.itemType) {
      where.itemType = filters.itemType;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.location) {
      where.location = { contains: filters.location };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.dateOccurred = {};
      if (filters.dateFrom) where.dateOccurred.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.dateOccurred.lte = new Date(filters.dateTo);
    }

    if (filters.search) {
      const term = filters.search.trim();
      where.OR = [
        { itemName: { contains: term } },
        { publicDescription: { contains: term } },
        { brand: { contains: term } },
        { colour: { contains: term } },
        { location: { contains: term } },
        { referenceNumber: { contains: term } },
      ];
    }

    const orderBy: any = filters.sortBy === 'oldest' 
      ? { createdAt: 'asc' } 
      : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          images: true,
          reporter: {
            select: {
              id: true,
              fullName: true,
              department: true,
              profileImage: true,
            },
          },
          _count: {
            select: { claims: true },
          },
        },
      }),
      prisma.item.count({ where }),
    ]);

    // Sanitize items so private details are hidden
    const sanitizedItems = items.map(item => this.sanitizeItem(item, currentUserId, userRole));

    return {
      items: sanitizedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getItemById(id: string, currentUserId?: string, userRole?: string) {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            department: true,
            yearOfStudy: true,
            profileImage: true,
          },
        },
        claims: {
          select: {
            id: true,
            referenceNumber: true,
            claimantId: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!item) {
      throw { statusCode: 404, message: 'Item listing not found.' };
    }

    // Similar / related items from the same category
    const similarItems = await prisma.item.findMany({
      where: {
        categoryId: item.categoryId,
        id: { not: item.id },
        status: { in: ['ACTIVE', 'CLAIM_PENDING'] },
      },
      take: 4,
      include: {
        category: true,
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const sanitizedSimilar = similarItems.map(sim => this.sanitizeItem(sim, currentUserId, userRole));

    // Calculate potential matches if requested
    let potentialMatches: any[] = [];
    const oppositeType = item.itemType === 'LOST' ? 'FOUND' : 'LOST';
    const candidateMatches = await prisma.item.findMany({
      where: {
        itemType: oppositeType,
        id: { not: item.id },
        status: { in: ['ACTIVE', 'CLAIM_PENDING'] },
      },
      include: {
        category: true,
        images: true,
      },
      take: 20,
    });
    potentialMatches = MatchingEngine.findMatches(item, candidateMatches).slice(0, 4);

    return {
      item: this.sanitizeItem(item, currentUserId, userRole),
      similarItems: sanitizedSimilar,
      potentialMatches,
    };
  }

  static async updateItem(id: string, userId: string, userRole: string, data: any) {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw { statusCode: 404, message: 'Item not found.' };
    }

    if (item.reporterId !== userId && userRole !== 'ADMIN') {
      throw { statusCode: 403, message: 'You are not authorized to edit this listing.' };
    }

    const updated = await prisma.item.update({
      where: { id },
      data: {
        itemName: data.itemName ?? item.itemName,
        categoryId: data.categoryId ?? item.categoryId,
        publicDescription: data.publicDescription ?? item.publicDescription,
        privateVerificationDetails: data.privateVerificationDetails ?? item.privateVerificationDetails,
        location: data.location ?? item.location,
        colour: data.colour ?? item.colour,
        brand: data.brand ?? item.brand,
        distinguishingFeatures: data.distinguishingFeatures ?? item.distinguishingFeatures,
        currentHoldingLocation: data.currentHoldingLocation ?? item.currentHoldingLocation,
        contactPreference: data.contactPreference ?? item.contactPreference,
      },
      include: {
        category: true,
        images: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'ITEM_UPDATED',
        entityType: 'ITEM',
        entityId: id,
        details: `Updated details for item: ${item.referenceNumber}`,
      },
    });

    return updated;
  }

  static async deleteItem(id: string, userId: string, userRole: string) {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw { statusCode: 404, message: 'Item not found.' };
    }

    if (item.reporterId !== userId && userRole !== 'ADMIN') {
      throw { statusCode: 403, message: 'You are not authorized to delete this listing.' };
    }

    await prisma.$transaction([
      prisma.itemImage.deleteMany({ where: { itemId: id } }),
      prisma.item.delete({ where: { id } }),
      prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'ITEM_DELETED',
          entityType: 'ITEM',
          entityId: id,
          details: `Deleted item listing: ${item.referenceNumber} (${item.itemName})`,
        },
      }),
    ]);

    return { message: 'Item listing deleted successfully.' };
  }

  static async updateStatus(id: string, userId: string, userRole: string, newStatus: string) {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw { statusCode: 404, message: 'Item not found.' };
    }

    if (item.reporterId !== userId && userRole !== 'ADMIN') {
      throw { statusCode: 403, message: 'You are not authorized to change this item status.' };
    }

    // Business rule: Check valid lifecycle
    if (item.itemType === 'LOST') {
      const validLost = Object.values(LostItemStatus);
      if (!validLost.includes(newStatus as any)) {
        throw { statusCode: 400, message: `Invalid status transition for LOST item: ${newStatus}` };
      }
    } else {
      const validFound = Object.values(FoundItemStatus);
      if (!validFound.includes(newStatus as any)) {
        throw { statusCode: 400, message: `Invalid status transition for FOUND item: ${newStatus}` };
      }
    }

    const updated = await prisma.item.update({
      where: { id },
      data: { status: newStatus },
      include: { category: true, images: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'ITEM_STATUS_UPDATED',
        entityType: 'ITEM',
        entityId: id,
        details: `Item ${item.referenceNumber} status changed from ${item.status} to ${newStatus}`,
      },
    });

    return updated;
  }
}
