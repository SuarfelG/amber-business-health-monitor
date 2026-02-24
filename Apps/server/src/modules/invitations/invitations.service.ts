import { randomBytes } from 'crypto';
import { prisma } from '../../prisma';

export class InvitationsService {
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async createInvitation(userId: string) {
    try {
      const token = this.generateToken();
      console.log(`[InvitationsService] Creating invitation for user: ${userId}, token: ${token.substring(0, 10)}...`);

      const invitation = await prisma.invitation.create({
        data: {
          userId,
          token,
        },
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

    return invitation;
  }

  async submitFeedback(
    token: string,
    expertName: string,
    opinion: string
  ) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
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
