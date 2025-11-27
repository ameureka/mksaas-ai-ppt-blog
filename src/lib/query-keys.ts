import type { PPTListParams } from '@/types/ppt';

export const pptKeys = {
  all: ['ppts'] as const,
  lists: () => [...pptKeys.all, 'list'] as const,
  list: (params?: PPTListParams) => [...pptKeys.lists(), params] as const,
  details: () => [...pptKeys.all, 'detail'] as const,
  detail: (id: string) => [...pptKeys.details(), id] as const,
};

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: any) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  settings: ['admin', 'settings'] as const,
};
