import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../validations/task.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTaskById);

// Drag-and-drop status update (Accessible by Faculty, Admin, or Student assigned to the task)
router.patch('/:id/status', validate(updateTaskStatusSchema), updateTaskStatus);

// Task mutations by Faculty or Admin
router.post('/', authorize('ADMIN', 'FACULTY'), validate(createTaskSchema), createTask);
router.patch('/:id', authorize('ADMIN', 'FACULTY'), validate(updateTaskSchema), updateTask);
router.delete('/:id', authorize('ADMIN', 'FACULTY'), deleteTask);

export default router;
