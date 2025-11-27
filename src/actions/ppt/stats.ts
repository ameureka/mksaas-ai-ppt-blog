'use server';

import { getDb } from '@/db';
import { ppt as pptTable, user as userTable } from '@/db/schema';
import {
  type ServerActionResult,
  errorResult,
  successResult,
} from '@/lib/types/ppt/server-action';
import { count, sql } from 'drizzle-orm';

export interface DashboardStats {
  totalPPTs: number;
  totalUsers: number;
  totalDownloads: number;
  todayDownloads: number;
  weeklyGrowth: number;
}

export async function getDashboardStats(): Promise<
  ServerActionResult<DashboardStats>
> {
  try {
    const db = await getDb();
    const [pptAgg] = await db
      .select({
        totalPPTs: count(),
        totalDownloads: sql<number>`coalesce(sum(${pptTable.downloads}), 0)`,
        totalViews: sql<number>`coalesce(sum(${pptTable.views}), 0)`,
      })
      .from(pptTable);

    const [userAgg] = await db
      .select({ totalUsers: count() })
      .from(userTable);

    return successResult({
      totalPPTs: Number(pptAgg?.totalPPTs ?? 0),
      totalUsers: Number(userAgg?.totalUsers ?? 0),
      totalDownloads: Number(pptAgg?.totalDownloads ?? 0),
      todayDownloads: 0,
      weeklyGrowth: 0,
    });
  } catch (error) {
    console.error('[PPT] Failed to fetch dashboard stats', error);
    return errorResult('Failed to fetch dashboard stats', 'INTERNAL_ERROR');
  }
}

export async function updateSettings(
  settings: Record<string, unknown>
): Promise<ServerActionResult<void>> {
  console.log(`[PPT] Update settings (stub):`, settings);
  return successResult(undefined);
}
