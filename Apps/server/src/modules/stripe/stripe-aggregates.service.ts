import { prisma } from '../../prisma';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from 'date-fns';

type PeriodType = 'day' | 'week' | 'month';

interface PeriodBounds {
  start: Date;
  end: Date;
}

export class StripeAggregatesService {
  async calculateMetricsForUser(userId: string, periodType: PeriodType): Promise<void> {
    try {
      // Find the range of data for this user
      const dateRange = await prisma.stripeCharge.findFirst({
        where: { userId },
        orderBy: { stripeCreatedAt: 'asc' },
        select: { stripeCreatedAt: true },
      });

      if (!dateRange) {
        // No data yet
        return;
      }

      const startDate = dateRange.stripeCreatedAt;
      const endDate = new Date();

      let currentPeriodStart = this.getPeriodStart(startDate, periodType);

      while (currentPeriodStart < endDate) {
        const bounds = this.getPeriodBounds(currentPeriodStart, periodType);

        await this.calculateMetrics(userId, bounds.start, bounds.end, periodType);

        // Move to next period
        currentPeriodStart = this.getNextPeriodStart(bounds.start, periodType);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to calculate metrics for user ${userId}:`, errorMsg);
    }
  }

  async calculateMetrics(
    userId: string,
    periodStart: Date,
    periodEnd: Date,
    periodType: PeriodType
  ): Promise<void> {
    // Calculate totals from charges
    const charges = await prisma.stripeCharge.findMany({
      where: {
        userId,
        stripeCreatedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        customer: true,
      },
    });

    const totalRevenue = charges
      .filter((c) => c.status === 'succeeded')
      .reduce((sum, c) => sum + c.amount, 0);

    const refundedRevenue = charges.reduce((sum, c) => sum + c.refundAmount, 0);

    const netRevenue = totalRevenue - refundedRevenue;

    const chargeCount = charges.length;

    const refundCount = charges.filter((c) => c.refundAmount > 0).length;

    const uniqueCustomers = new Set(
      charges.filter((c) => c.customerId).map((c) => c.customerId)
    );
    const customerCount = uniqueCustomers.size;

    // Find customers created in this period
    const newCustomers = await prisma.stripeCustomer.count({
      where: {
        userId,
        stripeCreatedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Count active subscriptions (not canceled or with canceledAt after periodEnd)
    const activeSubscriptions = await prisma.stripeSubscription.count({
      where: {
        userId,
        OR: [
          { status: 'active' },
          {
            status: 'canceled',
            canceledAt: {
              gt: periodEnd,
            },
          },
        ],
      },
    });

    await prisma.revenueMetric.upsert({
      where: {
        userId_periodStart_periodType: {
          userId,
          periodStart,
          periodType,
        },
      },
      update: {
        totalRevenue,
        refundedRevenue,
        netRevenue,
        chargeCount,
        refundCount,
        customerCount,
        newCustomerCount: newCustomers,
        activeSubscriptions,
        updatedAt: new Date(),
      },
      create: {
        userId,
        periodStart,
        periodEnd,
        periodType,
        totalRevenue,
        refundedRevenue,
        netRevenue,
        chargeCount,
        refundCount,
        customerCount,
        newCustomerCount: newCustomers,
        activeSubscriptions,
      },
    });
  }

  async getMetrics(
    userId: string,
    periodType: PeriodType,
    limit: number = 12
  ) {
    return prisma.revenueMetric.findMany({
      where: {
        userId,
        periodType,
      },
      orderBy: {
        periodStart: 'desc',
      },
      take: limit,
    });
  }

  async recalculateForUser(userId: string): Promise<void> {
    // Delete existing metrics
    await prisma.revenueMetric.deleteMany({
      where: { userId },
    });

    // Recalculate
    await this.calculateMetricsForUser(userId, 'day');
    await this.calculateMetricsForUser(userId, 'week');
    await this.calculateMetricsForUser(userId, 'month');
  }

  private getPeriodStart(date: Date, periodType: PeriodType): Date {
    switch (periodType) {
      case 'day':
        return startOfDay(date);
      case 'week':
        return startOfWeek(date, { weekStartsOn: 1 }); // Monday
      case 'month':
        return startOfMonth(date);
    }
  }

  private getPeriodBounds(date: Date, periodType: PeriodType): PeriodBounds {
    switch (periodType) {
      case 'day':
        return {
          start: startOfDay(date),
          end: endOfDay(date),
        };
      case 'week':
        return {
          start: startOfWeek(date, { weekStartsOn: 1 }),
          end: endOfWeek(date, { weekStartsOn: 1 }),
        };
      case 'month':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
        };
    }
  }

  private getNextPeriodStart(date: Date, periodType: PeriodType): Date {
    switch (periodType) {
      case 'day':
        return startOfDay(subDays(date, -1));
      case 'week':
        return startOfWeek(subDays(date, -7), { weekStartsOn: 1 });
      case 'month':
        return startOfMonth(subDays(date, -30));
    }
  }
}

export const stripeAggregatesService = new StripeAggregatesService();
