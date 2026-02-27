import { HealthSignal, RevenueMetricInput, CRMMetricInput } from './types';

/**
 * Revenue Signal (40% weight)
 * Compares net revenue trend YoY or period-over-period
 */
export function evaluateRevenueSignal(
  current: RevenueMetricInput | null | undefined,
  previous: RevenueMetricInput | null | undefined
): HealthSignal | null {
  if (!current || !previous) return null;

  const currentRev = current.netRevenue;
  const previousRev = previous.netRevenue;

  // Both periods have no revenue
  if (currentRev === 0 && previousRev === 0) return null;

  // Previous was 0, current has revenue → GREEN (new activity)
  if (previousRev === 0 && currentRev > 0) {
    return {
      name: 'Revenue',
      status: 'GREEN',
      weight: 40,
      reason: 'Revenue generated after quiet period',
    };
  }

  // Current is 0, previous had revenue → RED
  if (currentRev === 0) {
    return {
      name: 'Revenue',
      status: 'RED',
      weight: 40,
      reason: 'No revenue this period',
    };
  }

  const trendPercent = ((currentRev - previousRev) / previousRev) * 100;

  let status: 'GREEN' | 'YELLOW' | 'RED';
  if (trendPercent >= -5) {
    status = 'GREEN';
  } else if (trendPercent >= -20) {
    status = 'YELLOW';
  } else {
    status = 'RED';
  }

  const trendStr = trendPercent >= 0 ? '+' : '';
  const reason =
    status === 'GREEN'
      ? 'Revenue stable or growing'
      : status === 'YELLOW'
        ? `Revenue down ${trendStr}${trendPercent.toFixed(0)}%`
        : `Revenue declining significantly (${trendStr}${trendPercent.toFixed(0)}%)`;

  return { name: 'Revenue', status, weight: 40, reason };
}

/**
 * Leads Signal (30% weight)
 * Compares new leads trend
 */
export function evaluateLeadsSignal(
  current: CRMMetricInput | null | undefined,
  previous: CRMMetricInput | null | undefined
): HealthSignal | null {
  if (!current || !previous) return null;

  const currentLeads = current.newLeads;
  const previousLeads = previous.newLeads;

  // Both periods have no leads
  if (currentLeads === 0 && previousLeads === 0) return null;

  // Previous was 0, current has leads → GREEN
  if (previousLeads === 0 && currentLeads > 0) {
    return {
      name: 'Leads',
      status: 'GREEN',
      weight: 30,
      reason: 'New leads generated',
    };
  }

  // Current is 0, previous had leads → RED
  if (currentLeads === 0) {
    return {
      name: 'Leads',
      status: 'RED',
      weight: 30,
      reason: 'No new leads this period',
    };
  }

  const trendPercent = ((currentLeads - previousLeads) / previousLeads) * 100;

  let status: 'GREEN' | 'YELLOW' | 'RED';
  if (trendPercent >= -10) {
    status = 'GREEN';
  } else if (trendPercent >= -40) {
    status = 'YELLOW';
  } else {
    status = 'RED';
  }

  const trendStr = trendPercent >= 0 ? '+' : '';
  const reason =
    status === 'GREEN'
      ? 'Lead generation healthy'
      : status === 'YELLOW'
        ? `Leads down ${trendStr}${trendPercent.toFixed(0)}%`
        : `Lead generation declining (${trendStr}${trendPercent.toFixed(0)}%)`;

  return { name: 'Leads', status, weight: 30, reason };
}

/**
 * Show Rate Signal (15% weight)
 * Absolute show rate percentage
 */
export function evaluateShowRateSignal(
  current: CRMMetricInput | null | undefined
): HealthSignal | null {
  if (!current) return null;

  // Skip if not enough bookings to be meaningful
  if (current.appointmentsBooked < 3) return null;

  const showRate = current.showRate; // already a decimal/percentage

  let status: 'GREEN' | 'YELLOW' | 'RED';
  if (showRate >= 0.7) {
    status = 'GREEN';
  } else if (showRate >= 0.5) {
    status = 'YELLOW';
  } else {
    status = 'RED';
  }

  const percent = (showRate * 100).toFixed(0);
  const reason =
    status === 'GREEN'
      ? `Show rate healthy at ${percent}%`
      : status === 'YELLOW'
        ? `Show rate at ${percent}% (target 70%+)`
        : `Show rate low at ${percent}% (target 70%+)`;

  return { name: 'Show Rate', status, weight: 15, reason };
}

/**
 * Refund Rate Signal (15% weight)
 * Percentage of refunded charges
 */
export function evaluateRefundRateSignal(
  current: RevenueMetricInput | null | undefined
): HealthSignal | null {
  if (!current) return null;

  // Skip if not enough charges to be meaningful
  if (current.chargeCount < 5) return null;

  const refundRate = current.refundCount / current.chargeCount;

  let status: 'GREEN' | 'YELLOW' | 'RED';
  if (refundRate < 0.05) {
    status = 'GREEN';
  } else if (refundRate < 0.15) {
    status = 'YELLOW';
  } else {
    status = 'RED';
  }

  const percent = (refundRate * 100).toFixed(1);
  const reason =
    status === 'GREEN'
      ? `Refund rate low at ${percent}%`
      : status === 'YELLOW'
        ? `Refund rate at ${percent}% (elevated)`
        : `Refund rate high at ${percent}% (concerning)`;

  return { name: 'Refund Rate', status, weight: 15, reason };
}
