import { resolve, isAbsolute, join } from 'path';
import dotenv from 'dotenv';
import { AppConfigSchema, AppConfig } from './schema';
import { existsSync } from 'fs';

// Load .env file
dotenv.config();

export class ConfigManager {
  private config: AppConfig;
  private rootDir: string;

  constructor(env: Record<string, string | undefined> = process.env, rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    const result = AppConfigSchema.safeParse(env);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Invalid configuration: ${errors}`);
    }

    this.config = result.data;
    this.normalizePaths();
  }

  private normalizePaths() {
    this.config.DOWNLOAD_DIR = this.resolvePath(this.config.DOWNLOAD_DIR);
    this.config.DB_PATH = this.resolvePath(this.config.DB_PATH);
    
    // Default channels config path
    if (!this.config.CHANNELS_CONFIG_PATH) {
       this.config.CHANNELS_CONFIG_PATH = join(this.rootDir, 'config', 'channels.json');
    } else {
       this.config.CHANNELS_CONFIG_PATH = this.resolvePath(this.config.CHANNELS_CONFIG_PATH);
    }
  }

  private resolvePath(p: string): string {
    return isAbsolute(p) ? p : resolve(this.rootDir, p);
  }

  public get(): AppConfig {
    return this.config;
  }
}

// Singleton instance
let configInstance: ConfigManager | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = new ConfigManager();
  }
  return configInstance.get();
}

export function resetConfig() {
  configInstance = null;
}
