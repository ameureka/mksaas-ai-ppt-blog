mk-saas 集成规范”——v0 项目应该遵守的规则
  ## 3. “mk-saas 集成规范”——v0 项目应该遵守的规则

  > 目标：让未来由 v0.app 生成的前端，在开发阶段就尽量贴近 mk-saas，使得迁移成本最低。

  ### 3.1 文件结构与路由约定

  规则 R1：v0 页面只负责“内容页面”，不要携带自己的 app shell

  - 约束：
      - v0 项目中的 app/layout.tsx、ThemeProvider、globals.css 在迁入 mk-saas 时将被舍弃。
      - 页面应设计为“可嵌入组件”：即把主内容组件放在 components/FeaturePage.tsx，page.tsx 只是简单地渲染它。
  - 集成方式：
      - 迁移时在 mk-saas 中创建：
          - src/app/[locale]/(v0)/<feature>/page.tsx：只做 generateMetadata + <FeaturePage />，遵守 mk-saas 的 i18n 与布局。
          - src/features/<feature>/FeaturePage.tsx：承载原 v0 页面 UI/逻辑。

  规则 R2：路由定义不写死 URL 字符串

  - 在 v0 项目中也要抽象路由：
      - 使用类似 mk-saas 的 Routes 枚举或 path builder 函数，而不是在组件中写 href="/dashboard" 这类硬编码。
  - 集成时：
      - 在 mk-saas 中重映射枚举值即可，无需逐个修改 <Link>。

  ### 3.2 状态管理与数据访问风格

  规则 R3：业务数据不要直接 fetch；维护一个“API 边界层”

  - 即便 v0 现在没有真实 API，也要定义 lib/api.ts 或 features/<feature>/api.ts 来封装数据访问。
  - 迁移策略：
      - 进入 mk-saas 后，这个 API 模块直接改为调用 src/actions/* 或 src/app/api/*/credits/payment 等服务，组件层无需大改。

  规则 R4：局部 UI 状态可以 useState，领域状态优先 Hook/Query

  - 在 v0 项目中：
      - 列表查询、详情加载等，最好封装为 useXxxQuery Hook，即使内部目前只是 useEffect + fetch。
  - 集成后：
      - 把实现换成 @tanstack/react-query 或 mk-saas 提供的 use-credits, use-users, use-payment 等 hook 即可。

  ### 3.3 UI / 样式与设计系统

  规则 R5：尽量使用 mk-saas 的 UI 模式（shadcn + cn）

  - 在 v0 项目中：
      - 组件命名和接口要与 mk-saas components/ui 对齐（例如 Button, Card, Dialog），而不是自创一套。
  - 集成后：
      - 直接删除 v0 的 components/ui，把 import 改为 @/components/ui 即可。

  规则 R6：避免增加全局 CSS 和自定义 <html><body> 属性

  - 字体、lang、dir、主题切换只在 mk-saas 的 [locale]/layout.tsx 管理。
  - v0 仅允许局部样式（Tailwind class 或少量 scoped CSS Modules）。

  ### 3.4 国际化与文案管理

  规则 R7：业务文案集中定义，避免硬编码在组件内部

  - v0 项目可以先只提供英文，但文案应集中在单独的 config / 文本对象中，或预先为 next-intl 结构预留 key。
  - 集成后：
      - 把这些 key 合并进 mk-saas 的 messages/*.json，组件通过 getTranslations 或 useTranslations 获取文案。

  ### 3.5 鉴权/权限与共享能力接入

  规则 R8：需要登录的功能不得自带独立 auth 机制

  - 在 v0 项目中，预留接口：例如依赖一个 useCurrentUser() hook，而不要直接操作 token/localStorage。
  - 集成后：
      - 替换为 mk-saas 的 use-session / use-current-user，并放在 (protected) 路由组下。