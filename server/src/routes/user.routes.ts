import { Router } from 'express';
import {
  getUsers,
  getStudents,
  getFaculty,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../validations/user.validation.js';

const router = Router();

router.use(authenticate);

// Faculty & Admin can list students/faculty for dropdowns
router.get('/students', authorize('ADMIN', 'FACULTY'), getStudents);
router.get('/faculty', authorize('ADMIN', 'FACULTY', 'STUDENT'), getFaculty);

// Admin-only user governance
router.get('/', authorize('ADMIN'), getUsers);
router.post('/', authorize('ADMIN'), validate(createUserSchema), createUser);
router.patch('/:id', authorize('ADMIN'), validate(updateUserSchema), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;

