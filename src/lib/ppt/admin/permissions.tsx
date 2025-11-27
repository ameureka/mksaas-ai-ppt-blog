'use client';

/**
 * 权限管理工具
 *
 * 注意: 这是一个纯UI辅助工具，用于条件渲染
 * 真实的权限验证必须在Server Actions中进行
 *
 * TODO: 配合useUser() hook使用
 * 示例:
 * const { user } = useUser()
 * const isAdmin = user?.role === 'admin'
 * {isAdmin && <Button>管理操作</Button>}
 */

import type { AdminRole, AdminUser, Permission } from '@/lib/types/ppt/admin';

// 角色权限映射
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    'ppt:view',
    'ppt:edit',
    'ppt:delete',
    'ppt:batch',
    'user:view',
    'user:edit',
    'user:ban',
    'user:delete',
    'stats:view',
    'stats:export',
    'system:config',
    'admin:manage',
  ],
  admin: [
    'ppt:view',
    'ppt:edit',
    'ppt:delete',
    'user:view',
    'user:edit',
    'stats:view',
  ],
};

/**
 * 获取角色的所有权限
 */
export function getPermissions(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * 检查用户是否有某个权限
 *
 * 仅用于UI条件渲染，不能作为安全验证
 * TODO: Server Actions中必须重新验证权限
 */
export function hasPermission(
  admin: AdminUser,
  permission: Permission
): boolean {
  return admin.permissions.includes(permission);
}

/**
 * 检查用户是否有任意一个权限
 */
export function hasAnyPermission(
  admin: AdminUser,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => admin.permissions.includes(p));
}

/**
 * 检查用户是否有所有权限
 */
export function hasAllPermissions(
  admin: AdminUser,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => admin.permissions.includes(p));
}

/**
 * 检查是否是超级管理员
 */
export function isSuperAdmin(admin: AdminUser): boolean {
  return admin.role === 'super_admin';
}
