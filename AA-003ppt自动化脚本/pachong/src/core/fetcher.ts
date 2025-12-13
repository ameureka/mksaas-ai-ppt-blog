import { BrowserManager } from './BrowserManager';
import { TemplateDetail } from './types';
import { normalizeUrl, parseNumber } from './utils';

interface RawDetailData {
  title: string;
  metaItems: string[];
  downloadLink: string;
  tags: string[];
  url: string;
}

function extractField(metaItems: string[], label: string): string | undefined {
  const entry = metaItems.find((item) => item.startsWith(label));
  if (!entry) return undefined;
  return entry.replace(label, '').trim();
}

export async function fetchTemplateDetail(detailUrl: string): Promise<TemplateDetail> {
  const raw = await BrowserManager.getInstance().withPage<RawDetailData>(async (page) => {
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.ppt_info');

    return page.evaluate(() => {
      const title = document.querySelector('.ppt_info h1')?.textContent?.trim() ?? '';
      const metaItems = Array.from(document.querySelectorAll('.ppt_info .info_left li')).map((li) =>
        li.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      );
      const downloadLink = document.querySelector<HTMLAnchorElement>('.downurllist a')?.getAttribute('href') ?? '';
      const tags = Array.from(document.querySelectorAll('.ppt_info .info_left li a[target="_blank"]')).map(
        (a) => a.textContent?.trim() ?? '',
      );
      return {
        title,
        metaItems,
        downloadLink,
        tags,
        url: window.location.href,
      };
    });
  });

  const fileSizeRaw = extractField(raw.metaItems, '文件大小：');
  const ratio = extractField(raw.metaItems, '显示比例：');
  const attachmentType = extractField(raw.metaItems, '附件类型：');
  const updatedAt = extractField(raw.metaItems, '更新时间：');
  const channelName = extractField(raw.metaItems, '所属频道：');
  const downloadLink = normalizeUrl(raw.url, raw.downloadLink);
  const aid = raw.url.match(/\/article\/(\d+)\.html/)?.[1] ?? '';

  return {
    aid,
    title: raw.title,
    channelName,
    updatedAt,
    fileSizeKB: fileSizeRaw ? parseNumber(fileSizeRaw.replace(/\s*KB/i, '')) : undefined,
    attachmentType,
    ratio,
    tags: raw.tags.filter(Boolean),
    downloadLink,
    detailUrl,
  };
}
