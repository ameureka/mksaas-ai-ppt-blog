'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n';
import type { DownloadTrendData } from '@/lib/mock-data/stats';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DownloadTrendChartProps {
  data: DownloadTrendData[];
}

export function DownloadTrendChart({ data }: DownloadTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {ADMIN_I18N.stats.downloadTrend} ({ADMIN_I18N.stats.last7Days})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line
              type="monotone"
              dataKey="downloads"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
