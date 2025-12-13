import { fetchTemplateCards } from './paginator';
import { fetchTemplateDetail } from './fetcher';
import { resolveDownloadLinks } from './DownloadResolver';
import { downloadFile, downloadAsset } from './Downloader';
import { TaskRepository, Task } from '../database/repositories/TaskRepository';
import { getChannelById } from '../config/channels';
import { BrowserManager } from './BrowserManager';
import { getConfig } from '../config';
import { join } from 'path';

export class CrawlerService {
  private isRunning = false;

  constructor() {}

  public async initialize() {
    await BrowserManager.getInstance().init();
  }

  public async shutdown() {
    await BrowserManager.getInstance().close();
  }

  /**
   * Scrapes pages and adds template detail tasks to the database.
   */
  public async crawlChannel(channelId: string, startPage: number, endPage: number) {
    const channel = getChannelById(channelId);
    if (!channel) throw new Error(`Channel ${channelId} not found`);

    console.log(`Starting crawl for channel ${channel.name} pages ${startPage}-${endPage}`);

    for (let page = startPage; page <= endPage; page++) {
      try {
        console.log(`Fetching page ${page}...`);
        const cards = await fetchTemplateCards(channelId, page);
        console.log(`Found ${cards.length} cards on page ${page}`);

        for (const card of cards) {
          TaskRepository.createOrUpdate({
            url: card.detailUrl,
            type: 'detail',
            status: 'PENDING',
            meta: JSON.stringify({
              title: card.title,
              channelId: card.channelId,
              coverUrl: card.coverUrl
            }) // Initial meta
          });
        }
      } catch (error) {
        console.error(`Failed to crawl page ${page}:`, error);
        // Continue to next page
      }
    }
  }

  /**
   * Processes pending tasks from the database.
   */
  public async processPendingTasks(limit: number = 10) {
    const tasks = TaskRepository.findPendingTasks(limit);
    if (tasks.length === 0) return;

    console.log(`Processing ${tasks.length} pending tasks...`);

    // In a real system, we might use a pool. For simplicity, we process sequentially or with limited concurrency.
    const config = getConfig();
    const concurrency = config.MAX_CONCURRENCY || 1;

    // Chunk tasks
    for (let i = 0; i < tasks.length; i += concurrency) {
      const chunk = tasks.slice(i, i + concurrency);
      await Promise.all(chunk.map(task => this.processSingleTask(task)));
    }
  }

  private async processSingleTask(task: Task) {
    try {
      TaskRepository.markAsProcessing(task.id);
      
      // 1. Fetch Detail
      const detail = await fetchTemplateDetail(task.url);
      
      // Update meta with more info
      const currentMeta = task.meta ? JSON.parse(task.meta) : {};
      const newMeta = { ...currentMeta, ...detail };
      
      // 2. Resolve Download Links
      // The detail.downloadLink is the page URL for download.php, or sometimes directly the file?
      // In fetcher.ts: downloadLink is usually /plus/download.php...
      // But let's verify if fetchTemplateDetail returns the *detail* url or *download* url.
      // fetcher.ts returns { downloadLink: ... } which is scraped from .downurllist a.
      
      // We need aid. fetchTemplateDetail returns aid.
      if (!detail.aid) {
        throw new Error("Failed to extract AID from detail page");
      }

      const links = await resolveDownloadLinks(detail.aid, task.url);
      newMeta.downloadLinks = links;

      if (!links.local) {
        // Fallback or error?
        // If quark exists, maybe we just mark it as QUARK_ONLY?
        if (links.quark) {
             console.log(`Task ${task.id} has only Quark link: ${links.quark}`);
             // We treat it as completed but not downloaded locally
             newMeta.downloadStatus = 'QUARK_ONLY';
             TaskRepository.markAsCompleted(task.id, newMeta);
             return;
        }
        throw new Error("No download links found");
      }

      // 3. Download File
      const extension = links.local.split('.').pop() || 'zip';
      // Sanitize filename
      const safeTitle = detail.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const filename = `${detail.aid}-${safeTitle}.${extension}`;
      const channelId = currentMeta.channelId || 'misc';

      const filePath = await downloadFile(links.local, channelId, filename);
      
      newMeta.filePath = filePath;
      newMeta.downloadStatus = 'DOWNLOADED';

      // 4. Download Cover Image (if exists)
      if (currentMeta.coverUrl) {
          try {
              const coverUrl = currentMeta.coverUrl as string;
              // Guess extension
              const coverExt = coverUrl.split('.').pop() || 'jpg';
              // Use same base name: {aid}-cover.{ext}
              const coverFilename = `${detail.aid}-cover.${coverExt}`;
              
              const coverPath = await downloadAsset(coverUrl, channelId, 'images', coverFilename);
              newMeta.coverPath = coverPath;
              console.log(`Cover image saved to ${coverPath}`);
          } catch (imgError) {
              console.warn(`Failed to download cover for task ${task.id}:`, imgError);
              // Non-fatal, just log
          }
      }

      TaskRepository.markAsCompleted(task.id, newMeta);
      console.log(`Task ${task.id} completed. Saved to ${filePath}`);

    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
      const msg = error instanceof Error ? error.message : String(error);
      TaskRepository.markAsFailed(task.id, msg);
      // Optional: Logic to increment retry count and reset to PENDING if < MAX
    }
  }
}
