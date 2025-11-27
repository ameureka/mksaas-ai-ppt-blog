/**
 * 审计日志服务
 * 记录用户行为，用于分析和安全审计
 */

import { ApiClient } from '@/lib/ppt/api/client';
import type { AuditLog } from '@/lib/types/ppt/api';

export class AuditService {
  /**
   * 记录用户行为
   * @param action 行为类型
   * @param metadata 元数据
   */
  static async log(
    action: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const log: AuditLog = {
      action,
      metadata,
      timestamp: new Date().toISOString(),
    };

    try {
      // 异步发送，不阻塞用户操作
      await ApiClient.post('/audit/log', log);
    } catch (error) {
      // 审计日志失败不应影响用户操作，只记录到控制台
      console.error('[Audit Log Error]', error);
    }
  }

  /**
   * 批量记录行为（性能优化）
   * @param logs 日志数组
   */
  static async batchLog(logs: AuditLog[]): Promise<void> {
    try {
      await ApiClient.post('/audit/batch-log', { logs });
    } catch (error) {
      console.error('[Batch Audit Log Error]', error);
    }
  }
}
