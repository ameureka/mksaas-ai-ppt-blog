/**
 * Test data generators for ad-watch feature
 * Used with fast-check for property-based testing
 */
import * as fc from 'fast-check';

/**
 * Generate a valid UUID v4
 */
export const userIdArb = fc.uuid();

/**
 * Generate a valid PPT ID (UUID format)
 */
export const pptIdArb = fc.uuid();

/**
 * Generate a valid IPv4 address
 */
export const ipAddressArb = fc.ipV4();

/**
 * Generate a valid watch token (64 alphanumeric characters)
 */
export const watchTokenArb = fc.string({ minLength: 64, maxLength: 64 });

/**
 * Generate a valid download token (64 alphanumeric characters)
 */
export const downloadTokenArb = watchTokenArb;

/**
 * Generate a valid ad watch status
 */
export const adWatchStatusArb = fc.constantFrom(
  'pending',
  'completed',
  'expired'
);

/**
 * Generate a valid download method
 */
export const downloadMethodArb = fc.constantFrom('firstFree', 'credits', 'ad');

/**
 * Generate a valid ad watch record
 */
export const adWatchRecordArb = fc.record({
  id: fc.uuid(),
  userId: fc.option(userIdArb, { nil: null }),
  pptId: fc.option(pptIdArb, { nil: null }),
  ipAddress: fc.option(ipAddressArb, { nil: null }),
  watchToken: watchTokenArb,
  downloadToken: fc.option(downloadTokenArb, { nil: null }),
  startedAt: fc.date({
    min: new Date('2024-01-01'),
    max: new Date('2025-12-31'),
  }),
  completedAt: fc.option(
    fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
    { nil: null }
  ),
  status: adWatchStatusArb,
  creditsAwarded: fc.integer({ min: 0, max: 100 }),
  createdAt: fc.date({
    min: new Date('2024-01-01'),
    max: new Date('2025-12-31'),
  }),
});

/**
 * Generate a valid user download history record
 */
export const userDownloadHistoryArb = fc.record({
  id: fc.uuid(),
  userId: fc.option(userIdArb, { nil: null }),
  pptId: pptIdArb,
  downloadMethod: downloadMethodArb,
  creditsSpent: fc.integer({ min: 0, max: 100 }),
  ipAddress: fc.option(ipAddressArb, { nil: null }),
  downloadedAt: fc.date({
    min: new Date('2024-01-01'),
    max: new Date('2025-12-31'),
  }),
});

/**
 * Generate a valid ad reward config
 */
export const adRewardConfigArb = fc.record({
  enable: fc.boolean(),
  creditsPerWatch: fc.integer({ min: 1, max: 50 }),
  watchDuration: fc.integer({ min: 10, max: 120 }),
  minWatchDuration: fc.integer({ min: 5, max: 60 }),
  tokenExpireMinutes: fc.integer({ min: 1, max: 30 }),
  dailyLimitPerUser: fc.integer({ min: 1, max: 50 }),
  dailyLimitPerIP: fc.integer({ min: 1, max: 100 }),
});

/**
 * Generate elapsed time in seconds
 */
export const elapsedSecondsArb = fc.integer({ min: 0, max: 300 });

/**
 * Generate a watch count for rate limiting tests
 */
export const watchCountArb = fc.integer({ min: 0, max: 50 });

/**
 * Generate a daily limit for rate limiting tests
 */
export const dailyLimitArb = fc.integer({ min: 1, max: 30 });
