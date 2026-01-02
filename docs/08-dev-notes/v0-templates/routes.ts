// mk-saas compatible route definitions
// Usage: import { Routes } from "@/routes"
// Then reference Routes.FeatureDetail rather than hardcoded strings.
// 中文说明：统一维护路由常量，避免在组件中硬编码字符串，方便迁移到 mk-saas。

export enum Routes {
  Root = '/',
  MarketingHome = '/',
  Pricing = '/pricing',
  Blog = '/blog',
  Docs = '/docs',
  Contact = '/contact',
  Changelog = '/changelog',
  Login = '/auth/login',
  Register = '/auth/register',
  Dashboard = '/dashboard',
  SettingsProfile = '/settings/profile',
  SettingsBilling = '/settings/billing',
  Payment = '/payment',
  FeatureExample = '/features/example',
}

export const protectedRoutes = [
  Routes.Dashboard,
  Routes.SettingsProfile,
  Routes.SettingsBilling,
];
// 中文说明：需要登录后才能访问的受保护路由列表，迁移后可直接复用。

export const routesNotAllowedByLoggedInUsers = [Routes.Login, Routes.Register];
// 中文说明：已登录用户不应再次访问的页面，如登录/注册。
