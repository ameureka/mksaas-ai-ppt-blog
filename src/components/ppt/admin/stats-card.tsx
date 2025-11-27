'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  change: number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  format?: 'number' | 'currency';
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  iconBgColor,
  format = 'number',
}: StatsCardProps) {
  const formattedValue =
    format === 'currency'
      ? `${value.toLocaleString()}`
      : value.toLocaleString();
  const formattedChange = format === 'currency' ? `+${change}` : `+${change}`;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${iconBgColor} border border-border`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1 text-foreground">
              {formattedValue}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-primary font-medium">
                {formattedChange}
              </span>{' '}
              {ADMIN_I18N.stats.todayNew}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
