import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/apiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = req.query.role as Role | undefined;
    const department = req.query.department as string | undefined;
    const search = req.query.search as string | undefined;

    const whereClause: any = {};
    if (role && Object.values(Role).includes(role)) {
      whereClause.role = role;
    }
    if (department) {
      whereClause.department = department;
    }
    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            projectsCreated: true,
            memberships: true,
            assignedTasks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendResponse({
      res,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudents = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        email: true,
        fullName: true,
        department: true,
        avatarUrl: true,
      },
      orderBy: { fullName: 'asc' },
    });

    sendResponse({
      res,
      data: { students },
    });
  } catch (error) {
    next(error);
  }
};

export const getFaculty = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const faculty = await prisma.user.findMany({
      where: { role: 'FACULTY' },
      select: {
        id: true,
        email: true,
        fullName: true,
        department: true,
        avatarUrl: true,
      },
      orderBy: { fullName: 'asc' },
    });

    sendResponse({
      res,
      data: { faculty },
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, fullName, role, department } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return next(new AppError('A user with this email address already exists.', 409));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        role: role as Role,
        department: department || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    sendResponse({
      res,
      statusCode: 201,
      message: 'User created successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { fullName, role, department, password } = req.body;

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role as Role;
    if (department !== undefined) updateData.department = department;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    sendResponse({
      res,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (req.user?.userId === id) {
      return next(new AppError('You cannot delete your own admin account.', 400));
    }

    await prisma.user.delete({
      where: { id },
    });

    sendResponse({
      res,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
