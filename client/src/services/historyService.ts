import type { HistoryItem, GradingResult } from '../types';

const HISTORY_KEY = 'inboxAuthorityHistory';
const MAX_HISTORY_ITEMS = 20;

// Transform database EmailAnalysis to HistoryItem format
function transformDbToHistoryItem(dbItem: any): HistoryItem {
  return {
    id: dbItem.id,
    date: dbItem.createdAt,
    content: {
      body: dbItem.body || '',
      variations: dbItem.variations || [],
    },
    result: dbItem.result as GradingResult,
  };
}

// Fetch history from API (for authenticated users)
export const fetchHistoryFromApi = async (): Promise<HistoryItem[]> => {
  try {
    const response = await fetch('/api/history', {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    const data = await response.json();
    return data.map(transformDbToHistoryItem);
  } catch (error) {
    console.error('Error fetching history from API:', error);
    return [];
  }
};

// Get history from localStorage (fallback for unauthenticated users)
export const getHistory = (): HistoryItem[] => {
  try {
    const h = localStorage.getItem(HISTORY_KEY);
    return h ? JSON.parse(h) : [];
  } catch {
    return [];
  }
};

// Save analysis to localStorage (for unauthenticated users only)
// Note: For authenticated users, the backend saves during grading
export const saveAnalysis = (content: any, result: GradingResult): HistoryItem[] => {
  const item: HistoryItem = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    content,
    result
  };
  let h = getHistory();
  h.unshift(item);
  if (h.length > MAX_HISTORY_ITEMS) h = h.slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  return h;
};

// Delete from localStorage (for unauthenticated users)
export const deleteHistoryItem = (id: string): HistoryItem[] => {
  const h = getHistory().filter(i => i.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  return h;
};

// Delete from API (for authenticated users)
export const deleteHistoryItemFromApi = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/history/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting history item:', error);
    return false;
  }
};

// Clear localStorage history
export const clearHistory = (): HistoryItem[] => {
  localStorage.removeItem(HISTORY_KEY);
  return [];
};

// Clear all history from API (for authenticated users)
export const clearHistoryFromApi = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/history', {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
};
