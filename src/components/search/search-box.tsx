'use client';

import { addLocalSearchHistory } from '@/lib/search-history';
import { Search, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { SearchSuggestions } from './search-suggestions';

interface Props {
  onSearch: (query: string, source?: string) => void;
  isLoggedIn: boolean;
  placeholder?: string;
  defaultValue?: string;
}

export function SearchBox({
  onSearch,
  isLoggedIn,
  placeholder = '搜索PPT模板...',
  defaultValue = '',
}: Props) {
  const [query, setQuery] = useState(defaultValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (keyword: string, source?: string) => {
    if (!keyword.trim()) return;
    if (!isLoggedIn) addLocalSearchHistory(keyword);
    onSearch(keyword, source);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query, 'search');
  };

  const handleSuggestionSelect = (keyword: string) => {
    setQuery(keyword);
    handleSearch(keyword, 'suggestion');
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {showSuggestions && query && (
        <SearchSuggestions
          query={query}
          isLoggedIn={isLoggedIn}
          onSelect={handleSuggestionSelect}
          onClose={() => setShowSuggestions(false)}
        />
      )}
    </form>
  );
}
