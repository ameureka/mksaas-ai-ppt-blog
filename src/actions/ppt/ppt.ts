'use server';

/**
 * PPT Server Actions (Mock)
 *
 * 迁移时替换为真实的 Server Actions
 */

import { mockPPTs } from '@/lib/mock-data/ppts';
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

// 模拟网络延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getPPTs(
  params?: PPTListParams
): Promise<ServerActionResult<ListResult<PPT>>> {
  await delay(500);

  let filtered = [...mockPPTs];

  // 搜索过滤
  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
    );
  }

  // 分类过滤
  if (params?.category) {
    filtered = filtered.filter((p) => p.category === params.category);
  }

  // 排序
  if (params?.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[params.sortBy as keyof PPT];
      const bVal = b[params.sortBy as keyof PPT];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return params.sortOrder === 'desc'
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return params.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });
  }

  const total = filtered.length;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return successResult(createListResult(items, total, page, pageSize));
}

export async function getPPTById(id: string): Promise<ServerActionResult<PPT>> {
  await delay(300);
  const ppt = mockPPTs.find((p) => p.id === id);
  if (!ppt) {
    return errorResult('PPT not found', 'NOT_FOUND');
  }
  return successResult(ppt);
}

export async function deletePPT(id: string): Promise<ServerActionResult<void>> {
  await delay(800);
  const index = mockPPTs.findIndex((p) => p.id === id);
  if (index === -1) {
    return errorResult('PPT not found', 'NOT_FOUND');
  }
  console.log(`[Mock] Deleted PPT: ${id}`);
  return successResult(undefined);
}

export async function updatePPT(
  id: string,
  data: UpdatePPTInput
): Promise<ServerActionResult<PPT>> {
  await delay(600);
  const ppt = mockPPTs.find((p) => p.id === id);
  if (!ppt) {
    return errorResult('PPT not found', 'NOT_FOUND');
  }
  const updated = { ...ppt, ...data, updated_at: new Date().toISOString() };
  console.log(`[Mock] Updated PPT: ${id}`, data);
  return successResult(updated);
}

export async function createPPT(
  data: CreatePPTInput
): Promise<ServerActionResult<PPT>> {
  await delay(700);
  const newPPT: PPT = {
    ...data,
    id: `ppt_${Date.now()}`,
    author: 'Admin',
    slides_count: 10,
    file_size: '2.5MB',
    file_url: data.file_url,
    downloads: 0,
    views: 0,
    uploaded_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  console.log(`[Mock] Created PPT:`, newPPT);
  return successResult(newPPT);
}
