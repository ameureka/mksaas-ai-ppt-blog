import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { adWatchRecord } from '@/db/schema';
import {
  generateToken,
  getAdRewardConfig,
  getTokenExpiresAt,
  isTokenExpired,
  validateWatchDuration,
} from '@/lib/ad-watch-limiter';
import { eq } from 'drizzle-orm';

export type WatchTokenStatus = 'pending' | 'completed' | 'expired';

export interface AdWatchRecord {
  id: string;
  userId: string | null;
  ipAddress: string | null;
  pptId: string | null;
  watchToken: string;
  downloadToken: string | null;
  startedAt: Date;
  completedAt: Date | null;
  status: WatchTokenStatus;
  creditsAwarded: number;
  createdAt: Date;
}

export type WatchTokenError =
  | 'NOT_FOUND'
  | 'EXPIRED'
  | 'ALREADY_USED'
  | 'TIME_NOT_ELAPSED';

export interface WatchTokenValidation {
  valid: boolean;
  error?: WatchTokenError;
  record?: AdWatchRecord;
}

export interface CompleteWatchResult {
  success: boolean;
  error?: WatchTokenError;
  downloadToken?: string;
  creditsAwarded?: number;
}

export interface DownloadTokenValidation {
  valid: boolean;
  error?: 'NOT_FOUND' | 'ALREADY_USED' | 'EXPIRED';
  record?: AdWatchRecord;
}

/**
 * Generate a watch token and create a pending ad watch record
 */
export async function generateWatchToken(
  userId: string | null,
  pptId: string,
  ip: string | null
): Promise<{ watchToken: string; expiresAt: Date }> {
  const db = await getDb();
  const watchToken = generateToken();
  const startedAt = new Date();
  const expiresAt = getTokenExpiresAt(startedAt);

  await db.insert(adWatchRecord).values({
    id: randomUUID(),
    userId,
    pptId,
    ipAddress: ip,
    watchToken,
    startedAt,
    status: 'pending',
    creditsAwarded: 0,
  });

  return { watchToken, expiresAt };
}

/**
 * Validate a watch token
 */
export async function validateWatchToken(
  token: string
): Promise<WatchTokenValidation> {
  const db = await getDb();

  const records = await db
    .select()
    .from(adWatchRecord)
    .where(eq(adWatchRecord.watchToken, token))
    .limit(1);

  if (records.length === 0) {
    return { valid: false, error: 'NOT_FOUND' };
  }

  const record = records[0] as AdWatchRecord;

  // Check if already used
  if (record.status === 'completed') {
    return { valid: false, error: 'ALREADY_USED', record };
  }

  // Check if expired
  if (record.status === 'expired' || isTokenExpired(record.startedAt)) {
    // Update status to expired if not already
    if (record.status !== 'expired') {
      await db
        .update(adWatchRecord)
        .set({ status: 'expired' })
        .where(eq(adWatchRecord.watchToken, token));
    }
    return { valid: false, error: 'EXPIRED', record };
  }

  return { valid: true, record };
}

/**
 * Complete a watch and generate download token
 * Returns the download token and credits awarded
 */
export async function completeWatch(
  token: string
): Promise<CompleteWatchResult> {
  const db = await getDb();
  const config = getAdRewardConfig();

  // First validate the token
  const validation = await validateWatchToken(token);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const record = validation.record!;
  const now = new Date();

  // Check if enough time has elapsed
  if (!validateWatchDuration(record.startedAt, now)) {
    return { success: false, error: 'TIME_NOT_ELAPSED' };
  }

  // Generate download token
  const downloadToken = generateToken();

  // Update the record
  await db
    .update(adWatchRecord)
    .set({
      status: 'completed',
      completedAt: now,
      downloadToken,
      creditsAwarded: config.creditsPerWatch,
    })
    .where(eq(adWatchRecord.watchToken, token));

  return {
    success: true,
    downloadToken,
    creditsAwarded: config.creditsPerWatch,
  };
}

/**
 * Validate a download token
 */
export async function validateDownloadToken(
  token: string
): Promise<DownloadTokenValidation> {
  const db = await getDb();

  const records = await db
    .select()
    .from(adWatchRecord)
    .where(eq(adWatchRecord.downloadToken, token))
    .limit(1);

  if (records.length === 0) {
    return { valid: false, error: 'NOT_FOUND' };
  }

  const record = records[0] as AdWatchRecord;

  // Download token is valid if the watch was completed
  if (record.status !== 'completed') {
    return { valid: false, error: 'EXPIRED', record };
  }

  return { valid: true, record };
}

/**
 * Consume a download token (mark as used)
 * Note: In this implementation, we don't have a separate "consumed" status
 * The download token is single-use by design - once validated, it should be used immediately
 * For additional security, you could add a "downloadTokenUsed" boolean field
 */
export async function consumeDownloadToken(token: string): Promise<boolean> {
  const validation = await validateDownloadToken(token);
  if (!validation.valid) {
    return false;
  }

  // In a more robust implementation, you would mark the token as consumed
  // For now, we rely on the download history to prevent reuse
  return true;
}

/**
 * Get ad watch record by watch token
 */
export async function getAdWatchRecordByToken(
  token: string
): Promise<AdWatchRecord | null> {
  const db = await getDb();

  const records = await db
    .select()
    .from(adWatchRecord)
    .where(eq(adWatchRecord.watchToken, token))
    .limit(1);

  if (records.length === 0) {
    return null;
  }

  return records[0] as AdWatchRecord;
}
