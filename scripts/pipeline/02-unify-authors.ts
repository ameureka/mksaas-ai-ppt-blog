#!/usr/bin/env npx tsx
/**
 * 阶段 2.1: 创建新的官方作者配置
 * 品牌配置已内联，无需外部依赖
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';

// 品牌配置（内联）
const brandConfig = {
  name: 'PPTHub',
  author: {
    name: 'PPTHub 官方',
    avatar: '/images/avatars/official.png',
    bio: 'PPTHub 官方账号，为您提供最新的 PPT 模板和使用技巧。',
  },
};

// 确保目录存在
if (!existsSync('content/author')) {
  mkdirSync('content/author', { recursive: true });
}

// 创建英文版作者文件
const officialAuthorEn = `---
name: ${brandConfig.author.name}
avatar: ${brandConfig.author.avatar}
---

Official account of ${brandConfig.name}. We provide the latest PPT templates and tips.
`;

// 创建中文版作者文件
const officialAuthorZh = `---
name: ${brandConfig.author.name}
avatar: ${brandConfig.author.avatar}
---

${brandConfig.author.bio}
`;

writeFileSync('content/author/official.mdx', officialAuthorEn);
writeFileSync('content/author/official.zh.mdx', officialAuthorZh);

console.log('✅ 新作者配置已创建: content/author/official.mdx');
console.log('✅ 新作者配置已创建: content/author/official.zh.mdx');
