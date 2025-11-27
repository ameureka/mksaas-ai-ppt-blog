// Mock用户数据

import {
  CreditTransaction,
  type User,
  type UserStats,
} from '@/lib/types/ppt/user';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: '张三',
    email: 'zhangsan@example.com',
    avatar: '/placeholder.svg',
    credits: 500,
    emailVerified: true,
    created_at: '2025-01-10T10:00:00Z',
    lastLoginAt: '2025-01-17T15:30:00Z',
    status: 'active',
  },
  {
    id: 'user-2',
    username: '李四',
    email: 'lisi@example.com',
    credits: 230,
    emailVerified: true,
    created_at: '2025-01-12T14:20:00Z',
    lastLoginAt: '2025-01-17T09:15:00Z',
    status: 'active',
  },
  {
    id: 'user-3',
    username: '王五',
    email: 'wangwu@example.com',
    credits: 0,
    emailVerified: false,
    created_at: '2025-01-15T08:45:00Z',
    status: 'active',
  },
  {
    id: 'user-4',
    username: '赵六',
    email: 'zhaoliu@example.com',
    credits: 1200,
    emailVerified: true,
    created_at: '2025-01-08T11:00:00Z',
    lastLoginAt: '2025-01-16T20:00:00Z',
    status: 'active',
  },
  {
    id: 'user-5',
    username: '钱七',
    email: 'qianqi@example.com',
    credits: 50,
    emailVerified: true,
    created_at: '2025-01-14T16:30:00Z',
    lastLoginAt: '2025-01-17T12:00:00Z',
    status: 'banned',
  },
];

export const mockUserStats: Record<string, UserStats> = {
  'user-1': {
    totalDownloads: 45,
    totalCreditsSpent: 450,
    totalCreditsEarned: 950,
    accountAge: 7,
  },
  'user-2': {
    totalDownloads: 23,
    totalCreditsSpent: 230,
    totalCreditsEarned: 460,
    accountAge: 5,
  },
  'user-3': {
    totalDownloads: 0,
    totalCreditsSpent: 0,
    totalCreditsEarned: 0,
    accountAge: 2,
  },
  'user-4': {
    totalDownloads: 120,
    totalCreditsSpent: 1200,
    totalCreditsEarned: 2400,
    accountAge: 9,
  },
  'user-5': {
    totalDownloads: 5,
    totalCreditsSpent: 50,
    totalCreditsEarned: 100,
    accountAge: 3,
  },
};
