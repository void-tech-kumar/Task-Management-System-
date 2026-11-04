import { Router } from 'express';
import {
  submitTask,
  getTaskSubmissions,
  getMySubmissions,
  getPendingEvaluations,
  evaluateSubmission,
} from '../controllers/submission.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  submitTaskSchema,
  evaluateSubmissionSchema,
} from '../validations/submission.validation.js';

const router = Router();

router.use(authenticate);

// Student submits deliverable
router.post('/tasks/:taskId/submit', validate(submitTaskSchema), submitTask);

// Student reviews own submissions
router.get('/my-submissions', getMySubmissions);

// Faculty & Admin view pending evaluations and task submissions
router.get('/pending', authorize('ADMIN', 'FACULTY'), getPendingEvaluations);
router.get('/tasks/:taskId', authorize('ADMIN', 'FACULTY'), getTaskSubmissions);

// Faculty & Admin grade submission
router.patch(
  '/:id/evaluate',
  authorize('ADMIN', 'FACULTY'),
  validate(evaluateSubmissionSchema),
  evaluateSubmission
);

export default router;

