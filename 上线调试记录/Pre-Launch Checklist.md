✦ 针对部署在 Vercel 上的 Next.js 全栈项目（尤其是像我们这样包含数据库、Auth、AI 功能的项目），上线前需要准备和检查的事项，我为您整理了一份Pre-Launch Checklist。

  这份清单不仅是为了“能跑起来”，更是为了稳定、省钱、利于 SEO。

  1. 环境变量 (Environment Variables) - 最关键
  Vercel 的环境变量需要在 Dashboard 中手动配置，`.env` 文件不会被上传。

   * Database (PostgreSQL):
       * DATABASE_URL: 生产环境的数据库连接串（务必使用 Transaction Pool 模式的连接串，如 Supabase 的 pooler 链接，因为 Next.js Serverless 会产生大量并发连接）。
   * Authentication (Better Auth):
       * BETTER_AUTH_SECRET: 生成一个新的强随机字符串（不要用开发环境的）。
       * BETTER_AUTH_URL: 生产环境域名，如 https://slideai.com (不能是 localhost)。
       * GITHUB_CLIENT_ID / SECRET: 必须去 GitHub 新申请一个 OAuth App，Callback URL 填生产环境的，不能和开发环境混用。
       * GOOGLE_CLIENT_ID / SECRET: 同上，去 Google Cloud Console 新增生产域名。
   * AI Providers:
       * OPENAI_API_KEY 等：确保 Key 有余额，且设置了额度上限（Hard Limit），防止被刷爆。
   * Payment (Stripe):
       * STRIPE_SECRET_KEY: 切换为 Live Mode 的 Key。
       * STRIPE_WEBHOOK_SECRET: 在 Stripe 后台配置生产环境的 Webhook URL 后获取。
   * Storage (S3/R2):
       * 确保 STORAGE_BUCKET_NAME 等配置指向生产环境的 Bucket。

  2. 数据库迁移 (Database Migration)
   * 执行迁移: 上线前务必在本地连接生产数据库执行一次 pnpm db:migrate，确保表结构是最新的。
   * 种子数据 (Seed): 如果需要预填充 PPT 分类、管理员账号等数据，准备好 seed 脚本并执行。

  3. 域名与 DNS (Domains)
   * 添加域名: 在 Vercel 项目设置中添加 slideai.com (举例)。
   * DNS 配置: 按照 Vercel 提示去域名注册商（Namecheap/Godaddy/阿里云）配置 A 记录或 CNAME。
   * www 重定向: Vercel 会自动处理 www 到根域名（或反之）的跳转，建议保留默认设置。

  4. Vercel 特有配置 (Vercel Config)
   * Function Region (函数区域):
       * 去 Vercel Settings -> Functions，确保 Region 设置在离你数据库最近的地方（例如数据库在美东 iad1，Vercel 也要选 iad1）。这能显著减少数据库延迟。
   * Web Analytics:
       * 在 Vercel Dashboard 开启 Analytics（免费版够用），这是最简单的流量统计方式。
   * Speed Insights:
       * 开启以监控真实用户的加载速度（Core Web Vitals）。

  5. 性能与成本优化 (Performance & Cost)
   * 图片优化: 我们代码里已经关了 unoptimized: true，这是一个省钱的好策略。但要确保上传的图片本身已经被压缩过（我们的 Pipeline 里有这一步）。
   * 日志监控:
       * 上线初期多看 Vercel Logs 中的 Runtime Logs，关注是否有 500 错误。
       * 关注 AI 接口的超时情况（默认 10s/15s，我们在 vercel.json 设置了 300s，这很好，但要注意 Pro 计划才有这么长）。

  6. SEO 最终检查
   * Robots.txt: 确保 /public/robots.txt 存在，并且允许爬虫索引（User-agent: * Allow: /）。
   * Sitemap: fumadocs 或 next-sitemap 通常会自动生成。检查 https://你的域名/sitemap.xml 是否能访问。
   * Metadata: 随便发个链接给微信/Slack/Discord 朋友，看抓取的 标题、描述、图片 (OG Image) 是否显示正确且美观。

  7. 功能冒烟测试 (Smoke Test)
  上线后立刻用普通用户身份（非管理员）测一遍核心流程：
   1. 注册/登录（能否收到验证码邮件？OAuth 能否跳回？）
   2. 搜索 PPT（AI 接口是否报错？）
   3. 下载 PPT（S3 链接是否有效？）
   4. 支付流程（哪怕是 1 美元，用真实信用卡跑通一次 Stripe 流程，然后退款）。

  总结：最容易踩坑的前 3 名 ⚠️
   1. OAuth 回调地址没改：导致登录后跳回 localhost。
   2. 环境变量漏填：导致某些功能 500 错误。
   3. 数据库连接数爆了：没用连接池（Pooler），高并发下数据库拒绝连接。

  准备好这些，您的上线就会非常稳健。我们可以开始做具体的准备工作了吗？比如检查环境变量清单？
