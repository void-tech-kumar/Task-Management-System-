import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment text cannot be empty').max(2000, 'Comment too long'),
  }),
});

