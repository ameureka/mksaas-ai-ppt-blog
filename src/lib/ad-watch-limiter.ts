import { websiteConfig } from '@/config/website';
import { getDb } from '@/db';
import { adWatchRecord } from '@/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

/**
 * Get ad reward configuration from websiteConfig
 */
export function getAdRewardConfig() {
  return websiteConfig.adReward;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  remainingCount?: number;
}

/**
 * Get user's completed ad watch count for today
 */
export async function getUserWatchCount(userId: string): Promise<number> {
  const db = await getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await db
    .select({ count: sql<number>`count(*)` })
    .from(adWatchRecord)
    .where(
      and(
        eq(adWatchRecord.userId, userId),
        eq(adWatchRecord.status, 'completed'),
        gte(adWatchRecord.createdAt, today)
      )
    );

  return Number(records[0]?.count || 0);
}

/**
 * Get IP's completed ad watch count for today
 */
export async function getIPWatchCount(ip: string): Promise<number> {
  const db = await getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await db
    .select({ count: sql<number>`count(*)` })
    .from(adWatchRecord)
    .where(
      and(
        eq(adWatchRecord.ipAddress, ip),
        eq(adWatchRecord.status, 'completed'),
        gte(adWatchRecord.createdAt, today)
      )
    );

  return Number(records[0]?.count || 0);
}

/**
 * Check if user has exceeded daily ad watch limit
 */
export async function checkUserLimit(userId: string): Promise<RateLimitResult> {
  const config = getAdRewardConfig();
  const count = await getUserWatchCount(userId);

  if (count >= config.dailyLimitPerUser) {
    return {
      allowed: false,
      reason: '今日观看次数已达上限',
      remainingCount: 0,
    };
  }

  return {
    allowed: true,
    remainingCount: config.dailyLimitPerUser - count,
  };
}

/**
 * Check if IP has exceeded daily ad watch limit
 */
export async function checkIPLimit(ip: string): Promise<RateLimitResult> {
  const config = getAdRewardConfig();
  const count = await getIPWatchCount(ip);

  if (count >= config.dailyLimitPerIP) {
    return {
      allowed: false,
      reason: '当前网络观看次数已达上限',
      remainingCount: 0,
    };
  }

  return {
    allowed: true,
    remainingCount: config.dailyLimitPerIP - count,
  };
}

/**
 * Check both user and IP ad watch limits
 */
export async function checkAdWatchLimit(
  userId?: string | null,
  ip?: string | null
): Promise<RateLimitResult> {
  // Check user limit
  if (userId) {
    const userResult = await checkUserLimit(userId);
    if (!userResult.allowed) {
      return userResult;
    }
  }

  // Check IP limit
  if (ip) {
    const ipResult = await checkIPLimit(ip);
    if (!ipResult.allowed) {
      return ipResult;
    }
  }

  return { allowed: true };
}

/**
 * Validate that enough time has elapsed since watch started
 */
export function validateWatchDuration(
  startedAt: Date,
  completedAt: Date = new Date()
): boolean {
  const config = getAdRewardConfig();
  const duration = (completedAt.getTime() - startedAt.getTime()) / 1000;
  return duration >= config.minWatchDuration;
}

/**
 * Generate a random token string
 */
export function generateToken(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Check if a watch token has expired
 */
export function isTokenExpired(startedAt: Date): boolean {
  const config = getAdRewardConfig();
  const now = new Date();
  const expireTime = new Date(
    startedAt.getTime() + config.tokenExpireMinutes * 60 * 1000
  );
  return now > expireTime;
}

/**
 * Calculate token expiration time
 */
export function getTokenExpiresAt(startedAt: Date): Date {
  const config = getAdRewardConfig();
  return new Date(startedAt.getTime() + config.tokenExpireMinutes * 60 * 1000);
}
