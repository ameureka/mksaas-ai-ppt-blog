'use client';

import { useDebounce } from '@/hooks/use-debounce';
import { getMatchingLocalHistory } from '@/lib/search-history';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SuggestionItem {
  text: string;
  source: 'history' | 'hot' | 'title';
}

interface Props {
  query: string;
  isLoggedIn: boolean;
  onSelect: (keyword: string) => void;
  onClose: () => void;
}

const SOURCE_ICONS = { history: '🕐', hot: '🔥', title: '📄' };
const SOURCE_LABELS = { history: '最近搜索', hot: '热门', title: '模板' };

export function SearchSuggestions({
  query,
  isLoggedIn,
  onSelect,
  onClose,
}: Props) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const localHistory = !isLoggedIn
        ? getMatchingLocalHistory(debouncedQuery, 3).map((text) => ({
            text,
            source: 'history' as const,
          }))
        : [];

      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`
        );
        const data = await res.json();
        const apiSuggestions = data.suggestions || [];

        const seen = new Set<string>();
        const unique = [...localHistory, ...apiSuggestions].filter((s) => {
          const lower = s.text.toLowerCase();
          if (seen.has(lower)) return false;
          seen.add(lower);
          return true;
        });

        setSuggestions(unique.slice(0, 8));
      } catch {
        setSuggestions(localHistory);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, isLoggedIn]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) onSelect(suggestions[selectedIndex].text);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [suggestions, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  if (suggestions.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute top-full left-0 right-0 bg-background border rounded-lg shadow-lg mt-1 z-50 overflow-hidden"
    >
      {suggestions.map((item, index) => (
        <button
          key={`${item.source}-${item.text}`}
          type="button"
          className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-muted transition-colors ${index === selectedIndex ? 'bg-muted' : ''}`}
          onClick={() => onSelect(item.text)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className="text-lg">{SOURCE_ICONS[item.source]}</span>
          <span className="flex-1 truncate">{item.text}</span>
          <span className="text-xs text-muted-foreground">
            {SOURCE_LABELS[item.source]}
          </span>
        </button>
      ))}
    </div>
  );
}
