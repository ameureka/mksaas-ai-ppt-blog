import { recordView } from '@/actions/ppt/ppt';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await recordView(id);
    if (result.success) {
      return Response.json({ success: true });
    }
    return Response.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  } catch (error) {
    console.error('[PPT View] Failed to record view', error);
    return Response.json(
      { success: false, error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
