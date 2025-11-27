/**
 * PPT 模块路由常量
 *
 * 路由变化说明（参考 分析过程/adaptation-summary.md）：
 * - 前台页面添加 /ppt 前缀
 * - Admin 页面移除 /ppt 中间层（users/stats/settings）
 */

// 公开页面路由（添加 /ppt 前缀）
export const PublicRoutes = {
  Home: '/ppt', // 原来是 "/"
  Categories: '/ppt/categories', // 原来是 "/categories"
  Category: (name: string) => `/ppt/category/${encodeURIComponent(name)}`, // 原来是 "/category/..."
  PPTDetail: (id: string) => `/ppt/${id}`,
  Search: '/ppt/search',
} as const;

// PPT 管理后台路由
export const AdminRoutes = {
  Home: '/',
  Dashboard: '/admin/ppt',
  PPTs: '/admin/ppt/list',
  PPTEdit: (id: string) => `/admin/ppt/list/${id}/edit`,
  PPTCreate: '/admin/ppt/list/create',
  Users: '/admin/users', // 原来是 "/admin/ppt/users"
  Stats: '/admin/stats', // 原来是 "/admin/ppt/stats"
  Settings: '/admin/settings', // 原来是 "/admin/ppt/settings"
} as const;

// 用户中心路由
export const UserRoutes = {
  Profile: '/user/profile',
  Credits: '/user/credits',
  Settings: '/user/settings',
} as const;

// 认证路由（使用 mksaas 的认证路由）
export const AuthRoutes = {
  Login: '/auth/sign-in', // mksaas 使用 sign-in
  Register: '/auth/sign-up', // mksaas 使用 sign-up
} as const;

export type PublicRoute = (typeof PublicRoutes)[keyof typeof PublicRoutes];
export type AdminRoute = (typeof AdminRoutes)[keyof typeof AdminRoutes];
export type UserRoute = (typeof UserRoutes)[keyof typeof UserRoutes];
export type AuthRoute = (typeof AuthRoutes)[keyof typeof AuthRoutes];
