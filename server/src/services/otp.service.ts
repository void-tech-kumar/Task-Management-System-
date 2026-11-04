import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { OtpPurpose } from '@prisma/client';

export class OtpService {
  private static readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
  private static readonly MAX_ATTEMPTS = 5;

  /**
   * Generates a cryptographically secure random 6-digit numeric OTP
   */
  public static generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Generates a secure HMAC-SHA256 hash of email + otp using the server-side OTP_SECRET
   */
  public static hashOtp(email: string, otp: string): string {
    const normalizedEmail = email.trim().toLowerCase();
    return crypto
      .createHmac('sha256', ENV.OTP_SECRET)
      .update(`${normalizedEmail}:${otp.trim()}`)
      .digest('hex');
  }

  /**
   * Creates or regenerates an OTP verification record with rate-limiting / cooldown
   */
  public static async createOtp(
    email: string,
    purpose: OtpPurpose,
    metadata?: any
  ): Promise<{ otp: string; expiresAt: Date; resendAfter: Date }> {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    // Check existing active OTP for cooldown
    const activeOtp = await prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeOtp && activeOtp.resendAfter > now) {
      const waitSeconds = Math.ceil((activeOtp.resendAfter.getTime() - now.getTime()) / 1000);
      throw new AppError(
        `Please wait ${waitSeconds} seconds before requesting a new verification code.`,
        429
      );
    }

    // Invalidate previous unconsumed OTPs for this email and purpose
    await prisma.otpVerification.updateMany({
      where: {
        email: normalizedEmail,
        purpose,
        consumedAt: null,
      },
      data: {
        consumedAt: now,
      },
    });

    const otp = this.generateOtp();
    const otpHash = this.hashOtp(normalizedEmail, otp);
    const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MS);
    const resendAfter = new Date(now.getTime() + this.RESEND_COOLDOWN_MS);

    await prisma.otpVerification.create({
      data: {
        email: normalizedEmail,
        otpHash,
        purpose,
        expiresAt,
        resendAfter,
        attempts: 0,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return { otp, expiresAt, resendAfter };
  }

  /**
   * Verifies an entered OTP with attempt-tracking and timing-safe comparison
   */
  public static async verifyOtp(
    email: string,
    otp: string,
    purpose: OtpPurpose
  ): Promise<{ success: boolean; metadata?: any }> {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    const record = await prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new AppError('Invalid or expired verification code. Please request a new one.', 400);
    }

    if (record.expiresAt < now) {
      throw new AppError('Verification code has expired. Please request a new one.', 400);
    }

    if (record.attempts >= this.MAX_ATTEMPTS) {
      throw new AppError(
        'Maximum verification attempts exceeded. Please request a new verification code.',
        429
      );
    }

    // Increment attempt counter
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    const enteredHash = this.hashOtp(normalizedEmail, otp);
    const recordHashBuffer = Buffer.from(record.otpHash, 'hex');
    const enteredHashBuffer = Buffer.from(enteredHash, 'hex');

    const isMatch =
      recordHashBuffer.length === enteredHashBuffer.length &&
      crypto.timingSafeEqual(recordHashBuffer, enteredHashBuffer);

    if (!isMatch) {
      const remaining = this.MAX_ATTEMPTS - (record.attempts + 1);
      if (remaining > 0) {
        throw new AppError(
          `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
          400
        );
      } else {
        throw new AppError(
          'Maximum verification attempts exceeded. Please request a new code.',
          429
        );
      }
    }

    // Mark as consumed (single-use OTP)
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { consumedAt: now },
    });

    let metadata: any = null;
    if (record.metadataJson) {
      try {
        metadata = JSON.parse(record.metadataJson);
      } catch {
        metadata = null;
      }
    }

    return { success: true, metadata };
  }
}

