import { config } from '../config';
import { prisma } from '../prisma';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  type: 'invitation' | 'feedback' | 'password-reset' | 'alert';
}

export class EmailService {
  private isDev = config.nodeEnv === 'development';

  async send(userId: string, options: EmailOptions): Promise<boolean> {
    try {
      if (this.isDev) {
        return this.sendDev(userId, options);
      }

      // Production: use Resend
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const result = await resend.emails.send({
        from: 'noreply@amber.health',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Log success
      await this.logEmail(userId, options, 'sent');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Email] Failed to send ${options.type} to ${options.to}:`, errorMsg);

      // Log failure
      await this.logEmail(userId, options, 'failed', errorMsg);
      return false;
    }
  }

  private async sendDev(userId: string, options: EmailOptions): Promise<boolean> {
    console.log(`\n[📧 EMAIL] ${options.type.toUpperCase()}`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`---`);
    console.log(options.html);
    console.log(`---\n`);

    // Log to database even in dev
    await this.logEmail(userId, options, 'sent');
    return true;
  }

  private async logEmail(
    userId: string,
    options: EmailOptions,
    status: string,
    error?: string
  ): Promise<void> {
    try {
      await prisma.emailLog.create({
        data: {
          userId,
          type: options.type,
          recipient: options.to,
          subject: options.subject,
          status,
          error: error || null,
        },
      });
    } catch (err) {
      console.error('[Email] Failed to log email:', err);
    }
  }

  // Template: Invitation email
  invitationTemplate(ownerName: string, feedbackLink: string): string {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .content { color: #333; line-height: 1.6; }
      .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">Amber</h1>
        <p style="color: #999; margin: 5px 0;">Business Health Monitor</p>
      </div>

      <div class="content">
        <p>Hello,</p>

        <p>${ownerName} is sharing their business health snapshot with you and would value your expert feedback.</p>

        <p>Review their metrics and share your insights on:</p>
        <ul>
          <li>Revenue trends</li>
          <li>Lead generation</li>
          <li>Client show rates</li>
          <li>Overall business health</li>
        </ul>

        <a href="${feedbackLink}" class="button">Review & Share Feedback</a>

        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          This link expires in 30 days. No account needed—just view and provide feedback.
        </p>
      </div>

      <div class="footer">
        <p>© Amber Business Health Monitor</p>
      </div>
    </div>
  </body>
</html>
    `;
  }

  // Template: Feedback received email
  feedbackReceivedTemplate(expertName: string, opinion: string): string {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .content { color: #333; line-height: 1.6; }
      .feedback-box { background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #000; }
      .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">Amber</h1>
        <p style="color: #999; margin: 5px 0;">Business Health Monitor</p>
      </div>

      <div class="content">
        <p>Good news! You've received feedback from <strong>${expertName}</strong>.</p>

        <div class="feedback-box">
          <p style="margin: 0; font-style: italic;">"${opinion}"</p>
        </div>

        <p>Log in to your dashboard to see all feedback and insights from your advisors.</p>

        <a href="https://amber.health/dashboard" class="button">View Your Dashboard</a>
      </div>

      <div class="footer">
        <p>© Amber Business Health Monitor</p>
      </div>
    </div>
  </body>
</html>
    `;
  }

  // Template: Password reset email
  passwordResetTemplate(resetLink: string): string {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .content { color: #333; line-height: 1.6; }
      .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .warning { background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
      .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">Amber</h1>
        <p style="color: #999; margin: 5px 0;">Business Health Monitor</p>
      </div>

      <div class="content">
        <p>We received a request to reset your password. Click the button below to create a new password.</p>

        <a href="${resetLink}" class="button">Reset Password</a>

        <div class="warning">
          <p style="margin: 0;"><strong>This link expires in 1 hour.</strong></p>
        </div>

        <p>If you didn't request this, you can ignore this email. Your password hasn't been changed.</p>
      </div>

      <div class="footer">
        <p>© Amber Business Health Monitor</p>
      </div>
    </div>
  </body>
</html>
    `;
  }
}

export const emailService = new EmailService();
