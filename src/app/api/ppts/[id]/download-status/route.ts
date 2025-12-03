import { getDownloadStatusAction } from '@/actions/ppt/download-status';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pptId } = await params;

    if (!pptId) {
      return NextResponse.json(
        { success: false, error: 'pptId is required' },
        { status: 400 }
      );
    }

    const result = await getDownloadStatusAction({ pptId });

    if (!result?.data) {
      return NextResponse.json(
        { success: false, error: 'Action failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('GET /api/ppts/[id]/download-status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
