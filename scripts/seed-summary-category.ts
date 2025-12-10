import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';

loadEnvConfig(process.cwd());

import { getDb } from '../src/db/index.js';
import { ppt as pptTable } from '../src/db/schema.js';

const summaryPPTs = [
  {
    title: '2024年度工作总结汇报',
    description: '全面的年度工作总结模板，包含成果展示、数据分析、经验总结',
    tags: ['年终总结', '工作汇报', '成果展示'],
    fileUrl: 'https://example.com/summary-annual-2024.pptx',
    thumbnailUrl:
      'https://placehold.co/800x600/DC2626/white?text=Annual+Summary',
  },
  {
    title: '个人年终述职报告',
    description: '个人年终述职模板，适用于员工年度考核和晋升答辩',
    tags: ['述职报告', '个人总结', '绩效考核'],
    fileUrl: 'https://example.com/summary-personal.pptx',
    thumbnailUrl:
      'https://placehold.co/800x600/EA580C/white?text=Personal+Summary',
  },
  {
    title: '部门年度总结PPT',
    description: '部门年度总结模板，包含团队成绩、项目回顾、未来规划',
    tags: ['部门总结', '团队汇报', '年度回顾'],
    fileUrl: 'https://example.com/summary-department.pptx',
    thumbnailUrl:
      'https://placehold.co/800x600/D97706/white?text=Department+Summary',
  },
  {
    title: '项目总结汇报模板',
    description: '项目总结模板，包含项目成果、经验教训、改进建议',
    tags: ['项目总结', '复盘汇报', '经验分享'],
    fileUrl: 'https://example.com/summary-project.pptx',
    thumbnailUrl:
      'https://placehold.co/800x600/CA8A04/white?text=Project+Summary',
  },
  {
    title: '销售业绩年终总结',
    description: '销售业绩总结模板，包含业绩数据、客户分析、市场洞察',
    tags: ['销售总结', '业绩汇报', '数据分析'],
    fileUrl: 'https://example.com/summary-sales.pptx',
    thumbnailUrl:
      'https://placehold.co/800x600/65A30D/white?text=Sales+Summary',
  },
  {
    title: '企业年度总结大会',
    description: '企业年会总结模板，适用于公司年度大会和表彰活动',
    tags: ['年会总结', '企业汇报', '表彰大会'],
    fileUrl: 'https://example.com/summary-company.pptx',
    thumbnailUrl:
      'https://placehold.co/800x600/16A34A/white?text=Company+Summary',
  },
];

async function seedSummaryCategory() {
  const db = getDb();
  const now = new Date();

  for (const pptData of summaryPPTs) {
    await db.insert(pptTable).values({
      id: `ppt_${randomUUID()}`,
      title: pptData.title,
      description: pptData.description,
      category: 'summary',
      tags: pptData.tags,
      language: 'zh',
      fileUrl: pptData.fileUrl,
      thumbnailUrl: pptData.thumbnailUrl,
      coverImageUrl: pptData.thumbnailUrl,
      status: 'published',
      slidesCount: 25,
      downloadCount: Math.floor(Math.random() * 2000) + 500,
      viewCount: Math.floor(Math.random() * 8000) + 1000,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`✅ 已添加 ${summaryPPTs.length} 个年终总结分类的 PPT 模板`);
  process.exit(0);
}

seedSummaryCategory().catch((err) => {
  console.error('❌ 种子数据添加失败:', err);
  process.exit(1);
});
