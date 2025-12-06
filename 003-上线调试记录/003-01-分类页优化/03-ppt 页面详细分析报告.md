PPT 详情页深度分析报告
页面路径: /ppt/[id] (如 /ppt/ppt_afd64a82_98d0) 文件位置: src/app/[locale]/(marketing)/ppt/[id]/page.tsx

一、数据链路分析
1. 数据流向
用户访问 /ppt/[id]
    ↓
page.tsx useEffect 调用 fetch('/api/ppts/[id]')
    ↓
src/app/api/ppts/[id]/route.ts
    ↓
getPPTById(id) from src/actions/ppt/ppt.ts
    ↓
数据库查询 ppt 表
    ↓
toPPTDto 转换返回
2. 数据库表结构 (ppt 表)
// 核心字段
id, title, author, description, category, tags[], language
slidesCount, fileUrl, coverImageUrl, thumbnailUrl
downloadCount, viewCount, status, fileSize, fileFormat
createdAt, updatedAt, deletedAt
3. 关联表
userDownloadHistory - 用户下载历史（外键 ppt_id）
adWatchRecord - 广告观看记录（外键 ppt_id）
userCredit - 用户积分
creditTransaction - 积分交易记录
二、发现的问题
🔴 严重问题 (P0)
1. 模板描述硬编码，未使用数据库字段
// 第 380-420 行 - 模板描述完全硬编码
<div>
  <h3>适用场景</h3>
  <ul>
    <li>• 企业年终总结汇报</li>  // ❌ 硬编码
    <li>• 个人工作述职报告</li>
    ...
  </ul>
</div>

<div>
  <h3>包含内容</h3>
  <div>• 封面页（1页）</div>  // ❌ 硬编码
  <div>• 目录页（1页）</div>
  ...
</div>

<div>
  <h3>模板特色</h3>
  <ul>
    <li>• 专业商务设计风格</li>  // ❌ 硬编码
    ...
  </ul>
</div>
问题: 所有 PPT 显示相同的"适用场景"、"包含内容"、"模板特色"，与实际模板无关

2. 用户评论系统未实现
// 第 79-80 行
const [reviews, setReviews] = useState<Review[]>([]);

// 第 130 行 - 数据获取后直接设为空
setReviews([]);

// 第 175-210 行 - 提交评论只是本地添加，未持久化
const handleSubmitReview = async () => {
  // ... 模拟延迟
  const newReview = { ... };
  setReviews([newReview, ...reviews]);  // ❌ 仅本地状态，刷新丢失
  toast.success('评价提交成功', { description: '您获得了 0.5 积分奖励' });
  // ❌ 未调用 API 保存评论
  // ❌ 未实际发放积分
};
问题:

数据库无 ppt_review 表
评论仅存在于前端状态
积分奖励是假的（未调用积分 API）
3. 推荐模板未实现
// 第 81 行
const [recommendations, setRecommendations] = useState<PPTDetail[]>([]);

// 第 131 行 - 直接设为空数组
setRecommendations([]);
问题: 推荐模板区域始终为空，无任何推荐逻辑

🟠 中等问题 (P1)
4. 文件大小显示问题
// API 返回 file_size 是 number (字节)
// 但页面直接显示
fileSize: data.file_size || '未知',  // 显示为 "0" 或数字

// 应该使用 formatFileSize 函数格式化
5. 预览图逻辑问题
// 第 119-121 行
previewUrls:
  data.preview_url && data.slides_count
    ? Array(Math.max(1, data.slides_count)).fill(data.preview_url)
    : [data.preview_url || '/placeholder.svg'],
问题: 用同一张图片填充所有页面预览，用户无法看到不同页面内容

6. 评分数据硬编码
// 第 116 行
rating: 4.5,  // ❌ 硬编码
reviewCount: 0,  // ❌ 始终为 0
7. 实时数据硬编码
// 第 560-570 行
<div className="flex items-center gap-2 text-sm">
  <span className="font-semibold text-orange-500">3人</span>  // ❌ 硬编码
  <span>下载</span>
</div>
<div className="flex items-center gap-2 text-sm">
  <span className="font-semibold text-primary">234人</span>  // ❌ 硬编码
  <span>下载</span>
</div>
8. 面包屑导航 category/subcategory 相同
// 第 280-290 行
<button onClick={() => router.push(PublicRoutes.Category(ppt.category))}>
  {ppt.category}
</button>
<span>/</span>
<button onClick={() => router.push(PublicRoutes.Category(ppt.subcategory))}>
  {ppt.subcategory}  // ❌ 与 category 相同
</button>
🟡 轻微问题 (P2)
9. 价格字段未使用
// PPTDetail 接口有 price 字段
price?: number;

// 但显示时使用 ppt.price 可能为 undefined
<span>使用 {ppt.price} 积分下载</span>  // 显示 "使用 undefined 积分下载"
10. 浏览量未记录
// 有 recordView action 但页面未调用
// src/actions/ppt/ppt.ts 有 recordView 函数
// 但 page.tsx 未在加载时调用
11. 分类显示为 slug 而非中文名
// 面包屑显示 "business" 而非 "商务汇报"
category: data.category ?? '其他',  // 直接使用 slug
三、数据库缺失
需要新增的表
1. PPT 评论表 ppt_review
CREATE TABLE ppt_review (
  id TEXT PRIMARY KEY,
  ppt_id TEXT NOT NULL REFERENCES ppt(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,  -- 是否已验证下载
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ppt_id, user_id)  -- 每用户每模板只能评价一次
);
2. 评论点赞表 ppt_review_helpful
CREATE TABLE ppt_review_helpful (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES ppt_review(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);
四、修复方案
方案 1: 模板描述动态化
数据库 ppt 表已有 description 字段
新增字段: use_cases TEXT[], features TEXT[], contents JSONB
或使用 AI 根据标题/分类自动生成
方案 2: 实现评论系统
创建 ppt_review 表
创建评论 CRUD API
实现评论提交时发放积分
实现"有用"点赞功能
方案 3: 实现推荐系统
基于分类推荐: 同分类其他热门模板
基于标签推荐: 相似标签的模板
基于下载推荐: 下载此模板的用户也下载了
方案 4: 修复数据展示
使用 formatFileSize 格式化文件大小
分类 slug 转中文名
调用 recordView 记录浏览量
价格默认值处理
五、问题优先级
| 优先级 | 问题 | 影响 | 修复难度 | |--------|------|------|----------| | P0 | 模板描述硬编码 | 所有模板显示相同内容 | 中 | | P0 | 评论系统未实现 | 功能缺失 | 高 | | P0 | 推荐模板未实现 | 功能缺失 | 中 | | P1 | 文件大小显示 | 显示为数字 | 低 | | P1 | 预览图重复 | 用户体验差 | 中 | | P1 | 评分硬编码 | 数据不准确 | 低 | | P1 | 实时数据硬编码 | 数据虚假 | 低 | | P1 | 面包屑重复 | 导航混乱 | 低 | | P2 | 价格 undefined | 显示异常 | 低 | | P2 | 浏览量未记录 | 统计不准 | 低 | | P2 | 分类显示 slug | 用户体验 | 低 |

六、建议修复顺序
第一阶段 (快速修复):

文件大小格式化
分类 slug 转中文
价格默认值
调用 recordView
移除/隐藏实时数据
修复面包屑
第二阶段 (功能完善):

实现推荐模板 (基于分类)
模板描述动态化 (使用 description 字段)
第三阶段 (新功能):

创建评论表
实现评论 API
评论积分奖励
评论点赞功能
是否开始执行修复？建议先从第一阶段快速修复开始。
