import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Task title must be at least 3 characters'),
    description: z.string().optional().nullable(),
    projectId: z.string().uuid('Valid project ID required'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    category: z.enum(['ASSIGNMENT', 'LAB_WORK', 'PROJECT_MILESTONE', 'READING', 'PERSONAL']).default('ASSIGNMENT'),
    dueDate: z.string().datetime('Valid due date required'),
    maxPoints: z.number().int().min(0).max(1000).default(100),
    assignedStudentIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    category: z.enum(['ASSIGNMENT', 'LAB_WORK', 'PROJECT_MILESTONE', 'READING', 'PERSONAL']).optional(),
    dueDate: z.string().datetime().optional(),
    maxPoints: z.number().int().min(0).max(1000).optional(),
    assignedStudentIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED']),
    orderIndex: z.number().int().nonnegative().optional(),
  }),
});
