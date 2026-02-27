import { randomBytes } from 'crypto';
import { prisma } from '../../prisma';
import { emailService } from '../../utils/email.service';
import { config } from '../../config';

export class InvitationsService {
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async createInvitation(userId: string) {
    try {
      // Fetch user to get name and email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const token = this.generateToken();
      console.log(`[InvitationsService] Creating invitation for user: ${userId}, token: ${token.substring(0, 10)}...`);

      const invitation = await prisma.invitation.create({
        data: {
          userId,
          token,
        },
      });

      // Send invitation email to user
      const feedbackLink = `${config.frontendUrl}/expert/${token}`;
      const html = emailService.invitationTemplate(user.name, feedbackLink);

      // Send email asynchronously (don't block response)
      emailService.send(userId, {
        to: user.email,
        subject: `${user.name} would like your business insights`,
        html,
        type: 'invitation',
      }).catch((err) => {
        console.error('[InvitationsService] Failed to send invitation email:', err);
      });

      console.log(`[InvitationsService] Invitation created successfully: ${invitation.id}`);
      return invitation;
    } catch (error) {
      console.error(`[InvitationsService] Database error:`, error);
      throw error;
    }
  }

  async getInvitation(token: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            businessName: true,
            timezone: true,
            currency: true,
            createdAt: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    // Import here to avoid circular dependencies
    const { getHealthScore } = await import('../snapshot/snapshot.service');

    // Fetch latest health scores for display
    const weeklyScore = await getHealthScore(invitation.user.id, 'week').catch(() => null);
    const monthlyScore = await getHealthScore(invitation.user.id, 'month').catch(() => null);

    return {
      ...invitation,
      weeklyScore,
      monthlyScore,
    };
  }

  async submitFeedback(
    token: string,
    expertName: string,
    opinion: string
  ) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    const feedback = await prisma.feedback.create({
      data: {
        invitationId: invitation.id,
        userId: invitation.userId,
        expertName,
        opinion,
      },
    });

    // Send email to owner notifying them of feedback
    const html = emailService.feedbackReceivedTemplate(expertName, opinion);

    emailService.send(invitation.userId, {
      to: invitation.user.email,
      subject: `New feedback from ${expertName}`,
      html,
      type: 'feedback',
    }).catch((err) => {
      console.error('[InvitationsService] Failed to send feedback email:', err);
    });

    return feedback;
  }

  async getFeedback(userId: string) {
    const feedback = await prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return feedback;
  }

  async getInvitations(userId: string) {
    const invitations = await prisma.invitation.findMany({
      where: { userId },
      include: {
        feedback: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  }
}

export const invitationsService = new InvitationsService();
