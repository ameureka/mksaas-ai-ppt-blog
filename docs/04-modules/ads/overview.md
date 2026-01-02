# 广告系统

激励广告系统，支持用户观看广告获取积分或免费下载。

## 模块结构

### API 路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/ad/start-watch` | POST | 开始观看广告 |
| `/api/ad/complete-watch` | POST | 完成观看，获取奖励 |

### 数据库表

**adWatchRecord** - 广告观看记录

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | 主键 |
| `userId` | TEXT | 用户 ID (可空) |
| `ipAddress` | TEXT | 匿名用户追踪 |
| `pptId` | TEXT | 关联 PPT |
| `watchToken` | TEXT | 观看验证 token (唯一) |
| `downloadToken` | TEXT | 下载验证 token |
| `startedAt` | TIMESTAMP | 开始时间 |
| `completedAt` | TIMESTAMP | 完成时间 |
| `status` | TEXT | pending / completed / expired |
| `creditsAwarded` | INTEGER | 奖励积分数 |

### 组件

位置: `src/components/ppt/ads/`

| 组件 | 功能 |
|------|------|
| `display-ad.tsx` | 展示广告 |
| `native-ad-card.tsx` | 原生广告卡片 |
| `rewarded-video-ad.tsx` | 激励视频广告 |

### Hooks

位置: `src/hooks/ads/`

| Hook | 功能 |
|------|------|
| `use-rewarded-video.ts` | 激励视频管理 |

## 工作流程

```
用户请求下载
    ↓
检查下载权限
    ↓
选择下载方式 → 积分下载 → 扣除积分
    ↓
观看广告下载
    ↓
调用 /api/ad/start-watch
    ↓
返回 watchToken + 显示广告
    ↓
用户观看完成
    ↓
调用 /api/ad/complete-watch
    ↓
验证观看时长 → 发放积分/下载权限
    ↓
返回 downloadToken → 允许下载
```

## 防刷机制

1. **Token 验证**: 唯一 watchToken 防止重复请求
2. **时长验证**: 检查 startedAt 到 completedAt 间隔
3. **IP 追踪**: 匿名用户通过 IP 限制频率
4. **状态检查**: 已完成或已过期的记录不可重复使用

## 配置

广告奖励积分数在 `adWatchRecord.creditsAwarded` 中记录。

## 相关文档

- [PPT 系统](../ppt/overview.md)
- [积分系统](../payment/overview.md)

---

**最后更新:** 2026-01-02
