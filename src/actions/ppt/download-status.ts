'use server';

import { getUserCredits } from '@/credits/credits';
import { getDb } from '@/db';
import { userDownloadHistory } from '@/db/schema';
import { actionClient } from '@/lib/safe-action';
import { getSession } from '@/lib/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const downloadStatusSchema = z.object({
  pptId: z.string().min(1),
});

export interface DownloadStatusResponse {
  success: boolean;
  data?: {
    pptId: string;
    hasDownloadedBefore: boolean;
    isFirstDownloadAvailable: boolean;
    creditBalance: number;
    requiredCredits: number;
  };
  error?: string;
}

/**
 * Get download status for a PPT
 * Returns whether user has downloaded before and their credit balance
 */
export const getDownloadStatusAction = actionClient
  .schema(downloadStatusSchema)
  .action(async ({ parsedInput }): Promise<DownloadStatusResponse> => {
    try {
      const { pptId } = parsedInput;
      const session = await getSession();
      const userId = session?.user?.id;

      // Default values for non-logged-in users
      let hasDownloadedBefore = false;
      let creditBalance = 0;

      if (userId) {
        const db = await getDb();

        // Check if user has downloaded this PPT before
        const downloadRecords = await db
          .select()
          .from(userDownloadHistory)
          .where(
            and(
              eq(userDownloadHistory.userId, userId),
              eq(userDownloadHistory.pptId, pptId)
            )
          )
          .limit(1);

        hasDownloadedBefore = downloadRecords.length > 0;

        // Get user's credit balance
        creditBalance = await getUserCredits(userId);
      }

      // First download is available if user hasn't downloaded before
      const isFirstDownloadAvailable = !hasDownloadedBefore;

      return {
        success: true,
        data: {
          pptId,
          hasDownloadedBefore,
          isFirstDownloadAvailable,
          creditBalance,
          requiredCredits: 5, // Default required credits, could be from PPT config
        },
      };
    } catch (error) {
      console.error('getDownloadStatusAction error:', error);
      return {
        success: false,
        error: '获取下载状态失败',
      };
    }
  });
