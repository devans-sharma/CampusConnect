import { prisma } from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/passwords.js';
import { generateToken } from '../utils/jwt.js';

export class AuthService {
  static async register(data: {
    fullName: string;
    email: string;
    studentId: string;
    password: string;
    department: string;
    yearOfStudy: number;
    role?: string;
  }) {
    // 1. Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingEmail) {
      throw { statusCode: 409, message: 'An account with this university email already exists.' };
    }

    // 2. Check duplicate student ID
    const existingStudentId = await prisma.user.findUnique({
      where: { studentId: data.studentId.toUpperCase() },
    });
    if (existingStudentId) {
      throw { statusCode: 409, message: 'An account with this Student ID already exists.' };
    }

    // 3. Hash password
    const passwordHash = await hashPassword(data.password);

    // 4. Create User
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        studentId: data.studentId.toUpperCase(),
        passwordHash,
        department: data.department,
        yearOfStudy: data.yearOfStudy,
        role: data.role || 'STUDENT',
        accountStatus: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        studentId: true,
        department: true,
        yearOfStudy: true,
        role: true,
        accountStatus: true,
        profileImage: true,
        createdAt: true,
      },
    });

    // 5. Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_REGISTERED',
        entityType: 'USER',
        entityId: user.id,
        details: `Registered new account: ${user.email} (${user.role})`,
      },
    });

    // 6. Generate Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw { statusCode: 401, message: 'Invalid university email or password.' };
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw { statusCode: 403, message: 'Your account has been suspended by campus administration.' };
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid university email or password.' };
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        details: `User logged in from portal`,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const userProfile = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      studentId: user.studentId,
      department: user.department,
      yearOfStudy: user.yearOfStudy,
      role: user.role,
      accountStatus: user.accountStatus,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };

    return { user: userProfile, token };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        studentId: true,
        department: true,
        yearOfStudy: true,
        role: true,
        accountStatus: true,
        profileImage: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found.' };
    }

    return user;
  }
}
