import { getPPTs } from '@/actions/ppt';
import { getDashboardStats } from '@/actions/ppt/stats';
import { CategoryDistributionChart } from '@/components/ppt/admin/category-distribution-chart';
import { DownloadTrendChart } from '@/components/ppt/admin/download-trend-chart';
import { StatsCard } from '@/components/ppt/admin/stats-card';
import { TopPPTList } from '@/components/ppt/admin/top-ppt-list';
import { adminTexts } from '@/lib/constants/ppt-i18n';
import {
  mockCategoryDistribution,
  mockDownloadTrend,
} from '@/lib/ppt/mock-data/stats';
import { DollarSign, Download, FileText, Users } from 'lucide-react';

export default async function AdminDashboardPage() {
  const statsResult = await getDashboardStats();
  const topPPTsResult = await getPPTs({
    sortBy: 'downloads',
    pageSize: 5,
    sortOrder: 'desc',
  });

  const stats = statsResult.success
    ? statsResult.data
    : {
        totalPPTs: 0,
        totalUsers: 0,
        totalDownloads: 0,
        todayDownloads: 0,
        weeklyGrowth: 0,
        todayPPTs: 0,
        todayUsers: 0,
        todayRevenue: 0,
        totalRevenue: 0,
      };

  const topPPTs = topPPTsResult.success ? topPPTsResult.data.items : [];

  // Mock data for charts not yet implemented in backend
  const downloadTrend = mockDownloadTrend;
  const categoryDistribution = mockCategoryDistribution;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={adminTexts.dashboard.totalPPTs}
            value={stats.totalPPTs}
            change={0} // Not implemented yet
            icon={FileText}
            iconColor="text-primary"
            iconBgColor="bg-background"
          />
          <StatsCard
            title={adminTexts.dashboard.totalUsers}
            value={stats.totalUsers}
            change={0} // Not implemented yet
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
            value={0} // Not implemented yet
            change={0}
            icon={DollarSign}
            iconColor="text-primary"
            iconBgColor="bg-background"
            format="currency"
          />
        </div>

        <DownloadTrendChart data={downloadTrend} />

        <div className="grid gap-6 md:grid-cols-2">
          <TopPPTList data={topPPTs} />
          <CategoryDistributionChart data={categoryDistribution} />
        </div>
      </div>
    </div>
  );
}
