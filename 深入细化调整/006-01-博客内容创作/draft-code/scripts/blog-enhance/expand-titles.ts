/**
 * 标题扩展脚本 - 为过短标题添加副标题
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const sourceDir = '深入细化调整/006-blogs-seo-博文设计/广告-博文';
const minTitleLength = 25;

// 标题扩展模板
const titleSuffixes: Record<string, string[]> = {
  marketing: ['实战指南', '完整攻略', '专业技巧', '核心要点', '避坑指南'],
  business: ['高效方法', '实用技巧', '专业指南', '核心策略', '最佳实践'],
  'year-end': ['写作框架', '实战经验', '完整指南', '核心要点', '专业建议'],
  education: ['设计方法', '实用技巧', '完整指南', '核心要素', '最佳实践'],
  report: ['写作指南', '实战技巧', '完整攻略', '核心要点', '专业方法'],
  proposal: ['撰写指南', '实战技巧', '完整攻略', '核心要点', '专业建议'],
  general: ['实用指南', '完整攻略', '专业技巧', '核心要点', '最佳实践'],
};

function expandTitle(title: string, category: string): string {
  const suffixes = titleSuffixes[category] || titleSuffixes.general;
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  // 如果标题已有问号，在问号前插入
  if (title.includes('？')) {
    return title.replace('？', `：${suffix}？`);
  }
  
  // 否则直接追加
  return `${title}：${suffix}`;
}

function processFile(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);
  
  const title = data.title || '';
  const category = data.categories?.[0] || 'general';
  
  // 计算中文字符数
  const chineseChars = (title.match(/[\u4e00-\u9fa5]/g) || []).length;
  
  if (chineseChars >= minTitleLength) {
    return false;
  }
  
  const newTitle = expandTitle(title, category);
  data.title = newTitle;
  
  const newContent = matter.stringify(body, data);
  fs.writeFileSync(filePath, newContent, 'utf-8');
  
  console.log(`✅ ${path.basename(filePath)}: ${chineseChars} → ${(newTitle.match(/[\u4e00-\u9fa5]/g) || []).length} 字符`);
  return true;
}

function main() {
  console.log('📝 标题扩展脚本');
  console.log(`最小长度: ${minTitleLength} 中文字符\n`);
  
  const files = fs.readdirSync(sourceDir, { recursive: true, withFileTypes: true })
    .filter(f => f.isFile() && f.name.endsWith('.zh.mdx'))
    .map(f => path.join(f.path || f.parentPath, f.name));
  
  let count = 0;
  for (const file of files) {
    if (processFile(file)) {
      count++;
    }
  }
  
  console.log(`\n📊 扩展了 ${count} 个标题`);
}

main();
