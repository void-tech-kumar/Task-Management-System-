import { z } from 'zod';

export const submitTaskSchema = z.object({
  body: z.object({
    content: z.string().min(5, 'Submission notes or work description required (min 5 characters)'),
    attachmentUrl: z.string().url('Attachment must be a valid URL (GitHub, Drive, Docs, etc.)').optional().or(z.literal('')),
  }),
});

export const evaluateSubmissionSchema = z.object({
  body: z.object({
    grade: z.number().min(0, 'Grade cannot be negative').max(1000, 'Grade exceeds maximum bounds'),
    feedback: z.string().min(2, 'Evaluation feedback is required'),
    status: z.enum(['EVALUATED', 'RESUBMIT_REQUESTED']).default('EVALUATED'),
  }),
});
