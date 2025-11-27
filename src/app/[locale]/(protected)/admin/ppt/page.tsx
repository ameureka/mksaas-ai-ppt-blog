'use client';

import { CategoryDistributionChart } from '@/components/ppt/admin/category-distribution-chart';
import { DownloadTrendChart } from '@/components/ppt/admin/download-trend-chart';
import { StatsCard } from '@/components/ppt/admin/stats-card';
import { TopPPTList } from '@/components/ppt/admin/top-ppt-list';
import { adminTexts } from '@/lib/constants/ppt-i18n';
import {
  mockCategoryDistribution,
  mockDashboardStats,
  mockDownloadTrend,
  mockTopPPTs,
} from '@/lib/ppt/mock-data/stats';
import { DollarSign, Download, FileText, Users } from 'lucide-react';

export default function AdminDashboardPage() {
  const stats = mockDashboardStats;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={adminTexts.dashboard.totalPPTs}
            value={stats.totalPPTs}
            change={stats.todayPPTs}
            icon={FileText}
            iconColor="text-primary"
            iconBgColor="bg-background"
          />
          <StatsCard
            title={adminTexts.dashboard.totalUsers}
            value={stats.totalUsers}
            change={stats.todayUsers}
            icon={Users}
            iconColor="text-primary"
            iconBgColor="bg-background"
          />
          <StatsCard
            title={adminTexts.dashboard.totalDownloads}
            value={stats.totalDownloads}
            change={stats.todayDownloads}
            icon={Download}
            iconColor="text-primary"
            iconBgColor="bg-background"
          />
          <StatsCard
            title={adminTexts.dashboard.totalRevenue}
            value={stats.totalRevenue}
            change={stats.todayRevenue}
            icon={DollarSign}
            iconColor="text-primary"
            iconBgColor="bg-background"
            format="currency"
          />
        </div>

        <DownloadTrendChart data={mockDownloadTrend} />

        <div className="grid gap-6 md:grid-cols-2">
          <TopPPTList data={mockTopPPTs} />
          <CategoryDistributionChart data={mockCategoryDistribution} />
        </div>
      </div>
    </div>
  );
}
