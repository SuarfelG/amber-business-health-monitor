import {
  HealthScoreInput,
  HealthScoreResult,
  HealthStatus,
  HealthSignal,
} from './types';
import {
  evaluateRevenueSignal,
  evaluateLeadsSignal,
  evaluateShowRateSignal,
  evaluateRefundRateSignal,
} from './signals';

export function computeHealthScore(input: HealthScoreInput): HealthScoreResult {
  const computedAt = new Date().toISOString();

  // No current data at all
  if (!input.current.revenue && !input.current.crm) {
    return {
      status: 'UNKNOWN',
      reasons: [],
      recommendation: 'Connect Stripe or GoHighLevel to start tracking your business health.',
      signals: [],
      periodType: input.periodType,
      computedAt,
    };
  }

  // No previous data yet → not enough history
  if (!input.previous.revenue && !input.previous.crm) {
    return {
      status: 'UNKNOWN',
      reasons: [],
      recommendation: 'Not enough history yet. Check back next week.',
      signals: [],
      periodType: input.periodType,
      computedAt,
    };
  }

  // Collect all active (non-null) signals
  const signals: HealthSignal[] = [];

  const revenueSignal = evaluateRevenueSignal(input.current.revenue, input.previous.revenue);
  if (revenueSignal) signals.push(revenueSignal);

  const leadsSignal = evaluateLeadsSignal(input.current.crm, input.previous.crm);
  if (leadsSignal) signals.push(leadsSignal);

  const showRateSignal = evaluateShowRateSignal(input.current.crm);
  if (showRateSignal) signals.push(showRateSignal);

  const refundRateSignal = evaluateRefundRateSignal(input.current.revenue);
  if (refundRateSignal) signals.push(refundRateSignal);

  // If no signals collected, we can't score
  if (signals.length === 0) {
    return {
      status: 'UNKNOWN',
      reasons: [],
      recommendation: 'Connect an integration to get started.',
      signals: [],
      periodType: input.periodType,
      computedAt,
    };
  }

  // Normalize weights and calculate weighted score
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const normalizedSignals = signals.map(s => ({
    ...s,
    weight: s.weight / totalWeight,
  }));

  // Status scores: GREEN=2, YELLOW=1, RED=0
  const statusScore = normalizedSignals.reduce((sum, s) => {
    const statusValue = s.status === 'GREEN' ? 2 : s.status === 'YELLOW' ? 1 : 0;
    return sum + statusValue * s.weight;
  }, 0);

  // Determine overall status from weighted score
  let status: HealthStatus;
  if (statusScore >= 1.6) {
    status = 'GREEN';
  } else if (statusScore >= 0.8) {
    status = 'YELLOW';
  } else {
    status = 'RED';
  }

  // Build reasons list: top 2 non-GREEN signals
  const nonGreenSignals = signals.filter(s => s.status !== 'GREEN');
  const reasons = nonGreenSignals.slice(0, 2).map(s => s.reason);

  // If all green or no non-green signals, add a positive summary
  if (reasons.length === 0) {
    reasons.push('All metrics healthy');
  }

  // Recommendation based on worst signal
  const recommendation = getRecommendation(signals);

  return {
    status,
    reasons,
    recommendation,
    signals,
    periodType: input.periodType,
    computedAt,
  };
}

function getRecommendation(signals: HealthSignal[]): string {
  // Find the worst signal (RED > YELLOW > GREEN)
  const worst = signals.reduce((current, candidate) => {
    const candidateScore = candidate.status === 'RED' ? 0 : candidate.status === 'YELLOW' ? 1 : 2;
    const currentScore = current.status === 'RED' ? 0 : current.status === 'YELLOW' ? 1 : 2;
    return candidateScore < currentScore ? candidate : current;
  });

  if (worst.status === 'GREEN') {
    return 'Things look good. Stay consistent and keep nurturing your pipeline.';
  }

  const isBad = worst.status === 'RED';

  switch (worst.name) {
    case 'Revenue':
      return isBad
        ? 'Review your pricing or client retention. A 30-day revenue recovery plan may help.'
        : 'Keep an eye on revenue this week. Make sure your pipeline is healthy.';

    case 'Leads':
      return isBad
        ? 'Lead generation needs attention. Consider outreach or referral campaigns this week.'
        : 'Leads are slowing. Review your top-of-funnel activities.';

    case 'Show Rate':
      return isBad
        ? 'Too many no-shows. Try sending reminders 24 hours before appointments.'
        : 'Show rate could improve. Follow up with unconfirmed bookings.';

    case 'Refund Rate':
      return isBad
        ? 'High refunds need investigation. Review recent client complaints.'
        : 'Refund rate is slightly elevated. Check if a specific service is underperforming.';

    default:
      return 'Monitor your key metrics and take action where needed.';
  }
}
