'use server';

import { randomUUID } from 'node:crypto';
import { getDb } from '@/db';
import { ppt as pptTable } from '@/db/schema';
import type {
  CreatePPTInput,
  PPT,
  PPTListParams,
  UpdatePPTInput,
} from '@/lib/types/ppt/ppt';
import {
  type ListResult,
  type ServerActionResult,
  createListResult,
  errorResult,
  successResult,
} from '@/lib/types/ppt/server-action';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
} from 'drizzle-orm';

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

const normalizePagination = (page?: number, pageSize?: number) => {
  const safePage = Math.max(1, page ?? 1);
  const safePageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, pageSize ?? DEFAULT_PAGE_SIZE)
  );
  return { page: safePage, pageSize: safePageSize };
};

const buildWhere = (params?: PPTListParams) => {
  if (!params) return undefined;
  const conditions = [];

  if (params.search?.trim()) {
    const keyword = `%${params.search.trim()}%`;
    conditions.push(
      or(ilike(pptTable.title, keyword), ilike(pptTable.author, keyword))
    );
  }

  if (params.category) {
    conditions.push(eq(pptTable.category, params.category));
  }

  if (params.status) {
    conditions.push(eq(pptTable.status, params.status));
  }

  if (params.dateFrom) {
    const from = new Date(params.dateFrom);
    if (!Number.isNaN(from.getTime())) {
      conditions.push(gte(pptTable.createdAt, from));
    }
  }

  if (params.dateTo) {
    const to = new Date(params.dateTo);
    if (!Number.isNaN(to.getTime())) {
      conditions.push(lte(pptTable.createdAt, to));
    }
  }

  if (conditions.length === 0) return undefined;
  return and(...conditions);
};

const resolveOrder = (sortBy?: string, sortOrder?: 'asc' | 'desc') => {
  const direction = sortOrder === 'asc' ? asc : desc;
  switch (sortBy) {
    case 'downloads':
      return direction(pptTable.downloadCount);
    case 'title':
      return direction(pptTable.title);
    default:
      return direction(pptTable.createdAt);
  }
};

const toPPTDto = (row: typeof pptTable.$inferSelect): PPT => ({
  id: row.id,
  title: row.title,
  category: (row.category ?? 'general') as PPT['category'],
  author: row.author ?? 'Unknown',
  description: undefined,
  slides_count: row.slidesCount ?? 0,
  file_size: '',
  file_url: row.fileUrl,
  preview_url: row.thumbnailUrl ?? row.coverImageUrl ?? undefined,
  downloads: row.downloadCount ?? 0,
  views: row.viewCount ?? 0,
  status: (row.status ?? 'draft') as PPT['status'],
  uploaded_at: row.createdAt?.toISOString() ?? '',
  created_at: row.createdAt?.toISOString() ?? '',
  updated_at: row.updatedAt?.toISOString() ?? '',
});

export async function getPPTs(
  params?: PPTListParams
): Promise<ServerActionResult<ListResult<PPT>>> {
  try {
    const db = await getDb();
    const { page, pageSize } = normalizePagination(
      params?.page,
      params?.pageSize
    );
    const where = buildWhere(params);
    const orderBy = resolveOrder(params?.sortBy, params?.sortOrder);

    const totalResult = await db
      .select({ count: count() })
      .from(pptTable)
      .where(where);
    const total = Number(totalResult[0]?.count ?? 0);

    const rows = await db
      .select()
      .from(pptTable)
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return successResult(
      createListResult(rows.map(toPPTDto), total, page, pageSize)
    );
  } catch (error) {
    console.error('[PPT] Failed to list PPTs', error);
    return errorResult('Failed to fetch PPTs', 'INTERNAL_ERROR');
  }
}

export async function getPPTById(id: string): Promise<ServerActionResult<PPT>> {
  try {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(pptTable)
      .where(eq(pptTable.id, id))
      .limit(1);
    if (!row) {
      return errorResult('PPT not found', 'NOT_FOUND');
    }
    return successResult(toPPTDto(row));
  } catch (error) {
    console.error('[PPT] Failed to fetch PPT', error);
    return errorResult('Failed to fetch PPT', 'INTERNAL_ERROR');
  }
}

