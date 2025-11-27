'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LocaleLink } from '@/i18n/navigation';
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n';
import { AdminRoutes } from '@/lib/constants/ppt-routes';
import type { PPT } from '@/lib/types/ppt/ppt';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface PPTListTableProps {
  ppts: PPT[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDelete: (id: string) => void;
}

export function PPTListTable({
  ppts,
  selectedIds,
  onSelectionChange,
  onDelete,
}: PPTListTableProps) {
  const allSelected = ppts.length > 0 && selectedIds.length === ppts.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(ppts.map((ppt) => ppt.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      business: ADMIN_I18N.categories.business,
      product: ADMIN_I18N.categories.product,
      education: ADMIN_I18N.categories.education,
      marketing: ADMIN_I18N.categories.marketing,
      general: ADMIN_I18N.categories.general,
    };
    return labels[category] || category;
  };

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label={ADMIN_I18N.common.selectAll}
              />
            </TableHead>
            <TableHead className="w-24">ID</TableHead>
            <TableHead className="min-w-[200px]">
              {ADMIN_I18N.ppt.titleLabel}
            </TableHead>
            <TableHead>{ADMIN_I18N.ppt.categoryLabel}</TableHead>
            <TableHead>{ADMIN_I18N.ppt.authorLabel}</TableHead>
            <TableHead className="text-right">
              {ADMIN_I18N.ppt.downloadsLabel}
            </TableHead>
            <TableHead className="text-right">
              {ADMIN_I18N.ppt.viewsLabel}
            </TableHead>
            <TableHead>{ADMIN_I18N.ppt.createTime}</TableHead>
            <TableHead className="w-20">{ADMIN_I18N.common.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ppts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="h-24 text-center text-muted-foreground"
              >
                {ADMIN_I18N.common.noData}
              </TableCell>
            </TableRow>
          ) : (
            ppts.map((ppt) => (
              <TableRow key={ppt.id} className="hover:bg-muted border-border">
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(ppt.id)}
                    onCheckedChange={() => handleSelectOne(ppt.id)}
                    aria-label={`${ADMIN_I18N.common.select} ${ppt.title}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {ppt.id.replace('ppt_', '')}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {ppt.title}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getCategoryLabel(ppt.category)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {ppt.author}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {ppt.downloads.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {ppt.views.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(ppt.created_at), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">
                          {ADMIN_I18N.common.openMenu}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <LocaleLink href={`${AdminRoutes.PPTs}/${ppt.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          {ADMIN_I18N.common.viewDetails}
                        </LocaleLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <LocaleLink href={AdminRoutes.PPTEdit(ppt.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {ADMIN_I18N.common.edit}
                        </LocaleLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(ppt.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {ADMIN_I18N.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
