import { readFileSync } from 'fs';
import { getConfig } from './index';

export interface ChannelConfig {
  id: string;
  name: string;
  baseUrl: string;
  pagePattern: string;
  perPage: number;
  maxPage?: number;
}

let cachedChannels: ChannelConfig[] | null = null;

export function loadChannels(): ChannelConfig[] {
  if (cachedChannels) return cachedChannels;
  
  const config = getConfig();
  try {
      const raw = readFileSync(config.CHANNELS_CONFIG_PATH!, 'utf-8');
      cachedChannels = JSON.parse(raw) as ChannelConfig[];
      return cachedChannels;
  } catch (error) {
      throw new Error(`Failed to load channels config from ${config.CHANNELS_CONFIG_PATH}: ${error}`);
  }
}

export function getChannelById(id: string): ChannelConfig | undefined {
  return loadChannels().find(c => c.id === id);
}
