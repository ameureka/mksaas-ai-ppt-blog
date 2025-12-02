# Cloudflare Turnstile 验证码配置教程

> Turnstile 是 Cloudflare 提供的免费、隐私友好的人机验证服务，用于替代传统的 CAPTCHA

---

## 📋 目录

1. [什么是 Turnstile](#1-什么是-turnstile)
2. [注册 Cloudflare 账号](#2-注册-cloudflare-账号)
3. [创建 Turnstile 站点](#3-创建-turnstile-站点)
4. [获取密钥](#4-获取密钥)
5. [配置环境变量](#5-配置环境变量)
6. [项目集成说明](#6-项目集成说明)
7. [测试验证](#7-测试验证)
8. [常见问题](#8-常见问题)

---

## 1. 什么是 Turnstile

Turnstile 是 Cloudflare 推出的智能人机验证解决方案：

**优势：**
- ✅ **完全免费** - 无使用限制
- ✅ **隐私友好** - 不收集用户数据用于广告
- ✅ **用户体验好** - 大多数情况下无需用户交互
- ✅ **无障碍支持** - 符合 WCAG 标准
- ✅ **多种模式** - 可见/不可见/非交互式

**适用场景：**
- 登录/注册表单
- 评论提交
- 联系表单
- API 请求保护

---

## 2. 注册 Cloudflare 账号

### 步骤 2.1：访问 Cloudflare

1. 打开浏览器，访问 [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)

### 步骤 2.2：创建账号

1. 输入邮箱地址
2. 设置密码（至少 8 位，包含字母和数字）
3. 点击 **Create Account**

### 步骤 2.3：验证邮箱

1. 检查邮箱收件箱
2. 点击 Cloudflare 发送的验证链接
3. 完成邮箱验证

> 💡 如果已有 Cloudflare 账号，直接登录即可

---

## 3. 创建 Turnstile 站点

### 步骤 3.1：进入 Turnstile 控制台

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在左侧菜单找到 **Turnstile**（在 "Security" 或直接搜索）
3. 或直接访问：[https://dash.cloudflare.com/?to=/:account/turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)

### 步骤 3.2：添加站点

1. 点击 **Add Site** 按钮

2. 填写站点信息：

   | 字段 | 说明 | 示例值 |
   |------|------|--------|
   | **Site name** | 站点名称（仅用于识别） | `MkSaaS AI PPT Blog` |
   | **Domain** | 允许使用的域名 | `mksaas-ai-ppt-blog.vercel.app` |

3. 选择 **Widget Mode**（小部件模式）：

   | 模式 | 说明 | 推荐场景 |
   |------|------|----------|
   | **Managed** | 自动决定是否显示挑战 | ✅ 推荐，平衡安全与体验 |
   | **Non-interactive** | 完全不可见，后台验证 | 高流量、低风险场景 |
   | **Invisible** | 不可见，但可能显示挑战 | 需要更高安全性 |

   > 💡 **推荐选择 Managed 模式**

4. 点击 **Create** 创建站点

### 步骤 3.3：添加多个域名（可选）

如果需要在多个域名使用同一个 Turnstile：

1. 在创建时添加多个域名，每行一个：
   ```
   mksaas-ai-ppt-blog.vercel.app
   localhost
   127.0.0.1
   ```

2. 或创建后点击站点 → **Settings** → 添加域名

> ⚠️ **重要**：开发环境需要添加 `localhost` 和 `127.0.0.1`

---

## 4. 获取密钥

创建站点后，会显示两个密钥：

### Site Key（站点密钥）
- **用途**：前端使用，嵌入到网页中
- **格式**：`0x4AAAAAAA...`
- **安全性**：可以公开，会暴露在前端代码中

### Secret Key（私密密钥）
- **用途**：后端使用，验证 token
- **格式**：`0x4AAAAAAA...`
- **安全性**：⚠️ 必须保密，只能在服务器端使用

### 查看密钥

1. 在 Turnstile 控制台点击你的站点
2. 在 **Site Key** 和 **Secret Key** 区域查看
3. 点击复制按钮复制密钥

---

## 5. 配置环境变量

### 步骤 5.1：编辑 .env.local

在项目根目录的 `.env.local` 文件中添加：

```bash
# -----------------------------------------------------------------------------
# Captcha (Cloudflare Turnstile)
# 人机验证，防止机器人攻击
# 获取地址: https://dash.cloudflare.com/ -> Turnstile
# -----------------------------------------------------------------------------
NEXT_PUBLIC_TURNSTILE_SITE_KEY="你的Site Key"
TURNSTILE_SECRET_KEY="你的Secret Key"
```

### 步骤 5.2：示例配置

```bash
# 示例（请替换为你自己的密钥）
NEXT_PUBLIC_TURNSTILE_SITE_KEY="0x4AAAAAAAxxxxxxxxxxxxxxxx"
TURNSTILE_SECRET_KEY="0x4AAAAAAAyyyyyyyyyyyyyyyy"
```

### 步骤 5.3：Vercel 环境变量配置

如果部署到 Vercel：

1. 进入 Vercel 项目设置
2. 点击 **Settings** → **Environment Variables**
3. 添加以下变量：

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 你的 Site Key | Production, Preview, Development |
   | `TURNSTILE_SECRET_KEY` | 你的 Secret Key | Production, Preview, Development |

4. 点击 **Save** 保存
5. 重新部署项目使配置生效

---

## 6. 项目集成说明

MkSaaS 项目已内置 Turnstile 支持，配置环境变量后即可使用。

### 前端组件位置

```
src/components/captcha/
├── turnstile.tsx        # Turnstile 组件
└── index.ts             # 导出
```

### 使用示例

```tsx
import { Turnstile } from '@/components/captcha'

function LoginForm() {
  const [token, setToken] = useState('')

  return (
    <form>
      {/* 其他表单字段 */}
      
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onVerify={(token) => setToken(token)}
      />
      
      <button type="submit">登录</button>
    </form>
  )
}
```

### 后端验证

```typescript
// src/actions/captcha.ts
async function verifyCaptcha(token: string) {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  )
  
  const data = await response.json()
  return data.success
}
```

---

## 7. 测试验证

### 本地测试

1. 确保 `.env.local` 已配置密钥
2. 确保 Turnstile 站点已添加 `localhost` 域名
3. 启动开发服务器：`pnpm dev`
4. 访问登录/注册页面
5. 检查 Turnstile 小部件是否正常显示

### 测试密钥（仅开发用）

Cloudflare 提供测试密钥，用于开发环境：

| 类型 | Site Key | Secret Key | 行为 |
|------|----------|------------|------|
| 始终通过 | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` | 始终验证成功 |
| 始终失败 | `2x00000000000000000000AB` | `2x0000000000000000000000000000000AB` | 始终验证失败 |
| 强制交互 | `3x00000000000000000000FF` | `3x0000000000000000000000000000000FF` | 强制显示挑战 |

### 验证 API 响应

成功响应：
```json
{
  "success": true,
  "challenge_ts": "2024-01-01T00:00:00.000Z",
  "hostname": "mksaas-ai-ppt-blog.vercel.app"
}
```

失败响应：
```json
{
  "success": false,
  "error-codes": ["invalid-input-response"]
}
```

---

## 8. 常见问题

### Q1: Turnstile 不显示？

**可能原因：**
- Site Key 配置错误
- 域名未添加到 Turnstile 站点
- 浏览器扩展阻止了脚本

**解决方案：**
1. 检查 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 是否正确
2. 确保当前域名已添加到 Turnstile 设置
3. 尝试禁用广告拦截器

### Q2: 验证始终失败？

**可能原因：**
- Secret Key 配置错误
- Token 已过期（有效期 5 分钟）
- 网络问题

**解决方案：**
1. 检查 `TURNSTILE_SECRET_KEY` 是否正确
2. 确保 token 在获取后立即使用
3. 检查服务器是否能访问 Cloudflare API

### Q3: 本地开发无法使用？

**解决方案：**
1. 在 Turnstile 站点设置中添加域名：
   - `localhost`
   - `127.0.0.1`
   - `localhost:3005`（如果使用特定端口）

### Q4: 如何查看统计数据？

1. 登录 Cloudflare Dashboard
2. 进入 Turnstile
3. 点击站点名称
4. 查看 **Analytics** 标签页

### Q5: 免费版有限制吗？

**没有限制！** Turnstile 完全免费，包括：
- 无请求数量限制
- 无带宽限制
- 所有功能可用

---

## 📚 参考链接

- [Turnstile 官方文档](https://developers.cloudflare.com/turnstile/)
- [Turnstile 控制台](https://dash.cloudflare.com/?to=/:account/turnstile)
- [MkSaaS 验证码文档](https://mksaas.com/docs/captcha)
- [React Turnstile 组件](https://github.com/marsidev/react-turnstile)

---

## ✅ 配置检查清单

- [ ] 已注册 Cloudflare 账号
- [ ] 已创建 Turnstile 站点
- [ ] 已添加生产域名（如 `mksaas-ai-ppt-blog.vercel.app`）
- [ ] 已添加开发域名（`localhost`）
- [ ] 已获取 Site Key 和 Secret Key
- [ ] 已配置 `.env.local` 环境变量
- [ ] 已配置 Vercel 环境变量（如使用 Vercel）
- [ ] 已测试本地开发环境
- [ ] 已测试生产环境
