import { BrowserManager } from './BrowserManager';
import { DownloadLinks } from './types';
import { normalizeUrl } from './utils';

export async function resolveDownloadLinks(aid: string, detailUrl: string): Promise<DownloadLinks> {
  return BrowserManager.getInstance().withPage<DownloadLinks>(async (page) => {
    // 1. Visit download page with Referer to avoid 302 redirect back to detail page
    const downloadPageUrl = `https://www.1ppt.com/plus/download.php?open=0&aid=${aid}&cid=3`;
    
    // Set Referer via extraHTTPHeaders or just standard navigation if previous page was detail
    // But since we might call this independently, we force headers.
    await page.setExtraHTTPHeaders({
      'Referer': detailUrl
    });

    await page.goto(downloadPageUrl, { waitUntil: 'domcontentloaded' });

    // 2. Extract Local Link
    // Typically in .downloadlist li a
    const localHref = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('.downloadlist li a'));
      // Usually the first one or one labeled "本地下载"
      // Let's pick the first valid link that looks like a file download
      const target = anchors.find(a => {
        const h = a.getAttribute('href');
        return h && (h.includes('uploads') || h.endsWith('.zip') || h.endsWith('.rar'));
      });
      return target?.getAttribute('href') || null;
    });

    // 3. Extract Quark Link
    // It might be loaded via AJAX on the page, or we can fetch kuakeajax.php directly.
    // The spec suggests calling /plus/kuakeajax.php?open=0&aid={aid}&cid=3
    // But since we are already in the browser context, we can just fetch it here or check if it's on page.
    // The spec says: "调用 /plus/kuakeajax.php?... 解析夸克分享 URL"
    
    // Let's try fetching the ajax URL directly within the page context to share cookies/headers
    const quarkUrl = await page.evaluate(async (aid) => {
      try {
        const response = await fetch(`/plus/kuakeajax.php?open=0&aid=${aid}&cid=3`);
        const text = await response.text();
        // The response is usually HTML or text containing the link, e.g. <a href="...">...</a>
        // Need to parse it.
        const div = document.createElement('div');
        div.innerHTML = text;
        const a = div.querySelector('a');
        return a ? a.href : null;
      } catch (e) {
        return null;
      }
    }, aid);

    // If quark link is not found via ajax, maybe check .downloadlist again (sometimes it's there)
    
    const baseUrl = 'https://www.1ppt.com';
    
    return {
      local: localHref ? normalizeUrl(baseUrl, localHref) : undefined,
      quark: quarkUrl ? normalizeUrl(baseUrl, quarkUrl) : undefined
    };
  });
}