export async function createPPT(
  data: CreatePPTInput
): Promise<ServerActionResult<PPT>> {
  try {
    const db = await getDb();
    const now = new Date();
    const [row] = await db
      .insert(pptTable)
      .values({
        id: `ppt_${randomUUID()}`,
        title: data.title,
        category: data.category,
        author: data.author ?? 'Admin',
        slidesCount: data.slides_count ?? 0,
        fileUrl: data.file_url,
        coverImageUrl: data.preview_url,
        thumbnailUrl: data.preview_url,
        downloadCount: 0,
        viewCount: 0,
        status: data.status ?? 'draft',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return successResult(toPPTDto(row));
  } catch (error) {
    console.error('[PPT] Failed to create PPT', error);
    return errorResult('Failed to create PPT', 'INTERNAL_ERROR');
  }
}

export async function updatePPT(
  id: string,
  data: UpdatePPTInput
): Promise<ServerActionResult<PPT>> {
  try {
    const db = await getDb();
    const updates: Partial<typeof pptTable.$inferInsert> = {};

    if (data.title !== undefined) updates.title = data.title;
    if (data.category !== undefined) updates.category = data.category;
    if (data.status !== undefined) updates.status = data.status;
    if (data.author !== undefined) updates.author = data.author;
    if (data.file_url !== undefined) updates.fileUrl = data.file_url;
    if (data.preview_url !== undefined) {
      updates.coverImageUrl = data.preview_url;
      updates.thumbnailUrl = data.preview_url;
    }
    if (data.slides_count !== undefined)
      updates.slidesCount = data.slides_count;

    if (Object.keys(updates).length === 0) {
      return errorResult('No fields to update', 'NO_UPDATES');
    }

    updates.updatedAt = new Date();

    const rows = await db
      .update(pptTable)
      .set(updates)
      .where(eq(pptTable.id, id))
      .returning();

    if (!rows.length) {
      return errorResult('PPT not found', 'NOT_FOUND');
    }

    return successResult(toPPTDto(rows[0]));
  } catch (error) {
    console.error('[PPT] Failed to update PPT', error);
    return errorResult('Failed to update PPT', 'INTERNAL_ERROR');
  }
}

export async function deletePPT(id: string): Promise<ServerActionResult<void>> {
  try {
    const db = await getDb();
    const deleted = await db
      .delete(pptTable)
      .where(eq(pptTable.id, id))
      .returning({ id: pptTable.id });

    if (!deleted.length) {
      return errorResult('PPT not found', 'NOT_FOUND');
    }
    return successResult(undefined);
  } catch (error) {
    console.error('[PPT] Failed to delete PPT', error);
    return errorResult('Failed to delete PPT', 'INTERNAL_ERROR');
  }
}

export async function recordDownload(
  id: string
): Promise<ServerActionResult<void>> {
  try {
    const db = await getDb();
    const rows = await db
      .update(pptTable)
      .set({
        downloadCount: sql<number>`${pptTable.downloadCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(pptTable.id, id))
      .returning({ id: pptTable.id });

    if (!rows.length) {
      return errorResult('PPT not found', 'NOT_FOUND');
    }

    return successResult(undefined);
  } catch (error) {
    console.error('[PPT] Failed to record download', error);
    return errorResult('Failed to record download', 'INTERNAL_ERROR');
  }
}

export async function recordView(
  id: string
): Promise<ServerActionResult<void>> {
  try {
    const db = await getDb();
    const rows = await db
      .update(pptTable)
      .set({
        viewCount: sql<number>`${pptTable.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(pptTable.id, id))
      .returning({ id: pptTable.id });

    if (!rows.length) {
      return errorResult('PPT not found', 'NOT_FOUND');
    }

    return successResult(undefined);
  } catch (error) {
    console.error('[PPT] Failed to record view', error);
    return errorResult('Failed to record view', 'INTERNAL_ERROR');
  }
}
