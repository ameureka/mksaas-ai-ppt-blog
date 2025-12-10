/**
 * 添加置顶热门关键词
 * 运行: npx tsx scripts/add-pinned-keywords.ts
 */
import { getDb } from '@/db';
import { pinnedKeywords } from '@/db/schema';
import { nanoid } from 'nanoid';

const PINNED_KEYWORDS = [
  '年终总结',
  '工作汇报',
  '项目提案',
  '述职报告',
  '商业计划',
  '培训课件',
  '产品介绍',
  '营销方案',
];

async function main() {
  console.log('🔧 添加置顶热词...\n');

  const db = await getDb();

  // 清空现有置顶热词
  await db.delete(pinnedKeywords);
  console.log('✅ 已清空旧的置顶热词');

  // 插入新的置顶热词
  for (let i = 0; i < PINNED_KEYWORDS.length; i++) {
    await db.insert(pinnedKeywords).values({
      id: nanoid(),
      keyword: PINNED_KEYWORDS[i],
      rank: i + 1,
    });
    console.log(`✅ 添加: ${PINNED_KEYWORDS[i]} (排名: ${i + 1})`);
  }

  console.log('\n🎉 置顶热词添加完成！');
  console.log('线上和本地现在应该显示相同的热词了。');

  process.exit(0);
}

main().catch(console.error);
