import { CrawlerService } from './core/CrawlerService';
import { resetConfig } from './config';

async function main() {
  const args = process.argv.slice(2);
  const channelArg = args.find(a => a.startsWith('--channel='));
  const startArg = args.find(a => a.startsWith('--start='));
  const endArg = args.find(a => a.startsWith('--end='));

  const channelId = channelArg ? channelArg.split('=')[1] : 'ppt_moban'; // default
  const startPage = startArg ? parseInt(startArg.split('=')[1] || '1', 10) : 1;
  const endPage = endArg ? parseInt(endArg.split('=')[1] || '1', 10) : 1;

  if (!channelId) {
    console.error("Usage: npm run crawl -- --channel=<id> --start=<n> --end=<m>");
    process.exit(1);
  }

  const crawler = new CrawlerService();

  try {
    await crawler.initialize();
    
    console.log(`Crawling channel=${channelId} pages ${startPage} to ${endPage}`);
    await crawler.crawlChannel(channelId, startPage, endPage);
    
    console.log("Processing pending tasks...");
    // Loop until no pending tasks or just one pass?
    // For CLI, maybe one pass or a few.
    // Let's do a loop.
    let pendingCount = 1;
    while (pendingCount > 0) {
        // We don't have a count method exposed easily, but processPendingTasks returns void.
        // It processes 'limit' tasks.
        // We can expose a check or just run it until it says 0 processed.
        // For now, run once with large limit for demo.
        await crawler.processPendingTasks(50);
        pendingCount = 0; // Exit for now to avoid infinite loops in testing
    }

  } catch (error) {
    console.error("Crawl failed:", error);
    process.exit(1);
  } finally {
    await crawler.shutdown();
    resetConfig();
  }
}

main();
