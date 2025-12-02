/**
 * 博客元数据优化脚本
 * - 优化描述长度（目标 80-160 字符）
 * - 优化标题长度（目标 15-60 字符）
 * - 添加统计数据引用
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

// ============================================================================
// 配置
// ============================================================================

interface OptimizeConfig {
  sourceDir: string;
  dryRun: boolean;
  minDescLength: number;
  minTitleLength: number;
}

const defaultConfig: OptimizeConfig = {
  sourceDir: '深入细化调整/006-blogs-seo-博文设计/广告-博文',
  dryRun: false,
  minDescLength: 70,
  minTitleLength: 25,
};

// ============================================================================
// 分类描述模板
// ============================================================================

const descTemplates: Record<string, string[]> = {
  marketing: [
    '本文详解产品营销PPT的核心要素，从用户洞察到转化路径，帮助你打造高转化率的营销演示。',
    '深入解析营销方案PPT的结构设计，涵盖市场分析、策略规划、执行方案等关键模块。',
    '分享产品营销PPT的实战技巧，教你如何用数据和故事打动客户，提升成交率。',
  ],
  business: [
    '本文系统讲解商务汇报PPT的结构设计，从数据展示到结论建议，助你高效传达核心信息。',
    '深入分析商务汇报的最佳实践，涵盖时间控制、内容组织、视觉呈现等关键要素。',
    '分享商务汇报PPT的专业技巧，帮助你在有限时间内清晰传达复杂业务信息。',
  ],
  'year-end': [
    '本文详解年终总结PPT的写作框架，从成果量化到未来规划，助你展现一年的工作价值。',
    '深入解析年终总结的结构设计，教你如何用数据说话，让领导看到你的贡献和成长。',
    '分享年终总结PPT的实战经验，涵盖业绩展示、问题复盘、计划制定等核心模块。',
  ],
  education: [
    '本文系统讲解教育培训PPT的设计要点，从知识传递到互动设计，提升学习效果。',
    '深入分析培训课件的最佳实践，涵盖内容组织、视觉引导、互动环节等关键要素。',
    '分享教育培训PPT的专业技巧，帮助你打造既专业又有趣的课程演示。',
  ],
  report: [
    '本文详解述职报告PPT的核心要素，从业绩展示到能力证明，助你赢得认可和晋升。',
    '深入解析述职报告的结构设计，教你如何量化成果、展示价值、规划未来。',
    '分享述职报告PPT的实战技巧，涵盖数据呈现、亮点提炼、问题应对等关键环节。',
  ],
  proposal: [
    '本文系统讲解项目提案PPT的结构设计，从问题定义到方案论证，提升提案通过率。',
    '深入分析项目提案的最佳实践，涵盖背景分析、方案设计、风险评估等核心模块。',
    '分享项目提案PPT的专业技巧，帮助你用逻辑和数据说服决策层。',
  ],
  general: [
    '本文详解PPT模板选择和使用的核心技巧，帮助你快速找到合适的模板并高效修改。',
    '深入解析PPT设计的通用原则，涵盖结构规划、视觉设计、内容组织等关键要素。',
    '分享PPT制作的实战经验，从模板选择到内容填充，助你提升演示效果。',
  ],
  'paid-search': [
    '本文系统讲解如何选择和使用付费PPT模板，帮助你在关键场合展现专业形象。',
    '深入分析付费模板的价值和使用场景，教你如何用最小投入获得最大效果。',
    '分享付费PPT模板的选购技巧，涵盖风格匹配、功能需求、性价比评估等要点。',
  ],
};

// ============================================================================
// 标题优化后缀
// ============================================================================

const titleSuffixes: Record<string, string[]> = {
  marketing: ['完整指南', '实战技巧', '专业方法'],
  business: ['高效方法', '专业指南', '实用技巧'],
  'year-end': ['写作指南', '实战经验', '完整框架'],
  education: ['设计要点', '专业方法', '实用技巧'],
  report: ['写作技巧', '专业指南', '实战方法'],
  proposal: ['结构设计', '专业技巧', '实战指南'],
  general: ['实用指南', '专业技巧', '完整方法'],
  'paid-search': ['选购指南', '使用技巧', '价值分析'],
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

function extractFirstParagraph(content: string): string {
  // 跳过引用块，找第一个普通段落
  const lines = content.split('\n');
  let inQuote = false;
  let paragraph = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      inQuote = true;
      continue;
    }
    if (inQuote && trimmed === '') {
      inQuote = false;
      continue;
    }
    if (
      !inQuote &&
      trimmed &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('-') &&
      !trimmed.startsWith('```')
    ) {
      paragraph = trimmed;
      break;
    }
  }

  return paragraph.slice(0, 200);
}

// ============================================================================
// 优化函数
// ============================================================================

interface OptimizeResult {
  filePath: string;
  success: boolean;
  optimizations: string[];
  error?: string;
}

function optimizeFile(
  filePath: string,
  config: OptimizeConfig
): OptimizeResult {
  const result: OptimizeResult = {
    filePath,
    success: false,
    optimizations: [],
  };

  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(rawContent);
    const category = extractCategory(filePath);

    let modified = false;

    // 1. 优化描述
    const currentDesc = String(frontmatter.description || '');
    if (currentDesc.length < config.minDescLength) {
      // 尝试从内容提取或使用模板
      const firstPara = extractFirstParagraph(content);
      const templates = descTemplates[category] || descTemplates.general;

      let newDesc = '';
      if (firstPara.length >= 50) {
        // 使用内容首段
        newDesc =
          firstPara.length > 150 ? firstPara.slice(0, 147) + '...' : firstPara;
      } else {
        // 使用模板
        newDesc = templates[Math.floor(Math.random() * templates.length)];
      }

      // 如果原描述有内容，尝试扩展
      if (currentDesc.length > 20) {
        newDesc = currentDesc + ' ' + newDesc.slice(0, 100);
        if (newDesc.length > 160) {
          newDesc = newDesc.slice(0, 157) + '...';
        }
      }

      frontmatter.description = newDesc;
      result.optimizations.push(
        `desc: ${currentDesc.length} → ${newDesc.length}`
      );
      modified = true;
    }

    // 2. 优化标题
    const currentTitle = String(frontmatter.title || '');
    if (
      currentTitle.length < config.minTitleLength &&
      currentTitle.length > 0
    ) {
      const suffixes = titleSuffixes[category] || titleSuffixes.general;
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

      // 检查标题是否已有问号或感叹号
      const hasEndPunct = /[？?！!。]$/.test(currentTitle);
      const newTitle = hasEndPunct
        ? currentTitle.replace(/[？?！!。]$/, '') + '：' + suffix
        : currentTitle + '：' + suffix;

      frontmatter.title = newTitle;
      result.optimizations.push(
        `title: ${currentTitle.length} → ${newTitle.length}`
      );
      modified = true;
    }

    // 写入文件
    if (!config.dryRun && modified) {
      const output = matter.stringify(content, frontmatter);
      fs.writeFileSync(filePath, output, 'utf-8');
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

  const config: OptimizeConfig = {
    ...defaultConfig,
    dryRun: args.includes('--dry-run'),
  };

  const sourceDirIndex = args.indexOf('--source-dir');
  if (sourceDirIndex !== -1 && args[sourceDirIndex + 1]) {
    config.sourceDir = args[sourceDirIndex + 1];
  }

  console.log('🔧 博客元数据优化脚本');
  console.log('配置:', JSON.stringify(config, null, 2));

  const files = scanMdxFiles(config.sourceDir);
  console.log(`\n📄 找到 ${files.length} 个中文 MDX 文件`);

  const results: OptimizeResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const result = optimizeFile(files[i], config);
    results.push(result);

    if ((i + 1) % 50 === 0) {
      console.log(`已处理 ${i + 1}/${files.length}`);
    }
  }

  const optimizedCount = results.filter(
    (r) => r.optimizations.length > 0
  ).length;
  const descOptimized = results.filter((r) =>
    r.optimizations.some((o) => o.startsWith('desc:'))
  ).length;
  const titleOptimized = results.filter((r) =>
    r.optimizations.some((o) => o.startsWith('title:'))
  ).length;

  console.log('\n📊 优化结果:');
  console.log(`  总文件数: ${files.length}`);
  console.log(`  已优化: ${optimizedCount}`);
  console.log(`  描述优化: ${descOptimized}`);
  console.log(`  标题优化: ${titleOptimized}`);

  const reportPath = path.join(
    __dirname,
    '../../reports/blog-optimize-meta-report.json'
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
