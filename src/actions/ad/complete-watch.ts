'use server';

import { websiteConfig } from '@/config/website';
import { addCredits, getUserCredits } from '@/credits/credits';
import { CREDIT_TRANSACTION_TYPE } from '@/credits/types';
import { getAdRewardConfig } from '@/lib/ad-watch-limiter';
import {
  completeWatch,
  getAdWatchRecordByToken,
} from '@/lib/ad-watch/token-service';
import { actionClient } from '@/lib/safe-action';
import { getSession } from '@/lib/server';
import { z } from 'zod';
import {
  AdWatchError,
  AdWatchErrorMessages,
  type CompleteWatchResponse,
} from './types';

const completeWatchSchema = z.object({
  watchToken: z.string().min(1),
  pptId: z.string().min(1),
});

/**
 * Complete watching an ad and receive credits
 * Validates the watch token and awards credits to the user
 */
export const completeAdWatchAction = actionClient
  .schema(completeWatchSchema)
  .action(async ({ parsedInput }): Promise<CompleteWatchResponse> => {
    try {
      const { watchToken, pptId } = parsedInput;
      const config = getAdRewardConfig();

      // Check if ad reward is enabled
      if (!config.enable) {
        return {
          success: false,
          error: AdWatchErrorMessages[AdWatchError.AD_REWARD_DISABLED],
          code: AdWatchError.AD_REWARD_DISABLED,
        };
      }

      // Get the watch record to verify pptId matches
      const record = await getAdWatchRecordByToken(watchToken);
      if (!record) {
        return {
          success: false,
          error: AdWatchErrorMessages[AdWatchError.TOKEN_NOT_FOUND],
          code: AdWatchError.TOKEN_NOT_FOUND,
        };
      }

      // Verify pptId matches
      if (record.pptId !== pptId) {
        return {
          success: false,
          error: AdWatchErrorMessages[AdWatchError.INVALID_PPT],
          code: AdWatchError.INVALID_PPT,
        };
      }

      // Complete the watch (validates token, time, etc.)
      const result = await completeWatch(watchToken);
      if (!result.success) {
        const errorMap: Record<string, AdWatchError> = {
          NOT_FOUND: AdWatchError.TOKEN_NOT_FOUND,
          EXPIRED: AdWatchError.TOKEN_EXPIRED,
          ALREADY_USED: AdWatchError.TOKEN_ALREADY_USED,
          TIME_NOT_ELAPSED: AdWatchError.TIME_NOT_ELAPSED,
        };
        const errorCode =
          errorMap[result.error || ''] || AdWatchError.TOKEN_NOT_FOUND;
        return {
          success: false,
          error: AdWatchErrorMessages[errorCode],
          code: errorCode,
        };
      }

      // Award credits if user is logged in and credits are enabled
      let newBalance = 0;
      const session = await getSession();
      const userId = session?.user?.id;

      if (userId && websiteConfig.credits.enableCredits) {
        try {
          await addCredits({
            userId,
            amount: config.creditsPerWatch,
            type: CREDIT_TRANSACTION_TYPE.AD_REWARD,
            description: `观看广告奖励 - PPT: ${pptId}`,
            expireDays: 30, // Ad reward credits expire in 30 days
          });
          newBalance = await getUserCredits(userId);
        } catch (error) {
          console.error('Failed to award credits:', error);
          // Don't fail the whole operation if credit award fails
          // The download token is still valid
        }
      }

      return {
        success: true,
        data: {
          downloadToken: result.downloadToken!,
          creditsAwarded: result.creditsAwarded || 0,
          newBalance,
        },
      };
    } catch (error) {
      console.error('completeAdWatchAction error:', error);
      return {
        success: false,
        error: '完成广告观看失败，请稍后重试',
      };
    }
  });
