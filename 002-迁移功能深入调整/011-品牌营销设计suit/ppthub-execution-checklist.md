# PPTHub 品牌执行清单

> 品牌名称：PPTHub
> 域名：ppthub.shop
> 开始时间：2025-12-02

---

## ✅ 已完成

### 阶段 0：品牌战略设计
- [x] 品牌定位确认
- [x] 目标受众分析
- [x] 品牌名称确定：PPTHub
- [x] 域名选择：ppthub.shop
- [x] 品牌配置文件创建：brand-config.json
- [x] Logo 设计方案：ppthub-logo-design.md

---

## 🚧 进行中

### 阶段 1：Logo 设计与资产准备

#### 任务 1.1：Logo 生成 ✅
- [x] 选择 Logo 生成方式
  - [x] 使用 Gemini Image 3 生成
- [x] 生成 Logo 初稿（4 个变体）
- [x] 评审并选择最佳方案
- [x] 重命名为标准格式：ppthub-logo-full.png

**已完成**：2025-12-02

---

#### 任务 1.2：Logo 变体制作
- [ ] 主 Logo（横版，180x40px）
- [ ] 图标 Logo（正方形，512x512px）
- [ ] 深色模式版本
- [ ] 浅色模式版本
- [ ] 单色版本（黑/白）

**预计完成**：本周内

---

#### 任务 1.3：Favicon 生成
```bash
# 执行命令
cd 深入细化调整/011-品牌营销设计suit
./generate-favicon.sh brand-assets/logo/ppthub-icon.png
```

**输出文件**：
- [ ] favicon.ico
- [ ] favicon-16x16.png
- [ ] favicon-32x32.png
- [ ] apple-touch-icon.png
- [ ] android-chrome-192x192.png
- [ ] android-chrome-512x512.png
- [ ] site.webmanifest
- [ ] browserconfig.xml

**预计完成**：Logo 完成后立即执行

---

#### 任务 1.4：社交媒体资源
- [ ] 小红书头像（400x400px）
- [ ] 抖音头像（200x200px）
- [ ] 微信公众号头像（200x200px）
- [ ] 知乎头像（200x200px）
- [ ] 封面图（1500x500px）

**预计完成**：本周内

---

#### 任务 1.5：OG 图设计
- [ ] 默认 OG 图（1200x630px）
- [ ] 首页 OG 图
- [ ] 博客 OG 图
- [ ] 分类页 OG 图模板

**预计完成**：本周内

---

## 📅 待执行

### 阶段 2：域名注册与配置

#### 任务 2.1：域名注册
- [ ] 注册 ppthub.shop（¥12/年）
  - 平台：阿里云万网 https://wanwang.aliyun.com/
- [ ] 可选：注册 ppthub.xyz（¥7/年）
- [ ] 可选：注册 ppthub.cc（¥32/年）

**预计完成**：今天

---

#### 任务 2.2：DNS 配置
- [ ] 添加 A 记录指向服务器
- [ ] 添加 CNAME 记录（www）
- [ ] 配置 SSL 证书（Let's Encrypt）
- [ ] 测试域名解析

**预计完成**：域名注册后 24 小时内

---

#### 任务 2.3：社交媒体账号注册
- [ ] 小红书：@ppthub
- [ ] 抖音：@ppthub
- [ ] 微信公众号：PPTHub
- [ ] 知乎：ppthub
- [ ] 微博：@PPTHub

**预计完成**：本周内

---

### 阶段 3：品牌信息替换

#### 任务 3.1：代码配置更新
- [ ] 更新 src/config/website.tsx
  - 替换品牌名称：MkSaaS → PPTHub
  - 替换域名：mksaas.me → ppthub.shop

- [ ] 更新 package.json
  - name: "ppthub"
  - description: "AI 驱动的 PPT 模板下载站"

- [ ] 更新 README.md
  - 替换所有品牌引用

**预计完成**：下周

---

#### 任务 3.2：国际化文件更新
- [ ] messages/en.json
  - 替换品牌名称和标语

- [ ] messages/zh.json
  - 替换品牌名称和标语

**预计完成**：下周

---

#### 任务 3.3：作者信息统一
- [ ] 创建新作者：ppthub-official
- [ ] 批量更新 204 篇博客的 author 字段
  ```bash
  npx tsx scripts/update-blog-authors.ts
  ```
- [ ] 删除旧作者文件（fox, mksaas, haitang, mkdirs, pptx-team）

**预计完成**：下周

---

