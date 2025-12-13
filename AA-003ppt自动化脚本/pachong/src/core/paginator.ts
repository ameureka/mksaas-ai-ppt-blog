import { BrowserManager } from './BrowserManager';
import { getChannelById, ChannelConfig } from '../config/channels';
import { TemplateCard } from './types';
import { normalizeUrl } from './utils';

function buildPageUrl(channel: ChannelConfig, page: number): string {
  if (page <= 1) {
    return channel.baseUrl;
  }
  // If pagePattern contains full URL logic, we use it, otherwise join.
  // Original logic: suffix replace, then new URL(suffix, baseUrl)
  const suffix = channel.pagePattern.replace('{page}', page.toString());
  try {
      return new URL(suffix, channel.baseUrl).toString();
  } catch {
      return channel.baseUrl + suffix; // fallback
  }
}

export async function fetchTemplateCards(channelId: string, pageNumber: number): Promise<TemplateCard[]> {
  const channel = getChannelById(channelId);
  if (!channel) {
    throw new Error(`Unknown channel: ${channelId}`);
  }
  const targetUrl = buildPageUrl(channel, pageNumber);

  return BrowserManager.getInstance().withPage(async (page) => {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    // Some pages might not have .tplist or use different selectors. 
    // Spec says "All channels use ul.tplist > li", except maybe Kejian which is different?
    // Spec says "Kejian... DOM still use ul.tplist". So we are good.
    await page.waitForSelector('.tplist li', { timeout: 10000 }).catch(() => []); 

    const cards = await page.$$eval('.tplist li', (items) => {
      return items.map((li) => {
        const detailAnchor = li.querySelector<HTMLAnchorElement>('a[href*="/article/"]');
        const titleAnchor = li.querySelector<HTMLAnchorElement>('h2 a');
        const categoryAnchor = li.querySelector<HTMLAnchorElement>('span a');
        const img = li.querySelector<HTMLImageElement>('img');
        return {
          detailUrl: detailAnchor?.getAttribute('href') ?? '',
          title: titleAnchor?.textContent?.trim() ?? detailAnchor?.textContent?.trim() ?? '',
          category: categoryAnchor?.textContent?.trim(),
          coverUrl: img?.getAttribute('src') ?? undefined,
        };
      });
    });

    return cards
      .filter((card) => card.detailUrl)
      .map((card): TemplateCard => ({
        channelId: channel.id,
        page: pageNumber,
        title: card.title,
        category: card.category,
        coverUrl: card.coverUrl ? normalizeUrl(channel.baseUrl, card.coverUrl) : undefined,
        detailUrl: normalizeUrl(channel.baseUrl, card.detailUrl),
      }));
  });
}
