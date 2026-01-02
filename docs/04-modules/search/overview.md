# 搜索系统

支持文档搜索和 PPT 模板搜索，包含热词管理功能。

## 模块结构

### API 路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/search` | GET | 文档搜索 (Fumadocs + Orama) |
| `/api/search/suggestions` | GET | 搜索建议/自动补全 |
| `/api/search/click` | POST | 记录搜索点击 |
| `/api/search/sync-history` | POST | 同步搜索历史 |
| `/api/hot-keywords` | GET | 获取热门关键词 |

### CRON 任务

| 路由 | 功能 |
|------|------|
| `/api/cron/update-hot-keywords` | 更新热门关键词 |
| `/api/cron/repair-embeddings` | 修复 PPT 向量嵌入 |

### 数据库表

**searchLog** - 搜索日志

| 字段 | 类型 | 说明 |
|------|------|------|
| `keyword` | TEXT | 搜索关键词 |
| `resultCount` | INTEGER | 结果数量 |
| `clickedPptId` | TEXT | 点击的 PPT |
| `source` | TEXT | search / hot_keyword / suggestion |
| `searchType` | TEXT | vector / sql / hybrid |
| `durationMs` | INTEGER | 搜索耗时 |

**hotKeywords** - 热门关键词

| 字段 | 类型 | 说明 |
|------|------|------|
| `keyword` | TEXT | 关键词 |
| `searchCount` | INTEGER | 搜索次数 |
| `downloadScore` | NUMERIC | 下载权重分 |
| `finalScore` | NUMERIC | 最终排名分 |
| `rank` | INTEGER | 排名位置 (唯一) |

**pinnedKeywords** - 置顶关键词

| 字段 | 类型 | 说明 |
|------|------|------|
| `keyword` | TEXT | 关键词 (唯一) |
| `rank` | INTEGER | 置顶排名 (唯一) |

### 管理 API

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/admin/pinned-keywords` | GET/POST | 管理置顶关键词 |
| `/api/admin/pinned-keywords/[id]` | PATCH/DELETE | 更新/删除置顶 |

### Server Actions

位置: `src/actions/`

- `search/` - 搜索相关操作
- `hot-keywords.ts` - 热词管理

## 搜索类型

### 1. 文档搜索

- 使用 Fumadocs + Orama
- 支持中文分词 (Mandarin tokenizer)
- 端点: `/api/search`

### 2. PPT 语义搜索

- 使用 pgvector 向量搜索
- 1024 维嵌入向量
- 支持混合搜索 (向量 + SQL)

## 热词算法

热词排名基于:
1. `searchCount` - 搜索次数
2. `downloadScore` - 下载转化权重
3. `finalScore` - 综合评分

置顶关键词 (`pinnedKeywords`) 优先于自动计算的热词。

## 配置

热词由 CRON 任务定期更新:
- Vercel Cron 或外部调度器触发
- 调用 `/api/cron/update-hot-keywords`

## 相关文档

- [PPT 系统](../ppt/overview.md)
- [API 参考](../../05-reference/API参考文档.md)

---

**最后更新:** 2026-01-02
