# 🔐 Google OAuth 配置指南 | Google OAuth Configuration Guide

本指南帮助你正确配置 Google OAuth，解决 `redirect_uri_mismatch` 错误。

---

## 🎯 问题说明

当你看到以下错误时：

```
Error 400: redirect_uri_mismatch
Access blocked: This app's request is invalid
```

这表示 Google OAuth 应用中配置的**授权重定向 URI**与应用实际使用的回调 URL 不匹配。

---

## 📋 配置前准备

### 1. 确认你的应用信息

从 `.env.local` 文件中找到：

```bash
NEXT_PUBLIC_BASE_URL="http://localhost:3005"
GOOGLE_CLIENT_ID="82069656425-ujbr6b7qr46aqih10ejhlisce0llnfa2.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
```

### 2. 计算回调 URL

Better Auth 的 Google OAuth 回调 URL 格式：
```
{NEXT_PUBLIC_BASE_URL}/api/auth/callback/google
```

**开发环境回调 URL**：
```
http://localhost:3005/api/auth/callback/google
```

**生产环境回调 URL**（示例）：
```
https://yourdomain.com/api/auth/callback/google
```

---

## 🔧 配置步骤（详细图文）

### Step 1: 访问 Google Cloud Console

1. 打开浏览器，访问：
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. 如果有多个项目，确保选择正确的项目：
   - 项目名称：`gen-lang-client-0829917661`
   - 项目 ID：`gen-lang-client-0829917661`

---

### Step 2: 找到 OAuth 2.0 客户端 ID

1. 在"凭据"页面，找到 **OAuth 2.0 客户端 ID** 部分

2. 找到你的客户端（通过 Client ID 识别）：
   ```
   82069656425-ujbr6b7qr46aqih10ejhlisce0llnfa2.apps.googleusercontent.com
   ```

3. 点击客户端名称或右侧的 **编辑图标（铅笔）**

---

### Step 3: 编辑 OAuth 客户端配置

进入编辑页面后，你会看到以下字段：

#### 应用类型
- 应该是：**Web 应用**

#### 名称
- 可以是任意名称，例如：`ai-ppt-site` 或 `MkSaaS Blog`

#### 已获授权的 JavaScript 来源（可选）
这个字段用于限制哪些域名可以发起 OAuth 请求。

**开发环境**添加：
```
http://localhost:3005
```

**生产环境**添加：
```
https://yourdomain.com
```

#### 已获授权的重定向 URI（重要！）
这是最关键的配置！

---

### Step 4: 添加重定向 URI

在 **"已获授权的重定向 URI"** 部分：

1. 点击 **"+ 添加 URI"** 按钮

2. 输入开发环境的回调 URL：
   ```
   http://localhost:3005/api/auth/callback/google
   ```

3. 如果需要支持生产环境，再次点击 **"+ 添加 URI"**，输入：
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

4. 如果你的应用支持多语言路由，可能还需要添加：
   ```
   http://localhost:3005/zh/api/auth/callback/google
   http://localhost:3005/en/api/auth/callback/google
   ```
   **注意**：Better Auth 默认不需要语言前缀，所以通常只需要添加基础 URL。

---

### Step 5: 保存配置

1. 检查所有配置是否正确

2. 点击页面底部的 **"保存"** 按钮

3. 等待确认消息：
   ```
   OAuth 客户端已更新
   ```

---

### Step 6: 等待配置生效

⏰ **重要**：Google 需要 **1-5 分钟**来同步配置更改。

在此期间：
- ☕ 喝杯咖啡
- 📖 阅读文档
- 🧘 放松一下

---

### Step 7: 测试 Google 登录

1. **清除浏览器缓存**（可选但推荐）：
   - Chrome: `Ctrl+Shift+Delete` (Windows) 或 `Cmd+Shift+Delete` (Mac)
   - 选择"缓存的图片和文件"
   - 点击"清除数据"

2. **刷新应用页面**：
   ```
   http://localhost:3005
   ```

3. **点击"使用 Google 登录"**

4. **选择你的 Google 账号**

5. **授权应用访问**：
   - 查看应用请求的权限
   - 点击"允许"或"继续"

6. **验证登录成功**：
   - 应该自动跳转回应用
   - 看到用户信息或仪表板

---

## ✅ 配置检查清单

使用这个清单确保配置正确：

### Google Cloud Console 配置
- [ ] 已登录正确的 Google 账号
- [ ] 已选择正确的项目（`gen-lang-client-0829917661`）
- [ ] 已找到正确的 OAuth 客户端
- [ ] 应用类型是"Web 应用"
- [ ] 已添加 JavaScript 来源：`http://localhost:3005`
- [ ] 已添加重定向 URI：`http://localhost:3005/api/auth/callback/google`
- [ ] 已点击"保存"按钮
- [ ] 已等待 1-5 分钟让配置生效

### 应用配置
- [ ] `.env.local` 中 `NEXT_PUBLIC_BASE_URL` 正确
- [ ] `.env.local` 中 `GOOGLE_CLIENT_ID` 正确
- [ ] `.env.local` 中 `GOOGLE_CLIENT_SECRET` 正确
- [ ] 开发服务器正在运行（`pnpm dev`）
- [ ] 可以访问 `http://localhost:3005`

---

## 🔍 常见问题排查

### Q1: 仍然显示 `redirect_uri_mismatch` 错误？

**可能原因**：
1. 配置还未生效（等待 5 分钟）
2. 重定向 URI 拼写错误
3. 端口号不匹配
4. 协议不匹配（http vs https）

