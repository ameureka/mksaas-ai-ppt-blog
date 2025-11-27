'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n';
import type { TopPPT } from '@/lib/mock-data/stats';

interface TopPPTListProps {
  items?: TopPPT[];
  data?: TopPPT[];
}

export function TopPPTList({ items, data }: TopPPTListProps) {
  const listData = items || data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ADMIN_I18N.stats.topPPT}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {listData.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {item.title}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-1 font-normal text-muted-foreground"
                  >
                    {item.category}
                  </Badge>
                </div>
              </div>
              <span className="text-sm font-medium text-muted-foreground shrink-0">
                {item.downloads}
                {ADMIN_I18N.common.times}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
