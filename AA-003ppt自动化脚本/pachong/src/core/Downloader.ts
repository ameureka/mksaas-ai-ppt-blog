import axios from 'axios';
import { createWriteStream, existsSync } from 'fs';
import { ensureDir } from 'fs-extra';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { getConfig } from '../config';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function downloadFile(
  url: string,
  channelId: string,
  filename: string
): Promise<string> {
  const config = getConfig();
  const downloadDir = join(config.DOWNLOAD_DIR, channelId);
  await ensureDir(downloadDir);

  const filePath = join(downloadDir, filename);

  // If file already exists and has size > 0, maybe skip? 
  // For now, let's overwrite or we can check size.
  // Implementation: Overwrite.

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 30000, // 30s timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.1ppt.com/' 
        }
      });

      const writer = createWriteStream(filePath);
      await pipeline(response.data, writer);
      
      return filePath;
    } catch (error) {
      attempt++;
      console.warn(`Download attempt ${attempt} failed for ${url}: ${error instanceof Error ? error.message : String(error)}`);
      if (attempt >= MAX_RETRIES) {
        throw new Error(`Failed to download ${url} after ${MAX_RETRIES} attempts`);
      }
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  
  throw new Error("Unexpected error in downloadFile");
}

export async function downloadAsset(
  url: string,
  channelId: string,
  subfolder: string,
  filename: string
): Promise<string> {
  const config = getConfig();
  const downloadDir = join(config.DOWNLOAD_DIR, channelId, subfolder);
  await ensureDir(downloadDir);

  const filePath = join(downloadDir, filename);

  // If file already exists, overwrite.
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.1ppt.com/'
        }
      });

      const writer = createWriteStream(filePath);
      await pipeline(response.data, writer);
      
      return filePath;
    } catch (error) {
      attempt++;
      console.warn(`Asset download attempt ${attempt} failed for ${url}: ${error instanceof Error ? error.message : String(error)}`);
      if (attempt >= MAX_RETRIES) {
        // Warning but maybe not fatal for main process?
        // Let's rethrow to let caller decide.
        throw new Error(`Failed to download asset ${url}`);
      }
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
   throw new Error("Unexpected error in downloadAsset");
}
