import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { invitationsService } from './invitations.service';
import { config } from '../../config';

export class InvitationsController {
  async createInvitation(req: AuthRequest, res: Response) {
    try {
      console.log('[Invitations] createInvitation called, userId:', req.userId);

      if (!req.userId) {
        console.log('[Invitations] Missing userId, returning 401');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const invitation = await invitationsService.createInvitation(req.userId);
      console.log('[Invitations] Invitation created:', invitation.id);

      const invitationUrl = `${config.frontendUrl}/expert/${invitation.token}`;

      return res.status(201).json({
        id: invitation.id,
        token: invitation.token,
        url: invitationUrl,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invitation';
      const isDatabaseError = errorMessage.includes('Can\'t reach database') ||
                             errorMessage.includes('relation') ||
                             errorMessage.includes('connect');

      console.error('[Invitations] Error creating invitation:', errorMessage);

      if (isDatabaseError) {
        console.error('[Invitations] ⚠️  DATABASE CONNECTION ERROR - Make sure PostgreSQL is running and DATABASE_URL is correct');
        return res.status(503).json({
          error: 'Database connection failed. Make sure PostgreSQL is running.',
          details: errorMessage
        });
      }

      return res.status(400).json({ error: errorMessage });
    }
  }

  async getInvitation(req: AuthRequest, res: Response) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const invitation = await invitationsService.getInvitation(token);

      return res.json({
        user: invitation.user,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid invitation';
      return res.status(404).json({ error: message });
    }
  }

  async submitFeedback(req: AuthRequest, res: Response) {
    try {
      const { token } = req.params;
      const { expertName, opinion } = req.body;

      if (!token || !expertName || !opinion) {
        return res.status(400).json({
          error: 'Token, expert name, and opinion are required',
        });
      }

      if (opinion.trim().length === 0) {
        return res.status(400).json({ error: 'Opinion cannot be empty' });
      }

      const feedback = await invitationsService.submitFeedback(
        token,
        expertName,
        opinion
      );

      return res.status(201).json({
        id: feedback.id,
        expertName: feedback.expertName,
        opinion: feedback.opinion,
        createdAt: feedback.createdAt,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit feedback';
      return res.status(400).json({ error: message });
    }
  }

  async getFeedback(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const feedback = await invitationsService.getFeedback(req.userId);

      return res.json(feedback);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch feedback';
      return res.status(400).json({ error: message });
    }
  }

  async getInvitations(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const invitations = await invitationsService.getInvitations(req.userId);

      return res.json(invitations);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch invitations';
      return res.status(400).json({ error: message });
    }
  }
}

export const invitationsController = new InvitationsController();
