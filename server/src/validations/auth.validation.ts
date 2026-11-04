import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum(['ADMIN', 'FACULTY', 'STUDENT']).default('STUDENT'),
    department: z.string().optional(),
  }),
});

export const signupInitSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid college email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    department: z.string().optional(),
  }),
});

export const signupVerifySchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    otp: z.string().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
  }),
});

export const loginOtpInitSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
  }),
});

export const loginOtpVerifySchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    otp: z.string().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    purpose: z.enum(['STUDENT_SIGNUP', 'LOGIN', 'PASSWORD_RESET']),
  }),
});
