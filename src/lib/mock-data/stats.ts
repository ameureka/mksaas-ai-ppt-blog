export interface DashboardStats {
  totalPPTs: number;
  totalUsers: number;
  totalDownloads: number;
  totalRevenue: number;
  todayPPTs: number;
  todayUsers: number;
  todayDownloads: number;
  todayRevenue: number;
}

export interface DownloadTrendData {
  date: string;
  downloads: number;
}

export interface TopPPT {
  id: string;
  title: string;
  downloads: number;
  category: string;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  percentage: number;
}

export interface CategoryDistributionWithColor {
  name: string;
  value: number;
  color: string;
}

export const mockDashboardStats: DashboardStats = {
  totalPPTs: 1234,
  totalUsers: 5678,
  totalDownloads: 12345,
  totalRevenue: 1234,
  todayPPTs: 12,
  todayUsers: 45,
  todayDownloads: 234,
  todayRevenue: 56,
};

export const mockDownloadTrend: DownloadTrendData[] = [
  { date: '1/10', downloads: 120 },
  { date: '1/11', downloads: 180 },
  { date: '1/12', downloads: 150 },
  { date: '1/13', downloads: 220 },
  { date: '1/14', downloads: 190 },
  { date: '1/15', downloads: 250 },
  { date: '1/16', downloads: 280 },
];

export const mockTopPPTs: TopPPT[] = [
  { id: '1', title: '年终总结报告', downloads: 234, category: 'business' },
  { id: '2', title: '产品介绍PPT', downloads: 189, category: 'product' },
  { id: '3', title: '项目提案模板', downloads: 156, category: 'business' },
  { id: '4', title: '培训课件', downloads: 145, category: 'education' },
  { id: '5', title: '营销方案', downloads: 134, category: 'marketing' },
  { id: '6', title: '商业计划书', downloads: 128, category: 'business' },
  { id: '7', title: '产品路线图', downloads: 115, category: 'product' },
  { id: '8', title: '团队建设', downloads: 98, category: 'education' },
  { id: '9', title: '数据分析报告', downloads: 87, category: 'business' },
  { id: '10', title: '市场调研', downloads: 76, category: 'marketing' },
];

export const mockCategoryDistribution: CategoryDistribution[] = [
  { name: 'Business', value: 494, percentage: 40 },
  { name: 'Product', value: 370, percentage: 30 },
  { name: 'Education', value: 247, percentage: 20 },
  { name: 'Marketing', value: 123, percentage: 10 },
];

export const mockStats = {
  totalDownloads: 12345,
  todayDownloads: 234,
  downloadTrend: mockDownloadTrend,
  topPPTs: mockTopPPTs,
  categoryDistribution: [
    { name: 'Business', value: 494, color: '#3b82f6' },
    { name: 'Product', value: 370, color: '#10b981' },
    { name: 'Education', value: 247, color: '#f59e0b' },
    { name: 'Marketing', value: 123, color: '#ef4444' },
  ] as CategoryDistributionWithColor[],
};
