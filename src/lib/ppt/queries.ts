/**
 * PPT 查询工具 - 支持软删除
 * Requirements: 6.2, 6.3, 6.4, 11.5
 */

import { getDb } from '@/db';
import { ppt } from '@/db/schema';
import { type SQL, and, asc, desc, eq, isNull, sql } from 'drizzle-orm';

export interface GetPptListOptions {
  includeDeleted?: boolean;
  status?: string;
  category?: string;
  language?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'downloadCount' | 'viewCount';
  orderDirection?: 'asc' | 'desc';
}

/**
 * 获取 PPT 列表（默认排除软删除）
 * R6.3: 默认查询自动添加 WHERE deleted_at IS NULL 条件
 */
export async function getPptList(options: GetPptListOptions = {}) {
  const db = getDb();

  const {
    includeDeleted = false,
    status,
    category,
    language,
    limit = 20,
    offset = 0,
    orderBy = 'createdAt',
    orderDirection = 'desc',
  } = options;

  // 构建查询条件
  const conditions: SQL[] = [];

  // R6.3: 默认排除软删除记录
  if (!includeDeleted) {
    conditions.push(isNull(ppt.deletedAt));
  }

  if (status) {
    conditions.push(eq(ppt.status, status));
  }

  if (category) {
    conditions.push(eq(ppt.category, category));
  }

  if (language) {
    conditions.push(eq(ppt.language, language));
  }

  // 构建排序
  const orderColumn = {
    createdAt: ppt.createdAt,
    downloadCount: ppt.downloadCount,
    viewCount: ppt.viewCount,
  }[orderBy];

  const orderFn = orderDirection === 'desc' ? desc : asc;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(ppt)
    .where(whereClause)
    .orderBy(orderFn(orderColumn))
    .limit(limit)
    .offset(offset);
}

/**
 * 获取单个 PPT（默认排除软删除）
 */
export async function getPptById(pptId: string, includeDeleted = false) {
  const db = getDb();

  const conditions: SQL[] = [eq(ppt.id, pptId)];

  if (!includeDeleted) {
    conditions.push(isNull(ppt.deletedAt));
  }

  const results = await db
    .select()
    .from(ppt)
    .where(and(...conditions))
    .limit(1);

  return results[0] || null;
}

/**
 * 软删除 PPT
 * R6.2: 设置 deleted_at 字段为当前时间戳而非物理删除
 */
export async function softDeletePpt(pptId: string) {
  const db = getDb();

  const result = await db
    .update(ppt)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(ppt.id, pptId))
    .returning({ id: ppt.id });

  return result.length > 0;
}

/**
 * 恢复软删除的 PPT
 * R6.4: 将 deleted_at 设置为 NULL 以恢复记录
 */
export async function restorePpt(pptId: string) {
  const db = getDb();

  const result = await db
    .update(ppt)
    .set({
      deletedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(ppt.id, pptId))
    .returning({ id: ppt.id });

  return result.length > 0;
}

/**
 * 获取已删除的 PPT 列表（用于管理员恢复）
 */
export async function getDeletedPptList(limit = 20, offset = 0) {
  const db = getDb();

  return db
    .select()
    .from(ppt)
    .where(sql`${ppt.deletedAt} IS NOT NULL`) // deletedAt IS NOT NULL
    .orderBy(desc(ppt.deletedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * 永久删除 PPT（物理删除，谨慎使用）
 */
export async function permanentDeletePpt(pptId: string) {
  const db = getDb();

  const result = await db
    .delete(ppt)
    .where(eq(ppt.id, pptId))
    .returning({ id: ppt.id });

  return result.length > 0;
}
