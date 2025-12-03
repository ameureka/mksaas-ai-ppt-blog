'use server';

import { websiteConfig } from '@/config/website';
import { checkAdWatchLimit, getAdRewardConfig } from '@/lib/ad-watch-limiter';
import { generateWatchToken } from '@/lib/ad-watch/token-service';
import { actionClient } from '@/lib/safe-action';
import { getSession } from '@/lib/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import {
  AdWatchError,
  AdWatchErrorMessages,
  type StartWatchResponse,
} from './types';

const startWatchSchema = z.object({
  pptId: z.string().min(1),
});

/**
 * Start watching an ad to earn credits
 * Generates a watch token and records the start time
 */
export const startAdWatchAction = actionClient
  .schema(startWatchSchema)
  .action(async ({ parsedInput }): Promise<StartWatchResponse> => {
    try {
      const { pptId } = parsedInput;
      const config = getAdRewardConfig();

      // Check if ad reward is enabled
      if (!config.enable) {
        return {
          success: false,
          error: AdWatchErrorMessages[AdWatchError.AD_REWARD_DISABLED],
          code: AdWatchError.AD_REWARD_DISABLED,
        };
      }

      // Get user session (optional - can watch ads without login)
      const session = await getSession();
      const userId = session?.user?.id || null;

      // Get IP address from headers
      const headersList = await headers();
      const forwardedFor = headersList.get('x-forwarded-for');
      const ip = forwardedFor?.split(',')[0]?.trim() || null;

      // Check rate limits
      const limitResult = await checkAdWatchLimit(userId, ip);
      if (!limitResult.allowed) {
        const errorCode = limitResult.reason?.includes('用户')
          ? AdWatchError.USER_LIMIT_EXCEEDED
          : AdWatchError.IP_LIMIT_EXCEEDED;
        return {
          success: false,
          error: limitResult.reason || AdWatchErrorMessages[errorCode],
          code: errorCode,
        };
      }

      // Generate watch token
      const { watchToken, expiresAt } = await generateWatchToken(
        userId,
        pptId,
        ip
      );

      return {
        success: true,
        data: {
          watchToken,
          duration: config.watchDuration,
          expiresAt: expiresAt.toISOString(),
        },
      };
    } catch (error) {
      console.error('startAdWatchAction error:', error);
      return {
        success: false,
        error: '启动广告观看失败，请稍后重试',
      };
    }
  });
