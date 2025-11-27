# 待处理 Bug 列表

1) 注册接口 500（生产）
- 现象：注册表单返回 “500: undefined”，疑似在发送验证邮件阶段抛出异常，错误未透出到前端。
- 状态：未排查。生产环境已配置 Resend，但可能存在环境变量缺失/命名不一致、from 域名未验证或收件人被拒等问题。
- 后续建议：
  - 查看 Vercel Functions / Logs 中 `/api/auth` 相关 500 的具体堆栈和 Resend 返回。
  - 核对生产环境变量：`RESEND_API_KEY`、`NEXT_PUBLIC_BASE_URL`、`BETTER_AUTH_SECRET`、`DATABASE_URL` 等是否在 Production 配置且名称正确。
  - 确认 `websiteConfig.mail.fromEmail` 域名已在 Resend 验证，并允许向目标邮箱发送。

• 看到的 “500: undefined” 来自注册接口返回 500 且 error message 为空，前端只是把 ctx.error.message 展示出来。常见触发点是在 sendVerificationEmail 里发验证邮件时抛了异常。生产你已经配了 Resend，但以下几种情况仍会让接口直接 500：

  - RESEND_API_KEY / BETTER_AUTH_SECRET / DATABASE_URL / NEXT_PUBLIC_BASE_URL 等运行时 env 缺失或命名不一致（Resend 常见拼错成 RESEND_API_TOKEN）。
  - websiteConfig.mail.fromEmail 域名未在 Resend 验证，或收件人（qq.com）被 Resend 拒信，SDK 抛出了错误。
  - Vercel 部署未携带最新 env（例如设置在 Preview 而 Production 未同步）。

  建议先快速定位具体异常：

  1. 在 Vercel 控制台 → Functions / Logs，搜索 /api/auth 的最新 500，能看到堆栈或 Resend 返回码。
  2. 确认生产环境变量：RESEND_API_KEY、NEXT_PUBLIC_BASE_URL（设为生产域名）、DATABASE_URL、BETTER_AUTH_SECRET 均存在且在 “Production” 环境。
  3. 确认 Resend 仪表盘里 from 域名已验证，并允许向 QQ 发送（Resend 对部分域名可能拒信）。

  如果需要，我可以在代码里加更明确的错误日志/提示，或在 Resend 失败时返回可读错误而不是 “undefined”。请先帮我拿到 Vercel 的该 500 的具体日志，我再对症修复。