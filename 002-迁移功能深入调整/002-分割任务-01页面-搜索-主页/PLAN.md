# /ppt 搜索主页改造计划 (V2.0)

> **文档状态**: 2025-11-28 已基于最新方案更新
> **核心目标**: 全面去 Mock 化，接通 Drizzle ORM，修复数据断层。

## 1. 范围与现状 (更新)
- **范围**: `/ppt` (主页), `/ppt/category/[slug]`, `/ppt/[id]`, 管理端, 下载链路。
- **现状**:
  - 前端使用 Mock 数据和客户端过滤 (已确认不可用)。
  - 后端 Action 是 Mock 实现。
  - 数据库 `ppt` 表就绪。
  - **阻断点**: 前后端字段不匹配 (tags/language)，参数传递丢失。

## 2. 核心改造方案

### 2.1 数据层 (Server Actions)
- **重写 `src/actions/ppt/ppt.ts`**:
  - 废弃所有 Mock 数据。
  - 对接 Drizzle ORM。
  - 实现 `getPPTs`, `getPPTById`, `createPPT`, `updatePPT`, `deletePPT`, `recordDownload`, `recordView`。
  - **必须修复**: DTO 补全 `tags` 和 `language`，支持所有过滤参数。

### 2.2 前端重构
- **架构**: 从 CSR (fetch + useEffect) 迁移到 **SSR (Server Components)** 或 **React Query** (视交互复杂度而定，搜索页建议保持 Client Component 但数据源改用正确 API)。
- **逻辑**:
  - 移除 `filteredResults` (客户端过滤)。
  - 所有筛选 (`category`, `language`, `sort`) 转化为 URL 参数或 API 参数。
  - 修复分类 Slug 重复问题。

### 2.3 下载链路
- **Action**: 实现真实下载逻辑 (检查权限 -> 记录下载 -> 返回链接)。
- **UI**: 替换 Toast 演示，接入真实 Action。

---

## 3. 任务拆分清单 (Execution Plan)

### Phase 0: 前置修复 (Critical)
1. [ ] **资源检查**: 确认 `public/placeholder.svg` 存在，不存在则创建。
2. [ ] **配置修复**: 更新 `next.config.ts` 添加 `aippt.guochunlin.com` 到 `remotePatterns`。

### Phase 1: 后端重构 (Immediate)
3. [ ] **常量定义**: 创建 `src/lib/constants/ppt.ts` (Hot Keywords, Categories)。
4. [ ] **Action 实现**: 重写 `src/actions/ppt/ppt.ts` (Drizzle Logic, DTO Fallbacks)。
5. [ ] **API 适配**: 更新 `src/app/api/ppts/route.ts` 透传所有参数。

### Phase 2: 前端对接 (Follow-up)
6. [ ] **配置替换**: `page.tsx` 引入 `src/lib/constants/ppt.ts`。
7. [ ] **逻辑重写**: `page.tsx` 移除客户端过滤，对接新 API，处理图片回退。
8. [ ] **下载实装**: 接入 `recordDownload` Action。

### Phase 3: 管理端与收尾
7. [ ] **Admin CRUD**: 更新管理端 Action 调用。
8. [ ] **QA**: 验证分页、搜索、筛选、下载功能。

---

## 4. 关联文件
- **Action**: `src/actions/ppt/ppt.ts`
- **API**: `src/app/api/ppts/route.ts`
- **Page**: `src/app/[locale]/(marketing)/ppt/page.tsx`
- **Constants**: `src/lib/constants/ppt.ts` (New)