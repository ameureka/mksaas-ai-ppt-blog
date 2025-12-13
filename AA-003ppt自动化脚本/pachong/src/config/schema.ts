import { z } from 'zod';

export const AppConfigSchema = z.object({
  DOWNLOAD_DIR: z.string().min(1, 'DOWNLOAD_DIR is required'),
  DB_PATH: z.string().min(1, 'DB_PATH is required'),
  CHANNELS_CONFIG_PATH: z.string().optional(),
  MAX_CONCURRENCY: z.coerce.number().int().min(1).default(2),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  HEADLESS: z.enum(['true', 'false', '1', '0']).transform((val) => val === 'true' || val === '1').default('true'),
});

export type AppConfigInput = z.input<typeof AppConfigSchema>;
export type AppConfig = z.output<typeof AppConfigSchema>;
