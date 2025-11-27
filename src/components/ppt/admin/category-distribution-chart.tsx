'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

interface CategoryDistributionChartProps {
  data: CategoryData[];
}

const FALLBACK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function CategoryDistributionChart({
  data,
}: CategoryDistributionChartProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>
          {ADMIN_I18N?.stats?.categoryDist || 'Category Distribution'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.color ||
                      FALLBACK_COLORS[index % FALLBACK_COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
