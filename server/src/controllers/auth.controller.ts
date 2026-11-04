import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/apiResponse.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { OtpService } from '../services/otp.service.js';
import { emailService } from '../services/email.service.js';
import { Role, OtpPurpose } from '@prisma/client';

/**
 * Standard password login (supports demo accounts and direct login)
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    setAuthCookie(res, token);

    sendResponse({
      res,
      statusCode: 200,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          avatarUrl: user.avatarUrl,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 1: Student self-registration initialization with email OTP
 */
export const studentSignupInit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, fullName, department } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.isVerified) {
      return next(new AppError('An account with this email address is already registered.', 409));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create OTP and store registration payload in metadata
    const { otp, expiresAt, resendAfter } = await OtpService.createOtp(
      normalizedEmail,
      OtpPurpose.STUDENT_SIGNUP,
      {
        fullName,
        passwordHash,
        department: department || null,
        role: Role.STUDENT, // Strictly enforce STUDENT role; never trust frontend
      }
    );

    const emailResult = await emailService.sendOtpEmail(
      normalizedEmail,
      otp,
      'STUDENT_SIGNUP'
    );

    sendResponse({
      res,
      statusCode: 200,
      message: emailResult.sent
        ? 'A 6-digit verification code has been sent to your email.'
        : 'Verification code generated. Email delivery pending SMTP configuration in Vercel.',
      data: {
        email: normalizedEmail,
        expiresAt,
        resendAfter,
        smtpConfigured: emailService.isConfigured(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2: Student signup verification with OTP
 */
export const studentSignupVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const { success, metadata } = await OtpService.verifyOtp(
      normalizedEmail,
      otp,
      OtpPurpose.STUDENT_SIGNUP
    );

    if (!success || !metadata) {
      return next(new AppError('Invalid or expired verification code.', 400));
    }

    // Activate/create the user record
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        fullName: metadata.fullName,
        passwordHash: metadata.passwordHash,
        department: metadata.department,
        role: Role.STUDENT,
        isVerified: true,
      },
      create: {
        email: normalizedEmail,
        fullName: metadata.fullName,
        passwordHash: metadata.passwordHash,
        department: metadata.department,
        role: Role.STUDENT,
        isVerified: true,
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

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    setAuthCookie(res, token);

    sendResponse({
      res,
      statusCode: 201,
      message: 'Student account verified and activated successfully.',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login OTP Step 1: Request a 6-digit OTP for email login
 */
export const loginOtpInit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Prevent user enumeration: Always respond positively even if not registered
    if (!user) {
      sendResponse({
        res,
        statusCode: 200,
        message: 'If your email is registered, a verification code has been sent.',
        data: { email: normalizedEmail, smtpConfigured: emailService.isConfigured() },
      });
      return;
    }

    const { otp, expiresAt, resendAfter } = await OtpService.createOtp(
      normalizedEmail,
      OtpPurpose.LOGIN
    );

    await emailService.sendOtpEmail(normalizedEmail, otp, 'LOGIN');

    sendResponse({
      res,
      statusCode: 200,
      message: 'A 6-digit verification code has been sent to your registered email.',
      data: {
        email: normalizedEmail,
        expiresAt,
        resendAfter,
        smtpConfigured: emailService.isConfigured(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login OTP Step 2: Verify login OTP and authenticate
 */
export const loginOtpVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    await OtpService.verifyOtp(normalizedEmail, otp, OtpPurpose.LOGIN);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return next(new AppError('User account not found.', 404));
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    setAuthCookie(res, token);

    sendResponse({
      res,
      statusCode: 200,
      message: 'Login successful via email verification code.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          avatarUrl: user.avatarUrl,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend OTP with cooldown enforcement
 */
export const resendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, purpose } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const { otp, expiresAt, resendAfter } = await OtpService.createOtp(
      normalizedEmail,
      purpose as OtpPurpose
    );

    await emailService.sendOtpEmail(normalizedEmail, otp, purpose as OtpPurpose);

    sendResponse({
      res,
      statusCode: 200,
      message: 'A new 6-digit verification code has been sent.',
      data: {
        email: normalizedEmail,
        expiresAt,
        resendAfter,
        smtpConfigured: emailService.isConfigured(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check SMTP connection status
 */
export const getSmtpStatus = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isConfigured = emailService.isConfigured();
    if (!isConfigured) {
      sendResponse({
        res,
        statusCode: 200,
        data: {
          configured: false,
          status: 'BLOCKED',
          message: 'SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not yet configured.',
        },
      });
      return;
    }

    const verification = await emailService.verifyConnection();
    sendResponse({
      res,
      statusCode: 200,
      data: {
        configured: true,
        connected: verification.success,
        message: verification.message,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy admin/faculty user provisioning (Admin only)
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        role: role || 'STUDENT',
        department: department || null,
        isVerified: true,
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

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    setAuthCookie(res, token);

    sendResponse({
      res,
      statusCode: 201,
      message: 'Registration successful',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  clearAuthCookie(res);
  sendResponse({
    res,
    statusCode: 200,
    message: 'Logged out successfully',
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    sendResponse({
      res,
      statusCode: 200,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
