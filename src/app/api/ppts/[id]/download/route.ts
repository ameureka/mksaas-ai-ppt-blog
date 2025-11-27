import { recordDownload } from '@/actions/ppt/ppt';
import { websiteConfig } from '@/config/website';
import { getPPTById } from '@/actions/ppt/ppt';
import { NextResponse } from 'next/server';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // TODO: hook into auth when available; for now only gate by config
  if (websiteConfig.features.pptRequireLoginForDownload) {
    return NextResponse.json(
      { success: false, error: 'Login required to download' },
      { status: 401 }
    );
  }

  const detail = await getPPTById(id);
  if (!detail.success) {
    const status = detail.code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json(detail, { status });
  }

  // record download count (best-effort)
  await recordDownload(id);

  return NextResponse.json(
    { success: true, data: { fileUrl: detail.data.file_url } },
    { status: 200 }
  );
}
