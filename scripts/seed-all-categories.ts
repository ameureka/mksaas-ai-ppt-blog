import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';

loadEnvConfig(process.cwd());

import { getDb } from '../src/db/index.js';
import { ppt as pptTable } from '../src/db/schema.js';

const categoryData: Record<
  string,
  Array<{ title: string; description: string; tags: string[] }>
> = {
  business: [
    {
      title: '商务汇报专业模板',
      description: '适用于企业内部汇报和客户提案',
      tags: ['商务', '汇报', '专业'],
    },
    {
      title: '季度业绩分析报告',
      description: '季度业绩数据分析和总结',
      tags: ['业绩', '分析', '报告'],
    },
  ],
  education: [
    {
      title: '教学课件精美模板',
      description: '适用于课堂教学和培训讲座',
      tags: ['教育', '课件', '培训'],
    },
    {
      title: '学术论文答辩PPT',
      description: '学术研究成果展示模板',
      tags: ['学术', '答辩', '研究'],
    },
  ],
  technology: [
    {
      title: '科技产品发布会',
      description: '科技产品发布和技术方案展示',
      tags: ['科技', '产品', '发布'],
    },
    {
      title: '技术架构设计方案',
      description: '系统架构和技术选型展示',
      tags: ['技术', '架构', '方案'],
    },
  ],
  design: [
    {
      title: '创意设计作品集',
      description: '设计作品展示和创意提案',
      tags: ['设计', '创意', '作品集'],
    },
    {
      title: '品牌视觉设计方案',
      description: '品牌VI设计和视觉规范',
      tags: ['品牌', '视觉', '设计'],
    },
  ],
  marketing: [
    {
      title: '营销策划方案模板',
      description: '市场营销活动策划和执行方案',
      tags: ['营销', '策划', '推广'],
    },
    {
      title: '新媒体运营方案',
      description: '社交媒体和内容营销策略',
      tags: ['新媒体', '运营', '内容'],
    },
  ],
  hr: [
    {
      title: '人力资源管理方案',
      description: '人事管理和团队建设方案',
      tags: ['人力', '管理', '团队'],
    },
    {
      title: '员工培训计划PPT',
      description: '员工培训和发展计划',
      tags: ['培训', '发展', '员工'],
    },
  ],
  medical: [
    {
      title: '医疗健康科普讲座',
      description: '健康知识科普和医疗宣传',
      tags: ['医疗', '健康', '科普'],
    },
    {
      title: '临床病例分析报告',
      description: '医学病例研究和分析',
      tags: ['临床', '病例', '分析'],
    },
  ],
  finance: [
    {
      title: '财务分析报告模板',
      description: '企业财务数据分析和预测',
      tags: ['财务', '分析', '报告'],
    },
    {
      title: '投资项目评估方案',
      description: '投资决策和风险评估',
      tags: ['投资', '评估', '风险'],
    },
  ],
  general: [
    {
      title: '通用商务模板',
      description: '适用于各类商务场景的通用模板',
      tags: ['通用', '商务', '简约'],
    },
    {
      title: '简约风格PPT模板',
      description: '简洁大方的通用演示模板',
      tags: ['简约', '通用', '商务'],
    },
  ],
  report: [
    {
      title: '述职报告专业模板',
      description: '个人述职和工作汇报',
      tags: ['述职', '汇报', '总结'],
    },
    {
      title: '年度述职答辩PPT',
      description: '年度考核述职答辩',
      tags: ['述职', '答辩', '考核'],
    },
  ],
};

async function seedAllCategories() {
  const db = getDb();
  const now = new Date();
  let total = 0;

  for (const [category, templates] of Object.entries(categoryData)) {
    for (const template of templates) {
      await db.insert(pptTable).values({
        id: `ppt_${randomUUID()}`,
        title: template.title,
        description: template.description,
        category,
        tags: template.tags,
        language: 'zh',
        fileUrl: `https://example.com/${category}-${Date.now()}.pptx`,
        thumbnailUrl: `https://placehold.co/800x600/4F46E5/white?text=${encodeURIComponent(template.title.slice(0, 10))}`,
        coverImageUrl: `https://placehold.co/800x600/4F46E5/white?text=${encodeURIComponent(template.title.slice(0, 10))}`,
        status: 'published',
        slidesCount: Math.floor(Math.random() * 20) + 15,
        downloadCount: Math.floor(Math.random() * 1500) + 100,
        viewCount: Math.floor(Math.random() * 6000) + 500,
        createdAt: now,
        updatedAt: now,
      });
      total++;
    }
  }

  console.log(
    `✅ 已为 ${Object.keys(categoryData).length} 个分类添加 ${total} 个 PPT 模板`
  );
  process.exit(0);
}

seedAllCategories().catch((err) => {
  console.error('❌ 种子数据添加失败:', err);
  process.exit(1);
});
