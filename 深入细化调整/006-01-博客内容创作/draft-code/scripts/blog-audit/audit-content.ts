/**
 * 审计 content/blog/ppt/ 目录
 */
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const targetDir = '/Users/ameureka/Desktop/mksaas-ai-ppt-blog/content/blog/ppt';

interface Stats {
  wordCount: number;
  h2Count: number;
  h3Count: number;
  titleLen: number;
  descLen: number;
  hasQuotes: boolean;
  hasStats: boolean;
  hasFAQ: boolean;
}

function analyze(content: string): Stats {
  const text = content.replace(/```[\s\S]*?```/g, '');
  return {
    wordCount: text.length,
    h2Count: (text.match(/^## /gm) || []).length,
    h3Count: (text.match(/^### /gm) || []).length,
    titleLen: 0,
    descLen: 0,
    hasQuotes: /📊|💡|研究表明|数据显示|调查显示/.test(text),
    hasStats: /\d+%|\d+倍/.test(text),
    hasFAQ: /## .*FAQ|## .*常见问题/.test(text),
  };
}

function main() {
  const issues: Record<string, number> = {};
  let total = 0;
  let ok = 0;

  const categories = fs.readdirSync(targetDir);
  for (const cat of categories) {
    const catDir = path.join(targetDir, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;

    const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.zh.mdx'));
    for (const file of files) {
      total++;
      const filePath = path.join(catDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      const stats = analyze(content);
      stats.titleLen = (data.title || '').length;
      stats.descLen = (data.description || '').length;

      const fileIssues: string[] = [];
      if (stats.titleLen < 30) fileIssues.push('short_title');
      if (stats.descLen < 80) fileIssues.push('short_desc');
      if (stats.wordCount < 1000) fileIssues.push('low_word_count');
      if (stats.h3Count < 3) fileIssues.push('few_h3');
      if (!stats.hasQuotes) fileIssues.push('no_quotes');
      if (!stats.hasStats) fileIssues.push('no_stats');
      if (!stats.hasFAQ) fileIssues.push('no_faq');

      if (fileIssues.length === 0) {
        ok++;
      } else {
        for (const issue of fileIssues) {
          issues[issue] = (issues[issue] || 0) + 1;
        }
      }
    }
  }

  console.log('\n📊 content/blog/ppt/ 审计结果:');
  console.log(`  总文件: ${total}`);
  console.log(`  ✅ 通过: ${ok}`);
  console.log(`  ⚠️  需优化: ${total - ok}`);
  console.log('\n📋 问题统计:');
  for (const [k, v] of Object.entries(issues).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }
}

main();
