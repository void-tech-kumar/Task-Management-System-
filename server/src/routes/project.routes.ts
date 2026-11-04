import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  addProjectMembers,
  removeProjectMember,
  deleteProject,
} from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMembersSchema,
} from '../validations/project.validation.js';

const router = Router();

router.use(authenticate);

// View list and detail
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Faculty & Admin project mutations
router.post('/', authorize('ADMIN', 'FACULTY'), validate(createProjectSchema), createProject);
router.patch('/:id', authorize('ADMIN', 'FACULTY'), validate(updateProjectSchema), updateProject);
router.post(
  '/:id/members',
  authorize('ADMIN', 'FACULTY'),
  validate(addProjectMembersSchema),
  addProjectMembers
);
router.delete('/:id/members/:userId', authorize('ADMIN', 'FACULTY'), removeProjectMember);
router.delete('/:id', authorize('ADMIN', 'FACULTY'), deleteProject);

export default router;
