'use client';

import { Flame, Search } from 'lucide-react';

interface PPTItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
}

interface Props {
  query: string;
  corrections: string[];
  hotPPTs: PPTItem[];
  onCorrectionClick: (keyword: string) => void;
  onPPTClick: (pptId: string) => void;
}

export function EmptySearchResult({
  query,
  corrections,
  hotPPTs,
  onCorrectionClick,
  onPPTClick,
}: Props) {
  return (
    <div className="py-12">
      {/* 未找到提示 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg text-muted-foreground">
          未找到 "<span className="font-medium text-foreground">{query}</span>"
          相关结果
        </p>
      </div>

      {/* 纠错建议 */}
      {corrections.length > 0 && (
        <div className="mb-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            💡 您是否想搜索：
          </p>
          <div className="flex justify-center flex-wrap gap-2">
            {corrections.map((word, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onCorrectionClick(word)}
                className="px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 热门推荐 */}
      {hotPPTs.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            热门推荐
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {hotPPTs.map((ppt) => (
              <button
                key={ppt.id}
                type="button"
                onClick={() => onPPTClick(ppt.id)}
                className="text-left p-3 border rounded-lg hover:border-primary transition-colors"
              >
                <div className="aspect-video bg-muted rounded mb-2 overflow-hidden">
                  {ppt.thumbnailUrl && (
                    <img
                      src={ppt.thumbnailUrl}
                      alt={ppt.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="text-sm font-medium truncate">{ppt.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
