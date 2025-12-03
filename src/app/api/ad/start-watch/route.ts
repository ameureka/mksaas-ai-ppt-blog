import { startAdWatchAction } from '@/actions/ad/start-watch';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pptId } = body;

    if (!pptId) {
      return NextResponse.json(
        { success: false, error: 'pptId is required' },
        { status: 400 }
      );
    }

    const result = await startAdWatchAction({ pptId });

    if (!result?.data) {
      return NextResponse.json(
        { success: false, error: 'Action failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('POST /api/ad/start-watch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
