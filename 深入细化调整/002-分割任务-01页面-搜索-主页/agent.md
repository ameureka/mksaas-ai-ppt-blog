以下是关于首页改造设计计划与现状的详细总结分析：

  1. 核心目标：去 Mock 化与交互收敛
  目前的首页 (/ppt) 处于“演示模式”，数据是假的，逻辑是前端模拟的。
  本次改造的核心任务是：打通真实数据流 并 收敛下载入口。

   * 数据流：从 Mock Data 迁移至 PostgreSQL (Neon) -> Drizzle ORM -> Server Actions。
   * 交互流：列表页不再提供下载功能，所有点击（卡片、按钮）统一跳转至 详情页 (`/ppt/[id]`)，在详情页执行真实的下载动作。

  2. 现状分析 (As-Is)

  A. 数据库 (Ready)
   * 状态：数据库 ppt 表已就绪，包含 68 条真实数据。
   * 索引：已建立完善的索引（分类、状态、语言、时间、下载量），支持高效查询。
   * 差异：数据库缺少 description 和 file_size 字段（这在计划内，UI 层将做空值兜底）。

  B. 后端 (Broken)
   * Server Actions：src/actions/ppt/ppt.ts 目前是 Mock 实现，未连接数据库。
   * API 路由：src/app/api/ppts/route.ts 只是简单的参数透传，丢失了 language, category, sort 等关键筛选参数。
   * DTO：现有的数据转换逻辑丢失了 tags 和 language 字段。

  C. 前端 (Client-Side Logic)
   * 筛选逻辑：目前使用 useMemo 在客户端进行过滤，性能差且无法利用数据库索引。
   * 交互逻辑：点击下载按钮仅仅是弹出 Toast 演示，无法获取文件。
   * 配置缺失：
       * next.config.ts 未配置图片域名白名单 (aippt.guochunlin.com)，会导致图片加载失败。
       * 代码引用的 public/placeholder.svg 文件不存在，存在裂图风险。

  3. 改造方案设计 (To-Be)

  Phase 1: 基础与后端重构 (High Priority)
   1. 前置修复：
       * 创建/补全 public/placeholder.svg。
       * 修改 next.config.ts 添加图片域名白名单。
   2. 常量统一：创建 src/lib/constants/ppt.ts，统一定义分类 Slug (修复重复问题) 和热门搜索词。
   3. Action 重写：
       * getPPTs: 实现基于 Drizzle 的全量查询（支持分页、搜索、多维度筛选）。
       * downloadPPT: 实现 鉴权 -> 计数 (Atomic +1) -> 返回直链 的核心逻辑。

  Phase 2: 列表页改造 (/ppt)
   * 纯展示化：移除所有下载逻辑。
   * 路由跳转：点击卡片/按钮 -> 跳转 /ppt/[id]。
   * 服务端筛选：移除客户端过滤代码，将筛选条件转化为 URL 参数传递给后端。

  Phase 3: 详情页下载 (/ppt/[id])
   * 下载闭环：在详情页调用 downloadPPT Action，处理登录检查和文件下载。

  4. 总结
  这是一个非常典型的 "从演示到生产" (Demo to Production) 的重构任务。
   * 不需要：运行种子脚本（数据已有）。
   * 需要：大量删减前端的模拟代码，重写后端的查询逻辑，并修补配置文件。

  我已经完全掌握了所有细节，随时可以开始执行具体的代码修改。