**解决方案**：
1. 仔细检查 URI 是否完全一致（包括端口号）
2. 确保没有多余的空格或斜杠
3. 等待更长时间（最多 10 分钟）
4. 清除浏览器缓存后重试

---

### Q2: 如何查看实际使用的回调 URL？

**方法 1：查看浏览器开发者工具**
1. 打开开发者工具（F12）
2. 切换到 "Network" 标签
3. 点击"使用 Google 登录"
4. 查找跳转到 Google 的请求
5. 在请求参数中找到 `redirect_uri`

**方法 2：查看错误详情**
1. 点击错误页面的 "error details"
2. 查看 "Redirect URI" 字段
3. 对比 Google Console 中配置的 URI

---

### Q3: 生产环境如何配置？

**步骤**：
1. 在 `.env.production` 中设置：
   ```bash
   NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
   ```

2. 在 Google Console 中添加生产环境的重定向 URI：
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

3. 确保域名已正确解析并可访问

4. 部署应用后测试

---

### Q4: 支持多个域名怎么办？

如果你有多个域名（开发、测试、生产），可以在 Google Console 中添加多个重定向 URI：

```
http://localhost:3005/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
https://staging.yourdomain.com/api/auth/callback/google
https://yourdomain.com/api/auth/callback/google
https://www.yourdomain.com/api/auth/callback/google
```

**注意**：每个 OAuth 客户端最多可以添加 **100 个**重定向 URI。

---

### Q5: 如何创建新的 OAuth 客户端？

如果你需要从头创建：

1. 访问 https://console.cloud.google.com/apis/credentials

2. 点击 **"+ 创建凭据"** → **"OAuth 客户端 ID"**

3. 如果是第一次，需要先配置 **OAuth 同意屏幕**：
   - 用户类型：选择"外部"
   - 应用名称：输入你的应用名称
   - 用户支持电子邮件：输入你的邮箱
   - 开发者联系信息：输入你的邮箱
   - 点击"保存并继续"

4. 配置范围（Scopes）：
   - 添加 `email`
   - 添加 `profile`
   - 添加 `openid`
   - 点击"保存并继续"

5. 添加测试用户（开发阶段）：
   - 添加你的 Google 账号邮箱
   - 点击"保存并继续"

6. 返回"凭据"页面，创建 OAuth 客户端 ID：
   - 应用类型：**Web 应用**
   - 名称：输入名称
   - 已获授权的 JavaScript 来源：`http://localhost:3005`
   - 已获授权的重定向 URI：`http://localhost:3005/api/auth/callback/google`
   - 点击"创建"

7. 复制 **客户端 ID** 和**客户端密钥**到 `.env.local`

---

## 📸 配置截图参考

### 1. OAuth 客户端列表页面
```
凭据
├─ API 密钥
├─ OAuth 2.0 客户端 ID
│  └─ ai-ppt-site (Web 应用)
│     客户端 ID: 82069656425-ujbr6b7qr46aqih10ejhlisce0llnfa2...
│     [编辑] [删除]
└─ 服务账号
```

### 2. OAuth 客户端编辑页面
```
编辑 OAuth 客户端

应用类型: Web 应用

名称: ai-ppt-site

已获授权的 JavaScript 来源
  http://localhost:3005
  [+ 添加 URI]

已获授权的重定向 URI
  http://localhost:3005/api/auth/callback/google
  [+ 添加 URI]

[取消] [保存]
```

---

## 🚀 快速配置命令

如果你想快速查看当前配置：

```bash
# 查看当前 BASE_URL
echo $NEXT_PUBLIC_BASE_URL

# 查看 Google Client ID
echo $GOOGLE_CLIENT_ID

# 计算回调 URL
echo "${NEXT_PUBLIC_BASE_URL}/api/auth/callback/google"
```

---

## 📚 相关文档

- **Better Auth 官方文档**: https://www.better-auth.com/docs/authentication/google
- **Google OAuth 文档**: https://developers.google.com/identity/protocols/oauth2
- **项目认证文档**: [docs/0-快速开始/最小化配置指南.md](./最小化配置指南.md)

---

## 💡 最佳实践

### 开发环境
- ✅ 使用 `http://localhost:3005`（与 `pnpm dev` 端口一致）
- ✅ 添加到 Google Console 的测试用户列表
- ✅ 使用测试模式的 OAuth 客户端

### 生产环境
- ✅ 使用 HTTPS（`https://yourdomain.com`）
- ✅ 配置自定义域名
- ✅ 发布 OAuth 应用（从测试模式切换到生产模式）
- ✅ 配置隐私政策和服务条款链接

### 安全建议
- ❌ 不要在代码中硬编码 Client Secret
- ❌ 不要提交 `.env.local` 到 Git
- ❌ 不要在客户端暴露 Client Secret
- ✅ 定期轮换 OAuth 密钥
- ✅ 监控 OAuth 使用情况
- ✅ 限制 OAuth 范围（只请求必要的权限）

---

## ✅ 配置完成后

配置成功后，你应该能够：

1. ✅ 点击"使用 Google 登录"
2. ✅ 跳转到 Google 登录页面
3. ✅ 选择账号并授权
4. ✅ 自动跳转回应用
5. ✅ 看到用户信息
6. ✅ 访问受保护的页面

---

**祝你配置顺利！🎉**

如有问题，请查看 [FAQ](./FAQ.md) 或联系技术支持。

**最后更新**: 2025-11-24
