import { prisma } from '../prisma';

export type AuditAction = 'CONNECTED' | 'DISCONNECTED' | 'SYNC_STARTED' | 'SYNC_COMPLETED' | 'SYNC_FAILED';
export type AuditProvider = 'STRIPE' | 'GOHIGHLEVEL';

interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  provider: AuditProvider;
  accountId?: string;
  error?: string;
}

class AuditService {
  async log(entry: AuditLogEntry): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] AUDIT | User: ${entry.userId} | Action: ${entry.action} | Provider: ${entry.provider} | AccountId: ${entry.accountId || 'N/A'}${entry.error ? ` | Error: ${entry.error}` : ''}`;

    console.log(logMessage);

    // Store in database for compliance and audit trail
    try {
      // Use WebhookEvent table to store audit events with special marker
      await prisma.webhookEvent.create({
        data: {
          userId: entry.userId,
          provider: entry.provider,
          externalId: `audit_${entry.action}_${Date.now()}`,
          eventType: `AUDIT:${entry.action}`,
          payload: {
            action: entry.action,
            accountId: entry.accountId,
            error: entry.error,
            timestamp,
          },
          processed: true,
          processedAt: new Date(),
        },
      });
    } catch (err) {
      // Don't fail the main operation if audit logging fails
      console.error(`Failed to store audit log: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async logConnection(userId: string, provider: AuditProvider, accountId: string): Promise<void> {
    await this.log({
      userId,
      action: 'CONNECTED',
      provider,
      accountId,
    });
  }

  async logDisconnection(userId: string, provider: AuditProvider, accountId?: string): Promise<void> {
    await this.log({
      userId,
      action: 'DISCONNECTED',
      provider,
      accountId,
    });
  }

  async logSyncStarted(userId: string, provider: AuditProvider): Promise<void> {
    await this.log({
      userId,
      action: 'SYNC_STARTED',
      provider,
    });
  }

  async logSyncCompleted(userId: string, provider: AuditProvider): Promise<void> {
    await this.log({
      userId,
      action: 'SYNC_COMPLETED',
      provider,
    });
  }

  async logSyncFailed(userId: string, provider: AuditProvider, error: string): Promise<void> {
    await this.log({
      userId,
      action: 'SYNC_FAILED',
      provider,
      error,
    });
  }
}

export const auditService = new AuditService();
