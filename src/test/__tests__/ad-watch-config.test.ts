import * as fc from 'fast-check';
/**
 * Property 10: Configuration Values Are Respected
 * **Feature: download-ad-optimization, Property 10: Configuration Values Are Respected**
 * **Validates: Requirements 8.1, 8.2**
 *
 * 验证系统正确使用配置值
 */
import { describe, expect, it } from 'vitest';

import { websiteConfig } from '@/config/website';
import { getAdRewardConfig } from '@/lib/ad-watch-limiter';
import { adRewardConfigArb } from '@/test/generators/ad-watch';

describe('Property 10: Configuration Values Are Respected', () => {
  /**
   * *For any* configuration, the getAdRewardConfig function should return the websiteConfig values
   */
  it('should return configuration from websiteConfig', () => {
    const config = getAdRewardConfig();
    const expectedConfig = websiteConfig.adReward;

    expect(config.enable).toBe(expectedConfig.enable);
    expect(config.creditsPerWatch).toBe(expectedConfig.creditsPerWatch);
    expect(config.watchDuration).toBe(expectedConfig.watchDuration);
    expect(config.minWatchDuration).toBe(expectedConfig.minWatchDuration);
    expect(config.tokenExpireMinutes).toBe(expectedConfig.tokenExpireMinutes);
    expect(config.dailyLimitPerUser).toBe(expectedConfig.dailyLimitPerUser);
    expect(config.dailyLimitPerIP).toBe(expectedConfig.dailyLimitPerIP);
  });

  /**
   * *For any* valid ad reward config, all values should be within expected ranges
   */
  it('should have valid configuration value ranges', () => {
    fc.assert(
      fc.property(adRewardConfigArb, (config) => {
        // creditsPerWatch should be positive
        expect(config.creditsPerWatch).toBeGreaterThan(0);

        // watchDuration should be positive
        expect(config.watchDuration).toBeGreaterThan(0);

        // minWatchDuration should be positive and <= watchDuration
        expect(config.minWatchDuration).toBeGreaterThan(0);

        // tokenExpireMinutes should be positive
        expect(config.tokenExpireMinutes).toBeGreaterThan(0);

        // dailyLimitPerUser should be positive
        expect(config.dailyLimitPerUser).toBeGreaterThan(0);

        // dailyLimitPerIP should be positive
        expect(config.dailyLimitPerIP).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * The actual configuration should have sensible defaults
   */
  it('should have sensible default configuration', () => {
    const config = getAdRewardConfig();

    // Credits per watch should be reasonable (1-50)
    expect(config.creditsPerWatch).toBeGreaterThanOrEqual(1);
    expect(config.creditsPerWatch).toBeLessThanOrEqual(50);

    // Watch duration should be reasonable (10-120 seconds)
    expect(config.watchDuration).toBeGreaterThanOrEqual(10);
    expect(config.watchDuration).toBeLessThanOrEqual(120);

    // Min watch duration should be less than or equal to watch duration
    expect(config.minWatchDuration).toBeLessThanOrEqual(config.watchDuration);

    // Token expire should be reasonable (1-30 minutes)
    expect(config.tokenExpireMinutes).toBeGreaterThanOrEqual(1);
    expect(config.tokenExpireMinutes).toBeLessThanOrEqual(30);

    // Daily limits should be reasonable
    expect(config.dailyLimitPerUser).toBeGreaterThanOrEqual(1);
    expect(config.dailyLimitPerIP).toBeGreaterThanOrEqual(
      config.dailyLimitPerUser
    );
  });
});
