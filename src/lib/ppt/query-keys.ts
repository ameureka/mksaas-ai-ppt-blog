/**
 * PPT 模块 React Query Keys 集中管理
 *
 * 参考 MK-SaaS 的 creditsKeys 模式
 * 便于缓存管理和迁移
 */

import type { PPTListParams } from '@/lib/types/ppt/ppt';
import type { UserListParams } from '@/lib/types/ppt/user';

// PPT 相关 query keys
export const pptKeys = {
  all: ['ppts'] as const,
  lists: () => [...pptKeys.all, 'list'] as const,
  list: (params?: PPTListParams) => [...pptKeys.lists(), params] as const,
  details: () => [...pptKeys.all, 'detail'] as const,
  detail: (id: string) => [...pptKeys.details(), id] as const,
};

// User 相关 query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Dashboard 相关 query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

// Settings 相关 query keys
export const settingsKeys = {
  all: ['settings'] as const,
};
