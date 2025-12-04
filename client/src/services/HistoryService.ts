import type { HistoryItem, GradingResult } from '../types';

const HISTORY_KEY = 'inboxAuthorityHistory';
const MAX_HISTORY_ITEMS = 20;

export const getHistory = (): HistoryItem[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    if (!historyJson) return [];
    return JSON.parse(historyJson);
  } catch (error) {
    console.error("Failed to retrieve history:", error);
    return [];
  }
};

export const saveAnalysis = (
  content: { body: string; variations: { subject: string; previewText: string }[] },
  result: GradingResult
): HistoryItem[] => {
  try {
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content,
      result,
    };

    let history = getHistory();
    history.unshift(newHistoryItem);
    
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return history;
  } catch (error) {
    console.error("Failed to save analysis:", error);
    return getHistory();
  }
};

export const deleteHistoryItem = (id: string): HistoryItem[] => {
  try {
    let history = getHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
  } catch (error) {
    console.error("Failed to delete history item:", error);
    return getHistory();
  }
};

export const clearHistory = (): HistoryItem[] => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return [];
  } catch (error) {
    console.error("Failed to clear history:", error);
    return getHistory();
  }
};
