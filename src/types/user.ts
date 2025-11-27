import type { ListParams, ListResult } from './server-action';

export type UserStatus = 'active' | 'banned' | 'suspended';

export type UserRole = 'user' | 'vip' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  credits: number;
  role?: UserRole;
  emailVerified: boolean;
  created_at: string;
  lastLoginAt?: string;
  status: UserStatus;
}

export interface UserStats {
  totalDownloads: number;
  totalCreditsSpent: number;
  totalCreditsEarned: number;
  accountAge: number; // 天数
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number; // 正数为增加，负数为扣除
  type: 'purchase' | 'download' | 'refund' | 'admin_adjust';
  reason: string;
  created_at: string;
  adminId?: string; // 如果是管理员调整
}

export interface UserListParams extends ListParams {
  status?: UserStatus;
  role?: UserRole;
  emailVerified?: boolean;
}

export type UserListResult = ListResult<User>;

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  avatar?: string;
  credits?: number;
  role?: UserRole;
  status?: UserStatus;
}

export interface BanUserInput {
  userId: string;
  reason?: string;
}
