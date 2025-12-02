/**
 * 优化短标题 - 添加后缀使其达到 30+ 字符
 */
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const targetDir = '/Users/ameureka/Desktop/mksaas-ai-ppt-blog/content/blog/ppt';

// 分类对应的标题后缀
const suffixes: Record<string, string[]> = {
  marketing: ['｜营销方案实战', '｜营销PPT技巧', '｜方案设计要点'],
  business: ['｜商务汇报技巧', '｜职场PPT实战', '｜汇报设计要点'],
  'year-end': ['｜年终总结技巧', '｜总结PPT实战', '｜年度复盘要点'],
  education: ['｜教育培训技巧', '｜课件设计实战', '｜培训PPT要点'],
  report: ['｜述职报告技巧', '｜述职PPT实战', '｜报告设计要点'],
  proposal: ['｜项目提案技巧', '｜提案PPT实战', '｜方案设计要点'],
  general: ['｜PPT设计技巧', '｜模板选择实战', '｜演示设计要点'],
  'paid-search': ['｜模板选购指南', '｜付费模板技巧', '｜模板对比分析'],
};

function getCategory(filePath: string): string {
  const match = filePath.match(/content\/blog\/ppt\/([^/]+)\//);
  return match ? match[1] : 'general';
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log('📝 优化短标题');
  console.log('模式:', dryRun ? 'DRY RUN' : 'WRITE');

  let optimized = 0;
  const categories = fs.readdirSync(targetDir);

  for (const cat of categories) {
    const catDir = path.join(targetDir, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;

    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.zh.mdx'));
    for (const file of files) {
      const filePath = path.join(catDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);

      const title = data.title || '';
      if (title.length >= 30) continue;

      const category = getCategory(filePath);
      const catSuffixes = suffixes[category] || suffixes.general;
      
      // 选择一个后缀使标题达到 30+ 字符
      let newTitle = title;
      for (const suffix of catSuffixes) {
        if ((title + suffix).length >= 30) {
          newTitle = title + suffix;
          break;
        }
      }

      // 如果还不够长，用最长的后缀
      if (newTitle.length < 30) {
        newTitle = title + catSuffixes[0];
      }

      // 移除重复的标点
      newTitle = newTitle.replace(/[：:？?！!]｜/g, '｜');

      if (!dryRun) {
        data.title = newTitle;
        const output = matter.stringify(content, data);
        fs.writeFileSync(filePath, output);
        
        // 同步更新英文文件
        const enFile = file.replace('.zh.mdx', '.en.mdx');
        const enPath = path.join(catDir, enFile);
        if (fs.existsSync(enPath)) {
          const enRaw = fs.readFileSync(enPath, 'utf-8');
          const enParsed = matter(enRaw);
          // 英文标题保持不变，只更新中文
        }
      }
      
      console.log(`  ${title.length} → ${newTitle.length}: ${file}`);
      optimized++;
    }
  }

  console.log(`\n📊 结果: 优化 ${optimized} 个标题`);
}

main();
