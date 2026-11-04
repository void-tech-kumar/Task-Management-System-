import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum(['ADMIN', 'FACULTY', 'STUDENT']),
    department: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    role: z.enum(['ADMIN', 'FACULTY', 'STUDENT']).optional(),
    department: z.string().optional(),
    password: z.string().min(6).optional(),
  }),
});

