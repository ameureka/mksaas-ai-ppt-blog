const STORAGE_KEY = 'ppt_search_history';
const MAX_LOCAL_HISTORY = 10;

/**
 * 获取本地搜索历史
 */
export function getLocalSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 添加搜索历史
 */
export function addLocalSearchHistory(keyword: string): void {
  if (typeof window === 'undefined' || !keyword?.trim()) return;

  const history = getLocalSearchHistory();
  const filtered = history.filter(
    (h) => h.toLowerCase() !== keyword.toLowerCase()
  );
  const updated = [keyword.trim(), ...filtered].slice(0, MAX_LOCAL_HISTORY);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[SearchHistory] Failed to save:', error);
  }
}

/**
 * 清空本地搜索历史
 */
export function clearLocalSearchHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 获取匹配的本地历史
 */
export function getMatchingLocalHistory(query: string, limit = 5): string[] {
  const history = getLocalSearchHistory();
  const lowerQuery = query.toLowerCase();
  return history
    .filter((h) => h.toLowerCase().includes(lowerQuery))
    .slice(0, limit);
}
