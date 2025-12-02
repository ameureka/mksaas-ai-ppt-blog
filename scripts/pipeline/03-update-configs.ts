// scripts/pipeline/03-update-configs.ts
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const REPLACEMENTS = {
  MkSaaS: 'PPTHub',
  'mksaas.me': 'ppthub.shop',
  'Indie Maker Fox': 'PPTHub Team',
  Fox: 'PPTHub Team',
};

const FILES_TO_UPDATE = [
  'src/config/website.tsx',
  'package.json',
  'messages/en.json',
  'messages/zh.json',
  'README.md',
];

function updateFile(filePath: string) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let updated = false;

    // Special handling for package.json to avoid breaking structure if simple replace is risky
    // But for name/description simple replace is usually fine if keys match
    // For package.json name, we want lowercase
    if (filePath === 'package.json') {
      const pkg = JSON.parse(content);
      if (pkg.name !== 'ppthub') {
        pkg.name = 'ppthub';
        pkg.description = 'AI-Powered PPT Template Platform';
        content = JSON.stringify(pkg, null, 2);
        updated = true;
      }
    } else {
      for (const [oldVal, newVal] of Object.entries(REPLACEMENTS)) {
        // Global replace
        const regex = new RegExp(
          oldVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'g'
        );
        if (regex.test(content)) {
          content = content.replace(regex, newVal);
          updated = true;
        }
      }
    }

    if (updated) {
      writeFileSync(filePath, content);
      console.log(`  ✅ Updated ${filePath}`);
    } else {
      console.log(`  ℹ️  No changes needed for ${filePath}`);
    }
  } catch (e) {
    console.error(`  ❌ Error updating ${filePath}:`, e);
  }
}

console.log('⚙️ Stage 3: Updating Configurations...');
FILES_TO_UPDATE.forEach(updateFile);
console.log('✅ Configuration update complete.');
