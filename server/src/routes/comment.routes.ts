import { Router } from 'express';
import { getComments, createComment, deleteComment } from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCommentSchema } from '../validations/comment.validation.js';

const router = Router();

router.use(authenticate);

router.get('/tasks/:taskId', getComments);
router.post('/tasks/:taskId', validate(createCommentSchema), createComment);
router.delete('/:id', deleteComment);

export default router;
