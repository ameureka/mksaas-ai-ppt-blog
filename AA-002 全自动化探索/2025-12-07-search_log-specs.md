## 📊 搜索日志表 (search_log) 详细说明

### 🎯 作用和目的

**search_log 表**是 PPT 搜索系统的核心分析组件，用于：

1. **记录用户搜索行为** - 追踪每次搜索的关键词和结果
2. **生成热门关键词** - 统计高频搜索词，显示在首页
3. **优化搜索体验** - 分析搜索模式，改进算法
4. **业务洞察** - 了解用户需求和兴趣趋势

### 📋 表结构说明

| 字段 | 类型 | 说明 | 用途 |
|------|------|------|------|
| **id** | SERIAL PRIMARY KEY | 自增主键 | 唯一标识每条记录 |
| **keyword** | VARCHAR(255) | 搜索关键词 | 记录用户输入的搜索词 |
| **result_count** | INTEGER | 结果数量 | 该关键词返回的 PPT 数量 |
| **clicked_id** | VARCHAR(255) | 点击的PPT ID | 用户点击了哪个搜索结果 |
| **user_id** | VARCHAR(255) | 用户ID | 追踪登录用户（可选） |
| **session_id** | VARCHAR(255) | 会话ID | 追踪匿名用户 |
| **created_at** | TIMESTAMP | 创建时间 | 搜索发生的时间 |

### 🔍 索引优化

创建了两个索引以提升查询性能：

1. **idx_search_log_keyword** - 加速按关键词查询
   - 用于统计热门关键词
   - 快速查找相同关键词的历史记录

2. **idx_search_log_created_at** - 加速按时间查询
   - 用于获取最近的搜索记录
   - 支持时间范围统计（如最近7天热词）

### 🔄 数据流程

```
用户搜索 → 记录到 search_log → 统计分析 → 显示热门关键词
    ↓                              ↓
点击结果                      优化搜索算法
    ↓
记录 clicked_id
```

### 📈 实际应用场景

1. **首页热门关键词展示**
   ```sql
   SELECT keyword, COUNT(*) as search_count
   FROM search_log
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY keyword
   ORDER BY search_count DESC
   LIMIT 10;
   ```

2. **搜索转化率分析**
   ```sql
   SELECT 
     keyword,
     COUNT(*) as searches,
     COUNT(clicked_id) as clicks,
     COUNT(clicked_id)::FLOAT / COUNT(*) as ctr
   FROM search_log
   GROUP BY keyword;
   ```

3. **用户搜索历史**
   ```sql
   SELECT DISTINCT keyword
   FROM search_log
   WHERE user_id = ? OR session_id = ?
   ORDER BY created_at DESC
   LIMIT 5;
   ```

### ⚠️ 为什么需要创建这个表？

在执行向量生成后，我们发现：
- `pnpm update-hot-keywords` 命令失败
- 错误信息：`relation "search_log" does not exist`
- 原因：数据库中缺少这个表

### 🚀 执行方式

在 **Neon 控制台**执行这个 SQL 脚本：

1. 登录 Neon 控制台
2. 选择你的数据库
3. 打开 SQL Editor
4. 粘贴并运行脚本内容
5. 确认表创建成功

### ✅ 创建后的效果

- 搜索功能开始记录用户行为
- 可以生成热门关键词
- 支持搜索历史功能
- 为后续的搜索优化提供数据基础

这个表是搜索系统的**数据基础设施**，虽然不直接影响搜索功能，但对于**用户体验优化**和**业务分析**至关重要。