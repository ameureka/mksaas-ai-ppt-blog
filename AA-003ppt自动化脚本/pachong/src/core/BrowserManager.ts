import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { getConfig } from '../config';

export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;

  private constructor() {}

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  public async init(): Promise<void> {
    if (this.browser) return;

    const config = getConfig();
    this.browser = await chromium.launch({
      headless: config.HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  public async newContext(): Promise<BrowserContext> {
    if (!this.browser) {
      await this.init();
    }
    // Safety check: init() guarantees this.browser is not null, 
    // but TypeScript might complain or if launch fails.
    if (!this.browser) {
        throw new Error("Failed to initialize browser");
    }

    return this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });
  }

  public async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const context = await this.newContext();
    const page = await context.newPage();
    try {
      return await fn(page);
    } finally {
      await context.close();
    }
  }
}
