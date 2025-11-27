'use client';

import { PPTEditForm } from '@/components/ppt/admin/ppt-edit-form';
import { adminTexts } from '@/lib/constants/ppt-i18n';
import { AdminRoutes } from '@/lib/constants/ppt-routes';
import { mockPPTs } from '@/lib/ppt/mock-data/ppts';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function PPTEditPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ppt = mockPPTs.find((p) => p.id === id);

  if (!ppt) {
    notFound();
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={AdminRoutes.Dashboard} className="hover:text-foreground">
            管理后台
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={AdminRoutes.PPTs} className="hover:text-foreground">
            {adminTexts.ppt.management}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{adminTexts.ppt.edit}</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold">{adminTexts.ppt.edit}</h1>
          <p className="text-muted-foreground mt-2">
            修改PPT的标题、分类、作者和描述信息
          </p>
        </div>

        <PPTEditForm ppt={ppt} />
      </div>
    </div>
  );
}
