import type { HistoryItem, GradingResult } from '../types';

const HISTORY_KEY = 'inboxAuthorityHistory';
const MAX_HISTORY_ITEMS = 20;

export const getHistory = (): HistoryItem[] => {
  try {
    const h = localStorage.getItem(HISTORY_KEY);
    return h ? JSON.parse(h) : [];
  } catch {
    return [];
  }
};

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

export const deleteHistoryItem = (id: string): HistoryItem[] => {
  const h = getHistory().filter(i => i.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  return h;
};

export const clearHistory = (): HistoryItem[] => {
  localStorage.removeItem(HISTORY_KEY);
  return [];
};
