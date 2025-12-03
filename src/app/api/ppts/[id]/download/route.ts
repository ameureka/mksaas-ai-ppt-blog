import { randomUUID } from 'crypto';
import { recordDownload } from '@/actions/ppt/ppt';
import { getPPTById } from '@/actions/ppt/ppt';
import { websiteConfig } from '@/config/website';
import { consumeCredits, getUserCredits } from '@/credits/credits';

import { getDb } from '@/db';
import { userDownloadHistory } from '@/db/schema';
import { validateDownloadToken } from '@/lib/ad-watch/token-service';
import { getSession } from '@/lib/server';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

type DownloadMethod = 'firstFree' | 'credits' | 'ad';

interface DownloadRequestBody {
  method?: DownloadMethod;
  downloadToken?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Parse request body
  let body: DownloadRequestBody = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional for backward compatibility
  }

  const method: DownloadMethod = body.method || 'firstFree';
  const downloadToken = body.downloadToken;

  // Get user session
  const session = await getSession();
  const userId = session?.user?.id;

  // Get IP address
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || null;

  // Check if login is required
  if (websiteConfig.features.pptRequireLoginForDownload && !userId) {
    return NextResponse.json(
      { success: false, error: 'Login required to download' },
      { status: 401 }
    );
  }

  // Get PPT details
  const detail = await getPPTById(id);
  if (!detail.success) {
    const status = detail.code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json(detail, { status });
  }

  const db = await getDb();
  const requiredCredits = 5; // Default, could be from PPT config

  // Validate download method
  switch (method) {
    case 'firstFree': {
      // Check if user has downloaded this PPT before
      if (userId) {
        const existingDownload = await db
          .select()
          .from(userDownloadHistory)
          .where(
            and(
              eq(userDownloadHistory.userId, userId),
              eq(userDownloadHistory.pptId, id)
            )
          )
          .limit(1);

        if (existingDownload.length > 0) {
          return NextResponse.json(
            { success: false, error: '您已下载过此模板，请使用其他方式下载' },
            { status: 400 }
          );
        }
      }
      break;
    }

    case 'credits': {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: '请先登录后使用积分下载' },
          { status: 401 }
        );
      }

      // Check credit balance
      const balance = await getUserCredits(userId);
      if (balance < requiredCredits) {
        return NextResponse.json(
          { success: false, error: '积分不足，请获取更多积分' },
          { status: 400 }
        );
      }

      // Deduct credits
      try {
        await consumeCredits({
          userId,
          amount: requiredCredits,
          description: `下载 PPT: ${detail.data.title}`,
        });
      } catch (error) {
        console.error('Failed to consume credits:', error);
        return NextResponse.json(
          { success: false, error: '积分扣除失败，请稍后重试' },
          { status: 500 }
        );
      }
      break;
    }

    case 'ad': {
      if (!downloadToken) {
        return NextResponse.json(
          { success: false, error: '缺少下载令牌' },
          { status: 400 }
        );
      }

      // Validate download token
      const tokenValidation = await validateDownloadToken(downloadToken);
      if (!tokenValidation.valid) {
        return NextResponse.json(
          { success: false, error: '下载令牌无效或已过期' },
          { status: 400 }
        );
      }
      break;
    }

    default:
      return NextResponse.json(
        { success: false, error: '无效的下载方式' },
        { status: 400 }
      );
  }

  // Record download history
  if (userId) {
    try {
      await db.insert(userDownloadHistory).values({
        id: randomUUID(),
        userId,
        pptId: id,
        downloadMethod: method,
        creditsSpent: method === 'credits' ? requiredCredits : 0,
        ipAddress: ip,
        downloadedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to record download history:', error);
      // Don't fail the download if history recording fails
    }
  }

  // Record download count (best-effort)
  await recordDownload(id);

  return NextResponse.json(
    { success: true, data: { fileUrl: detail.data.file_url } },
    { status: 200 }
  );
}
