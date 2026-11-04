import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Project title must be at least 3 characters'),
    code: z.string().min(2, 'Course code is required (e.g., CS401)').toUpperCase(),
    description: z.string().optional(),
    department: z.string().optional(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    memberStudentIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  }),
});

export const addProjectMembersSchema = z.object({
  body: z.object({
    studentIds: z.array(z.string().uuid()).min(1, 'Provide at least one student ID'),
  }),
});
