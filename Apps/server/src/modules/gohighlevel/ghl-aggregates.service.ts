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

export class GHLAggregatesService {
  async calculateMetricsForUser(userId: string, periodType: PeriodType): Promise<void> {
    try {
      // Find the range of data for this user
      const dateRange = await prisma.gHLContact.findFirst({
        where: { userId },
        orderBy: { ghlCreatedAt: 'asc' },
        select: { ghlCreatedAt: true },
      });

      if (!dateRange) {
        // No data yet
        return;
      }

      const startDate = dateRange.ghlCreatedAt;
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
      console.error(`Failed to calculate CRM metrics for user ${userId}:`, errorMsg);
    }
  }

  async calculateMetrics(
    userId: string,
    periodStart: Date,
    periodEnd: Date,
    periodType: PeriodType
  ): Promise<void> {
    // Count new leads (contacts created in period)
    const newLeads = await prisma.gHLContact.count({
      where: {
        userId,
        ghlCreatedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Count total contacts (all-time as of periodEnd)
    const totalLeads = await prisma.gHLContact.count({
      where: {
        userId,
        ghlCreatedAt: {
          lte: periodEnd,
        },
      },
    });

    // Count appointments booked in period
    const appointmentsBooked = await prisma.gHLAppointment.count({
      where: {
        userId,
        startTime: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Count completed appointments
    const appointmentsShowed = await prisma.gHLAppointment.count({
      where: {
        userId,
        startTime: {
          gte: periodStart,
          lte: periodEnd,
        },
        status: {
          in: ['completed', 'done', 'showed'],
        },
      },
    });

    // Count no-shows
    const appointmentsNoShow = await prisma.gHLAppointment.count({
      where: {
        userId,
        startTime: {
          gte: periodStart,
          lte: periodEnd,
        },
        status: {
          in: ['no-show', 'cancelled', 'missed'],
        },
      },
    });

    // Calculate show rate (0-1 decimal, not percentage)
    const showRate =
      appointmentsBooked > 0
        ? appointmentsShowed / appointmentsBooked
        : 0;

    // Count won opportunities
    const opportunitiesWon = await prisma.gHLOpportunity.count({
      where: {
        userId,
        status: 'won',
        closedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Count lost opportunities
    const opportunitiesLost = await prisma.gHLOpportunity.count({
      where: {
        userId,
        status: 'lost',
        closedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Sum pipeline value (open opportunities)
    const pipelineOpportunities = await prisma.gHLOpportunity.findMany({
      where: {
        userId,
        status: 'open',
      },
      select: { monetaryValue: true },
    });

    const pipelineValue = pipelineOpportunities
      .filter((o) => o.monetaryValue)
      .reduce((sum, o) => sum + (o.monetaryValue || 0), 0);

    // Sum won value (closed-won opportunities)
    const wonOpportunities = await prisma.gHLOpportunity.findMany({
      where: {
        userId,
        status: 'won',
        closedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: { monetaryValue: true },
    });

    const wonValue = wonOpportunities
      .filter((o) => o.monetaryValue)
      .reduce((sum, o) => sum + (o.monetaryValue || 0), 0);

    await prisma.cRMMetric.upsert({
      where: {
        userId_periodStart_periodType: {
          userId,
          periodStart,
          periodType,
        },
      },
      update: {
        newLeads,
        totalLeads,
        appointmentsBooked,
        appointmentsShowed,
        appointmentsNoShow,
        showRate,
        opportunitiesWon,
        opportunitiesLost,
        pipelineValue,
        wonValue,
        updatedAt: new Date(),
      },
      create: {
        userId,
        periodStart,
        periodEnd,
        periodType,
        newLeads,
        totalLeads,
        appointmentsBooked,
        appointmentsShowed,
        appointmentsNoShow,
        showRate,
        opportunitiesWon,
        opportunitiesLost,
        pipelineValue,
        wonValue,
      },
    });
  }

  async getMetrics(
    userId: string,
    periodType: PeriodType,
    limit: number = 12
  ) {
    return prisma.cRMMetric.findMany({
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
    await prisma.cRMMetric.deleteMany({
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

export const ghlAggregatesService = new GHLAggregatesService();