#### 任务 3.4：视觉资产替换
- [ ] 替换 public/logo.png
- [ ] 替换 public/logo-dark.png
- [ ] 替换 public/og.png
- [ ] 替换 public/images/avatars/*.png
- [ ] 复制 Favicon 套件到 public/

**预计完成**：Logo 完成后

---

### 阶段 4：SEO 优化

#### 任务 4.1：Meta 标签更新
- [ ] 更新 <title> 标签
- [ ] 更新 <meta name="description">
- [ ] 更新 Open Graph 标签
- [ ] 更新 Twitter Card 标签

**预计完成**：下周

---

#### 任务 4.2：Sitemap 更新
- [ ] 生成新的 sitemap.xml
- [ ] 提交到 Google Search Console
- [ ] 提交到百度站长平台

**预计完成**：下周

---

#### 任务 4.3：llms.txt 更新
- [ ] 更新品牌名称
- [ ] 更新核心页面描述
- [ ] 更新分类信息

**预计完成**：下周

---

### 阶段 5：测试与验证

#### 任务 5.1：功能测试
- [ ] 本地开发环境测试（pnpm dev）
- [ ] 构建测试（pnpm build）
- [ ] 深浅模式切换测试
- [ ] 移动端适配测试

**预计完成**：品牌替换完成后

---

#### 任务 5.2：视觉验证
- [ ] Logo 显示正常
- [ ] Favicon 显示正常
- [ ] 深浅模式 Logo 切换正常
- [ ] 所有页面品牌一致

**预计完成**：品牌替换完成后

---

#### 任务 5.3：SEO 验证
- [ ] 使用 Google Rich Results Test 验证
- [ ] 使用 Facebook Debugger 验证 OG 图
- [ ] 检查 robots.txt
- [ ] 检查 sitemap.xml

**预计完成**：上线前

---

### 阶段 6：上线部署

#### 任务 6.1：备份
- [ ] Git 提交并打标签
  ```bash
  git add .
  git commit -m "feat: rebrand to PPTHub"
  git tag v1.0.0-ppthub
  git push origin main --tags
  ```

**预计完成**：上线前

---

#### 任务 6.2：部署
- [ ] 部署到生产环境
- [ ] 配置域名 ppthub.shop
- [ ] 配置 SSL 证书
- [ ] 测试生产环境

**预计完成**：测试通过后

---

#### 任务 6.3：监控
- [ ] 配置 Google Analytics
- [ ] 配置错误监控
- [ ] 配置性能监控
- [ ] 设置告警

**预计完成**：上线后

---

## 📊 进度总览

```
阶段 0: 品牌战略设计    ████████████████████ 100% ✅
阶段 1: Logo 与资产     ████░░░░░░░░░░░░░░░░  20% ⏳
阶段 2: 域名与账号      ░░░░░░░░░░░░░░░░░░░░   0% ⏸️
阶段 3: 品牌信息替换    ░░░░░░░░░░░░░░░░░░░░   0% ⏸️
阶段 4: SEO 优化        ░░░░░░░░░░░░░░░░░░░░   0% ⏸️
阶段 5: 测试与验证      ░░░░░░░░░░░░░░░░░░░░   0% ⏸️
阶段 6: 上线部署        ░░░░░░░░░░░░░░░░░░░░   0% ⏸️

总体进度：17% (1/6 阶段完成)
```

---

## 🎯 本周目标

### 必须完成（P0）
- [x] 品牌名称确定
- [x] 域名选择
- [x] 品牌配置创建
- [ ] Logo 设计完成
- [ ] Favicon 生成
- [ ] 域名注册

### 应该完成（P1）
- [ ] Logo 变体制作
- [ ] 社交媒体资源
- [ ] 社交媒体账号注册

### 可以延后（P2）
- [ ] OG 图设计
- [ ] 品牌信息替换
- [ ] SEO 优化

---

## 💰 预算追踪

| 项目 | 预算 | 实际 | 状态 |
|-----|------|------|------|
| 域名注册 | ¥20 | ¥0 | 待支付 |
| Logo 设计 | $10-200 | $0 | 待支付 |
| 社交媒体认证 | ¥300 | ¥0 | 可选 |
| **总计** | **¥350-1500** | **¥0** | - |

---

## 📞 协作分工

### 产品负责人
- [x] 品牌战略决策
- [ ] Logo 方案评审
- [ ] 最终验收

### 设计负责人
- [ ] Logo 设计/生成
- [ ] 视觉资产制作
- [ ] 设计规范维护

### 技术负责人
- [ ] 域名注册配置
- [ ] 代码配置更新
- [ ] 部署上线

### 内容负责人
- [ ] 社交媒体账号注册
- [ ] 品牌文案撰写
- [ ] SEO 优化

---

## 🔄 每日更新

### 2025-12-02
- ✅ 品牌名称确定：PPTHub
- ✅ 域名选择：ppthub.shop
- ✅ 品牌配置创建
- ✅ Logo 设计方案完成
- ⏳ 等待 Logo 生成方式选择

---

**下一步行动**：选择 Logo 生成方式并开始制作 🎨
