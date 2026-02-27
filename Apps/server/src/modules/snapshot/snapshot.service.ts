import { prisma } from '../../prisma';
import { computeHealthScore, HealthScoreInput, HealthScoreResult } from '@amber/core';

export async function getHealthScore(
  userId: string,
  periodType: 'week' | 'month'
): Promise<HealthScoreResult> {
  // Fetch last 2 periods of revenue metrics
  const revenueMetrics = await prisma.revenueMetric.findMany({
    where: {
      userId,
      periodType,
    },
    orderBy: {
      periodStart: 'desc',
    },
    take: 2,
  });

  // Fetch last 2 periods of CRM metrics
  const crmMetrics = await prisma.cRMMetric.findMany({
    where: {
      userId,
      periodType,
    },
    orderBy: {
      periodStart: 'desc',
    },
    take: 2,
  });

  // Build input for scoring function
  // Most recent is [0], previous is [1]
  const input: HealthScoreInput = {
    periodType,
    current: {
      revenue: revenueMetrics[0]
        ? {
            netRevenue: revenueMetrics[0].netRevenue,
            totalRevenue: revenueMetrics[0].totalRevenue,
            refundedRevenue: revenueMetrics[0].refundedRevenue,
            chargeCount: revenueMetrics[0].chargeCount,
            refundCount: revenueMetrics[0].refundCount,
            customerCount: revenueMetrics[0].customerCount,
            newCustomerCount: revenueMetrics[0].newCustomerCount,
            activeSubscriptions: revenueMetrics[0].activeSubscriptions,
          }
        : null,
      crm: crmMetrics[0]
        ? {
            newLeads: crmMetrics[0].newLeads,
            appointmentsBooked: crmMetrics[0].appointmentsBooked,
            appointmentsShowed: crmMetrics[0].appointmentsShowed,
            showRate: crmMetrics[0].showRate,
            opportunitiesWon: crmMetrics[0].opportunitiesWon,
            opportunitiesLost: crmMetrics[0].opportunitiesLost,
          }
        : null,
    },
    previous: {
      revenue: revenueMetrics[1]
        ? {
            netRevenue: revenueMetrics[1].netRevenue,
            totalRevenue: revenueMetrics[1].totalRevenue,
            refundedRevenue: revenueMetrics[1].refundedRevenue,
            chargeCount: revenueMetrics[1].chargeCount,
            refundCount: revenueMetrics[1].refundCount,
            customerCount: revenueMetrics[1].customerCount,
            newCustomerCount: revenueMetrics[1].newCustomerCount,
            activeSubscriptions: revenueMetrics[1].activeSubscriptions,
          }
        : null,
      crm: crmMetrics[1]
        ? {
            newLeads: crmMetrics[1].newLeads,
            appointmentsBooked: crmMetrics[1].appointmentsBooked,
            appointmentsShowed: crmMetrics[1].appointmentsShowed,
            showRate: crmMetrics[1].showRate,
            opportunitiesWon: crmMetrics[1].opportunitiesWon,
            opportunitiesLost: crmMetrics[1].opportunitiesLost,
          }
        : null,
    },
  };

  return computeHealthScore(input);
}
