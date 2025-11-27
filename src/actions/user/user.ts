/**
 * User Server Actions (Mock)
 *
 * 迁移时替换为真实的 Server Actions
 */

import { mockUsers } from '@/lib/ppt/mock-data/users';
import {
  type ListResult,
  type ServerActionResult,
  createListResult,
  errorResult,
  successResult,
} from '@/lib/types/ppt/server-action';
import type {
  UpdateUserInput,
  PPTUser as User,
  UserListParams,
} from '@/lib/types/ppt/user';

// 模拟网络延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getUsers(
  params?: UserListParams
): Promise<ServerActionResult<ListResult<User>>> {
  await delay(500);

  let filtered = [...mockUsers];

  // 搜索过滤
  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
    );
  }

  // 状态过滤
  if (params?.status) {
    filtered = filtered.filter((u) => u.status === params.status);
  }

  const total = filtered.length;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return successResult(createListResult(items, total, page, pageSize));
}

export async function getUserById(
  id: string
): Promise<ServerActionResult<User>> {
  await delay(300);
  const user = mockUsers.find((u) => u.id === id);
  if (!user) {
    return errorResult('User not found', 'NOT_FOUND');
  }
  return successResult(user);
}

export async function updateUser(
  id: string,
  data: UpdateUserInput
): Promise<ServerActionResult<User>> {
  await delay(600);
  const user = mockUsers.find((u) => u.id === id);
  if (!user) {
    return errorResult('User not found', 'NOT_FOUND');
  }
  const updated = { ...user, ...data };
  console.log(`[Mock] Updated User: ${id}`, data);
  return successResult(updated);
}

export async function banUser(id: string): Promise<ServerActionResult<void>> {
  await delay(500);
  const user = mockUsers.find((u) => u.id === id);
  if (!user) {
    return errorResult('User not found', 'NOT_FOUND');
  }
  console.log(`[Mock] Banned User: ${id}`);
  return successResult(undefined);
}

export async function unbanUser(id: string): Promise<ServerActionResult<void>> {
  await delay(500);
  const user = mockUsers.find((u) => u.id === id);
  if (!user) {
    return errorResult('User not found', 'NOT_FOUND');
  }
  console.log(`[Mock] Unbanned User: ${id}`);
  return successResult(undefined);
}

export async function adjustCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<ServerActionResult<void>> {
  await delay(600);
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) {
    return errorResult('User not found', 'NOT_FOUND');
  }
  console.log(
    `[Mock] Adjusted Credits for ${userId}: ${amount > 0 ? '+' : ''}${amount}, reason: ${reason}`
  );
  return successResult(undefined);
}
