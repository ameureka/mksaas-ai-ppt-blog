'use client';

/**
 * 审计日志工具
 *
 * 注意: 这是一个辅助工具库，仅用于类型定义和Mock实现
 * TODO: 真实实现应该在Server Actions中调用
 */

import type { AdminAuditLog } from '@/lib/types/ppt/admin';

/**
 * 创建审计日志
 *
 * 当前为Mock实现，仅在控制台输出
 * TODO: 替换为真实的Server Action调用
 * 示例: await createAuditLogAction(log)
 */
export async function createAuditLog(
  log: Omit<AdminAuditLog, 'id' | 'created_at' | 'adminEmail'>
): Promise<void> {
  // Mock implementation - 仅用于开发演示
  const fullLog: AdminAuditLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    adminEmail: 'admin@example.com', // Mock数据
  };

  console.log('[Audit Log Mock]', fullLog);

  // TODO: 在真实实现中，调用Server Action
  // await createAuditLogAction(fullLog)
}

/**
 * 批量创建审计日志
 */
export async function batchCreateAuditLog(
  logs: Omit<AdminAuditLog, 'id' | 'created_at' | 'adminEmail'>[]
): Promise<void> {
  // TODO: 实现真实的批量数据库写入
  for (const log of logs) {
    await createAuditLog(log);
  }
}

/**
 * 简化的审计日志记录函数
 *
 * TODO: 替换为真实的Server Action调用
 */
export async function auditLog(
  action: string,
  resourceType: 'ppt' | 'user' | 'system' | 'admin',
  resourceId: string,
  details?: Record<string, unknown>
): Promise<void> {
  // TODO: 从useUser() hook获取真实admin信息
  // const { user } = useUser()
  // const adminId = user?.id

  await createAuditLog({
    adminId: 'mock_admin_001', // Mock数据
    action,
    resourceType,
    resourceId,
    details: details || {},
    ipAddress: '127.0.0.1', // Mock数据
    userAgent: 'Mozilla/5.0', // Mock数据
  });
}
