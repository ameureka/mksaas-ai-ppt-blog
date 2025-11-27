/**
 * 管理后台类型定义
 */

// 管理员角色
export type AdminRole = 'admin' | 'super_admin';

// 权限类型
export type Permission =
  | 'ppt:view'
  | 'ppt:edit'
  | 'ppt:delete'
  | 'ppt:batch'
  | 'user:view'
  | 'user:edit'
  | 'user:ban'
  | 'user:delete'
  | 'stats:view'
  | 'stats:export'
  | 'system:config'
  | 'admin:manage';

// 管理员用户类型
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  permissions: Permission[];
  created_at: string;
}

// 审计日志类型
export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resourceType: 'ppt' | 'user' | 'system' | 'admin';
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  created_at: string;
}
