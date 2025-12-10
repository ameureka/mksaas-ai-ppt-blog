import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';

// 加载环境变量
loadEnvConfig(process.cwd());

import { getDb } from '../src/db/index.js';
import { ppt as pptTable } from '../src/db/schema.js';

const planPPTs = [
  {
    title: '2025年度工作计划模板',
    description:
      '全面的年度工作计划模板，包含目标设定、时间规划、资源分配等内容',
    tags: ['年度计划', '工作规划', '目标管理'],
    fileUrl: 'https://example.com/plan-annual-2025.pptx',
    thumbnailUrl: 'https://placehold.co/800x600/4F46E5/white?text=Annual+Plan',
  },
  {
    title: '季度工作计划PPT',
    description: '季度工作计划模板，适用于部门季度规划和目标分解',
    tags: ['季度计划', '部门规划', 'OKR'],
    fileUrl: 'https://example.com/plan-quarterly.pptx',
    thumbnailUrl:
      'https://placehold.co/800x600/7C3AED/white?text=Quarterly+Plan',
  },
  {
    title: '项目计划甘特图模板',
    description: '项目计划模板，包含甘特图、里程碑、资源分配等内容',
    tags: ['项目计划', '甘特图', '项目管理'],
    fileUrl: 'https://example.com/plan-project-gantt.pptx',
    thumbnailUrl: 'https://placehold.co/800x600/EC4899/white?text=Project+Plan',
  },
  {
    title: '个人职业发展计划',
    description: '个人职业发展规划模板，包含技能提升、目标设定、行动计划',
    tags: ['职业规划', '个人发展', '技能提升'],
    fileUrl: 'https://example.com/plan-career.pptx',
    thumbnailUrl: 'https://placehold.co/800x600/F59E0B/white?text=Career+Plan',
  },
  {
    title: '营销推广计划方案',
    description: '营销推广计划模板，包含市场分析、推广策略、预算分配',
    tags: ['营销计划', '推广方案', '市场策略'],
    fileUrl: 'https://example.com/plan-marketing.pptx',
    thumbnailUrl:
      'https://placehold.co/800x600/10B981/white?text=Marketing+Plan',
  },
];

async function seedPlanCategory() {
  const db = getDb();
  const now = new Date();

  for (const pptData of planPPTs) {
    await db.insert(pptTable).values({
      id: `ppt_${randomUUID()}`,
      title: pptData.title,
      description: pptData.description,
      category: 'plan',
      tags: pptData.tags,
      language: 'zh',
      fileUrl: pptData.fileUrl,
      thumbnailUrl: pptData.thumbnailUrl,
      coverImageUrl: pptData.thumbnailUrl,
      status: 'published',
      slidesCount: 20,
      downloadCount: Math.floor(Math.random() * 1000),
      viewCount: Math.floor(Math.random() * 5000),
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`✅ 已添加 ${planPPTs.length} 个工作计划分类的 PPT 模板`);
  process.exit(0);
}

seedPlanCategory().catch((err) => {
  console.error('❌ 种子数据添加失败:', err);
  process.exit(1);
});
