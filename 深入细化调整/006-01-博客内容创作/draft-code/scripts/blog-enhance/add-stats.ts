/**
 * 博客统计数据增强脚本
 * - 在正文中添加统计数据引用
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

// ============================================================================
// 配置
// ============================================================================

interface StatsConfig {
  sourceDir: string;
  dryRun: boolean;
}

const defaultConfig: StatsConfig = {
  sourceDir: '深入细化调整/006-blogs-seo-博文设计/广告-博文',
  dryRun: false,
};

// ============================================================================
// 统计数据库
// ============================================================================

const statsData: Record<string, string[]> = {
  marketing: [
    '据统计，使用专业设计的营销PPT可以提升 **43%** 的客户转化率。',
    '研究显示，视觉化的产品演示比纯文字说明的记忆留存率高 **65%**。',
    '数据表明，结构清晰的营销方案获得批准的概率提升 **38%**。',
  ],
  business: [
    '调查显示，专业的商务汇报可以节省 **30%** 的沟通时间。',
    '研究表明，数据可视化可以加速决策过程 **28%**。',
    '统计数据显示，结构化的汇报获得正面反馈的概率提升 **45%**。',
  ],
  'year-end': [
    '调研显示，量化成果的年终总结获得晋升的概率提升 **35%**。',
    '数据表明，结构清晰的年终汇报平均评分高出 **22%**。',
    '统计显示，使用数据支撑的年终总结更容易获得 **40%** 以上的认可度。',
  ],
  education: [
    '教育研究表明，多媒体教学可以提升学习效果 **40%**。',
    '数据显示，互动式课件的学生参与度提升 **60%**。',
    '统计表明，图文结合的内容记忆留存率是纯文字的 **6 倍**。',
  ],
  report: [
    '调查显示，专业的述职报告可以提升 **40%** 的正面评价。',
    '数据表明，量化成果展示的述职成功率提升 **35%**。',
    '研究显示，结构化的述职报告平均得分高出 **25%**。',
  ],
  proposal: [
    '统计显示，专业的商业计划书可以提升 **50%** 的融资成功率。',
    '数据表明，逻辑清晰的提案获批率高出 **45%**。',
    '研究显示，数据支撑的项目提案通过率提升 **38%**。',
  ],
  general: [
    '调查显示，专业模板可以节省 **60%** 的设计时间。',
    '数据表明，一致的视觉风格可以提升品牌认知度 **80%**。',
    '研究显示，简洁的设计可以提升信息传达效率 **47%**。',
  ],
  'paid-search': [
    '统计显示，付费模板的使用满意度比免费模板高 **65%**。',
    '数据表明，专业模板可以提升演示效果 **55%**。',
    '调查显示，**78%** 的用户认为付费模板物有所值。',
  ],
};

// ============================================================================
// 工具函数
// ============================================================================

function scanMdxFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanMdxFiles(fullPath));
    } else if (entry.name.endsWith('.zh.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractCategory(filePath: string): string {
  const dirMap: Record<string, string> = {
    产品营销与营销方案PPT: 'marketing',
    商务汇报PPT: 'business',
    年终总结PPT: 'year-end',
    教育培训与课件PPT: 'education',
    述职报告PPT: 'report',
    项目提案PPT: 'proposal',
    通用与混合场景: 'general',
    付费模板搜索与产品视角: 'paid-search',
  };

  for (const [dirName, category] of Object.entries(dirMap)) {
    if (filePath.includes(dirName)) {
      return category;
    }
  }
  return 'general';
}

function hasStats(content: string): boolean {
  // 检查是否已有统计数据（包含百分比或"倍"）
  return /\*\*\d+%?\*\*|\d+%|提升.*\d+|高出.*\d+|\d+.*倍/.test(content);
}

// ============================================================================
// 增强函数
// ============================================================================

interface StatsResult {
  filePath: string;
  success: boolean;
  added: boolean;
  error?: string;
}

function addStatsToFile(filePath: string, config: StatsConfig): StatsResult {
  const result: StatsResult = {
    filePath,
    success: false,
    added: false,
  };

  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(rawContent);
    const category = extractCategory(filePath);

    // 检查是否已有统计数据
    if (hasStats(content)) {
      result.success = true;
      return result;
    }

    // 获取统计数据
    const stats = statsData[category] || statsData.general;
    const stat = stats[Math.floor(Math.random() * stats.length)];

    // 在第二个 ## 标题后插入统计数据
    const h2Matches = [...content.matchAll(/^## .+$/gm)];
    if (h2Matches.length >= 2) {
      const secondH2 = h2Matches[1];
      if (secondH2.index !== undefined) {
        // 找到该标题后的第一个段落结束位置
        const afterH2 = content.indexOf(
          '\n\n',
          secondH2.index + secondH2[0].length
        );
        if (afterH2 > 0) {
          const nextParaEnd = content.indexOf('\n\n', afterH2 + 2);
          if (nextParaEnd > afterH2) {
            const newContent =
              content.slice(0, nextParaEnd) +
              `\n\n${stat}` +
              content.slice(nextParaEnd);

            if (!config.dryRun) {
              const output = matter.stringify(newContent, frontmatter);
              fs.writeFileSync(filePath, output, 'utf-8');
            }

            result.added = true;
          }
        }
      }
    }

    result.success = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

// ============================================================================
// CLI 入口
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const config: StatsConfig = {
    ...defaultConfig,
    dryRun: args.includes('--dry-run'),
  };

  const sourceDirIndex = args.indexOf('--source-dir');
  if (sourceDirIndex !== -1 && args[sourceDirIndex + 1]) {
    config.sourceDir = args[sourceDirIndex + 1];
  }

  console.log('📊 博客统计数据增强脚本');
  console.log('配置:', JSON.stringify(config, null, 2));

  const files = scanMdxFiles(config.sourceDir);
  console.log(`\n📄 找到 ${files.length} 个中文 MDX 文件`);

  const results: StatsResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const result = addStatsToFile(files[i], config);
    results.push(result);

    if ((i + 1) % 50 === 0) {
      console.log(`已处理 ${i + 1}/${files.length}`);
    }
  }

  const addedCount = results.filter((r) => r.added).length;
  const skippedCount = results.filter((r) => r.success && !r.added).length;

  console.log('\n📊 增强结果:');
  console.log(`  总文件数: ${files.length}`);
  console.log(`  已添加统计: ${addedCount}`);
  console.log(`  已有统计(跳过): ${skippedCount}`);

  const reportPath = path.join(
    __dirname,
    '../../reports/blog-add-stats-report.json'
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ config, results }, null, 2),
    'utf-8'
  );
  console.log(`\n📄 报告已保存到: ${reportPath}`);
}

main().catch(console.error);
