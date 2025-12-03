import { completeAdWatchAction } from '@/actions/ad/complete-watch';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { watchToken, pptId } = body;

    if (!watchToken || !pptId) {
      return NextResponse.json(
        { success: false, error: 'watchToken and pptId are required' },
        { status: 400 }
      );
    }

    const result = await completeAdWatchAction({ watchToken, pptId });

    if (!result?.data) {
      return NextResponse.json(
        { success: false, error: 'Action failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('POST /api/ad/complete-watch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
