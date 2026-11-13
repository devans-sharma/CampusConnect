import { prisma } from '../config/prisma.js';

export class AdminService {
  static async getDashboardMetrics() {
    const [
      totalStudents,
      totalLost,
      totalFound,
      activeListings,
      pendingClaims,
      approvedClaims,
      completedCollections,
      categories,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.item.count({ where: { itemType: 'LOST' } }),
      prisma.item.count({ where: { itemType: 'FOUND' } }),
      prisma.item.count({ where: { status: 'ACTIVE' } }),
      prisma.claim.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      prisma.claim.count({ where: { status: 'APPROVED' } }),
      prisma.collection.count({ where: { status: 'COLLECTED' } }),
      prisma.category.findMany({
        include: {
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, fullName: true, role: true, email: true },
          },
        },
      }),
    ]);

    // Locations frequency query
    const items = await prisma.item.findMany({
      select: { location: true },
    });
    const locationCounts: Record<string, number> = {};
    for (const item of items) {
      const loc = item.location.split('-')[0].trim();
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    }
    const topLocations = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Monthly breakdown (synthetic aggregation from DB items)
    const itemsWithDates = await prisma.item.findMany({
      select: { createdAt: true, itemType: true },
    });
    const monthlyStats: Record<string, { lost: number; found: number }> = {};
    for (const it of itemsWithDates) {
      const month = it.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyStats[month]) monthlyStats[month] = { lost: 0, found: 0 };
      if (it.itemType === 'LOST') monthlyStats[month].lost++;
      else monthlyStats[month].found++;
    }

    return {
      overview: {
        totalStudents,
        totalLost,
        totalFound,
        totalItems: totalLost + totalFound,
        activeListings,
        pendingClaims,
        approvedClaims,
        completedCollections,
        reuniteRate: totalFound > 0 ? Math.round((completedCollections / totalFound) * 100) : 0,
      },
      categoryDistribution: categories.map(c => ({
        id: c.id,
        name: c.name,
        count: c._count.items,
        icon: c.icon,
      })),
      topLocations,
      monthlyStats,
      recentAuditLogs,
    };
  }

  static async getUsers(params: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.role) where.role = params.role;
    if (params.status) where.accountStatus = params.status;

    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { fullName: { contains: term } },
        { email: { contains: term } },
        { studentId: { contains: term } },
        { department: { contains: term } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          studentId: true,
          department: true,
          yearOfStudy: true,
          role: true,
          accountStatus: true,
          createdAt: true,
          _count: {
            select: {
              items: true,
              claims: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async toggleUserStatus(userId: string, adminId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, message: 'User not found.' };
    }

    if (user.role === 'ADMIN') {
      throw { statusCode: 400, message: 'Cannot suspend an administrator account.' };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { accountStatus: status },
      select: { id: true, fullName: true, email: true, accountStatus: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: `USER_${status}`,
        entityType: 'USER',
        entityId: userId,
        details: `Administrator changed status of ${user.email} to ${status}`,
      },
    });

    return updated;
  }
}
