/**
 * API统一导出
 */

import { AuditService } from './services/audit.service';
import { AuthService } from './services/auth.service';
import { PPTService } from './services/ppt.service';

// 导出服务
export const API = {
  auth: AuthService,
  ppt: PPTService,
  audit: AuditService,
};

// 单独导出，方便按需引入
export { AuthService, PPTService, AuditService };
export { ApiClient, ApiError } from './client';
