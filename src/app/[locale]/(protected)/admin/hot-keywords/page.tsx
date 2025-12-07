'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  ArrowDown,
  ArrowUp,
  Flame,
  Loader2,
  Pencil,
  Plus,
  Trash,
} from 'lucide-react';
import { toast } from 'sonner';

type PinnedKeyword = {
  id: string;
  keyword: string;
  rank: number;
  createdAt?: string;
  updatedAt?: string;
};

export default function HotKeywordsAdminPage() {
  const [keywords, setKeywords] = useState<PinnedKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchKeywords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/pinned-keywords');
      const data = await res.json();
      if (res.ok && data?.success) {
        const list: PinnedKeyword[] = (data.data ?? []).sort(
          (a: PinnedKeyword, b: PinnedKeyword) => a.rank - b.rank
        );
        setKeywords(list);
      } else {
        toast.error(data?.error || '获取热词失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('获取热词失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async () => {
    const keyword = newKeyword.trim();
    if (!keyword) {
      toast.error('请输入热词');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/pinned-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setKeywords((prev) =>
          [...prev, data.data as PinnedKeyword].sort((a, b) => a.rank - b.rank)
        );
        setNewKeyword('');
        toast.success('添加成功');
      } else {
        toast.error(data?.error || '添加失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('添加失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('确认删除该热词？');
    if (!confirmDelete) return;

    const previous = keywords;
    setKeywords((prev) => prev.filter((item) => item.id !== id));

    const res = await fetch(`/api/admin/pinned-keywords/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      setKeywords(previous);
      const data = await res.json().catch(() => null);
      toast.error(data?.error || '删除失败');
    } else {
      toast.success('删除成功');
      // 重新获取以确保 rank 连续
      fetchKeywords();
    }
  };

  const handleEdit = async (item: PinnedKeyword) => {
    const value = prompt('请输入新的热词', item.keyword);
    if (value === null) return;
    const keyword = value.trim();
    if (!keyword) {
      toast.error('热词不能为空');
      return;
    }
    if (keyword === item.keyword) return;

    const res = await fetch(`/api/admin/pinned-keywords/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      toast.error(data?.error || '更新失败');
      return;
    }
    setKeywords((prev) =>
      prev.map((kw) =>
        kw.id === item.id ? { ...kw, keyword: data.data.keyword } : kw
      )
    );
    toast.success('更新成功');
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const index = keywords.findIndex((item) => item.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= keywords.length) return;

    const desiredRank = targetIndex + 1;
    const reordered = [...keywords];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const previous = keywords;
    setKeywords(reordered.map((item, i) => ({ ...item, rank: i + 1 })));

    const res = await fetch(`/api/admin/pinned-keywords/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rank: desiredRank }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      setKeywords(previous);
      toast.error(data?.error || '排序更新失败');
    } else if (Array.isArray(data.data)) {
      setKeywords(
        (data.data as PinnedKeyword[]).sort((a, b) => a.rank - b.rank)
      );
    } else {
      fetchKeywords();
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary" />
              热词管理
            </h1>
            <p className="text-muted-foreground mt-1">
              置顶热词优先展示，最多返回 8 个，自动热词为补充。
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>添加置顶热词</CardTitle>
            <CardDescription>
              支持手动置顶，避免被自动热词覆盖。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="输入热词，如：双十一、圣诞节"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleAdd} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="ml-2">添加</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>置顶热词列表</CardTitle>
            <CardDescription>
              置顶词优先，其余由系统自动计算并去重补齐。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>加载中...</span>
              </div>
            ) : keywords.length === 0 ? (
              <div className="text-muted-foreground">暂无置顶热词</div>
            ) : (
              <div className="flex flex-col divide-y">
                {keywords
                  .slice()
                  .sort((a, b) => a.rank - b.rank)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge
                          variant="secondary"
                          className="w-12 justify-center"
                        >
                          #{item.rank}
                        </Badge>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {item.keyword}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {item.id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-primary/10"
                          onClick={() => handleMove(item.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-primary/10"
                          onClick={() => handleMove(item.id, 'down')}
                          disabled={index === keywords.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="hover:bg-destructive/10 text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
