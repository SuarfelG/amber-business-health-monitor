import { Router } from 'express';
import { invitationsController } from './invitations.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

// Protected routes (require authentication)
router.post('/', authMiddleware, (req, res) =>
  invitationsController.createInvitation(req, res)
);

router.get('/list', authMiddleware, (req, res) =>
  invitationsController.getInvitations(req, res)
);

router.get('/feedback', authMiddleware, (req, res) =>
  invitationsController.getFeedback(req, res)
);

// Public routes (no authentication needed)
router.get('/:token', (req, res) =>
  invitationsController.getInvitation(req, res)
);

router.post('/:token/feedback', (req, res) =>
  invitationsController.submitFeedback(req, res)
);

export default router;
