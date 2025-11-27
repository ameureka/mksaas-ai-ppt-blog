/**
 * Server Actions 统一导出
 *
 * 保持与 actions-mock.ts 相同的导出接口
 * 迁移时只需修改各子模块的实现
 */

// PPT Actions
export {
  getPPTs,
  getPPTById,
  deletePPT,
  updatePPT,
  createPPT,
} from './ppt';

// User Actions
export {
  getUsers,
  getUserById,
  updateUser,
  banUser,
  unbanUser,
  adjustCredits,
} from './user';

// Stats & Settings Actions
export {
  getDashboardStats,
  updateSettings,
  type DashboardStats,
} from './stats';
