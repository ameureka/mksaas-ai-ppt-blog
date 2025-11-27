'use server';

/**
 * Stats & Settings Server Actions (Mock)
 *
 * 迁移时替换为真实的 Server Actions
 */

import { mockPPTs } from '@/lib/mock-data/ppts';
import { mockUsers } from '@/lib/mock-data/users';
import {
  type ServerActionResult,
  successResult,
} from '@/lib/types/ppt/server-action';

// 模拟网络延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  await delay(400);
  return successResult({
    totalPPTs: mockPPTs.length,
    totalUsers: mockUsers.length,
    totalDownloads: mockPPTs.reduce((sum, p) => sum + p.downloads, 0),
    todayDownloads: 156,
    weeklyGrowth: 12.5,
  });
}

export async function updateSettings(
  settings: Record<string, unknown>
): Promise<ServerActionResult<void>> {
  await delay(800);
  console.log(`[Mock] Updated Settings:`, settings);
  return successResult(undefined);
}
