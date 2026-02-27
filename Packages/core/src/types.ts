/**
 * Core input types for health scoring
 * No Prisma, no framework dependencies
 */

export interface RevenueMetricInput {
  netRevenue: number;
  totalRevenue: number;
  refundedRevenue: number;
  chargeCount: number;
  refundCount: number;
  customerCount: number;
  newCustomerCount: number;
  activeSubscriptions: number;
}

export interface CRMMetricInput {
  newLeads: number;
  appointmentsBooked: number;
  appointmentsShowed: number;
  showRate: number;
  opportunitiesWon: number;
  opportunitiesLost: number;
}

export interface MetricPeriod {
  revenue?: RevenueMetricInput | null;
  crm?: CRMMetricInput | null;
}

export interface HealthScoreInput {
  periodType: 'week' | 'month';
  current: MetricPeriod;
  previous: MetricPeriod;
}

export type HealthStatus = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';

export interface HealthSignal {
  name: string;
  status: HealthStatus;
  weight: number;
  reason: string;
}

export interface HealthScoreResult {
  status: HealthStatus;
  reasons: string[];
  recommendation: string;
  signals: HealthSignal[];
  periodType: 'week' | 'month';
  computedAt: string;
}
