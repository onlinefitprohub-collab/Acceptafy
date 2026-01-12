import { useState } from 'react';
import type { HistoryItem } from '../types';
import { HistoryIcon, ChevronDownIcon, EyeIcon, UploadCloudIcon, TrashIcon } from './icons/CategoryIcons';

interface HistoryPanelProps {
  history: HistoryItem[];
  onView: (item: HistoryItem) => void;
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onView, onLoad, onDelete, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-card backdrop-blur-lg border border-border rounded-2xl shadow-lg mt-8" data-testid="history-panel">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left p-4 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl"
        aria-expanded={isExpanded}
        data-testid="button-toggle-history"
      >
        <div className="flex items-center gap-3">
          <span className="text-purple-500 dark:text-purple-400"><HistoryIcon /></span>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">Analysis History</h3>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm px-2 py-1 bg-muted/50 text-muted-foreground rounded-md">{history.length} saved</span>
            <ChevronDownIcon className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="pt-4 mt-4 border-t border-border">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Your graded emails will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {history.map((item, index) => {
                    const winner = item.result.subjectLineAnalysis?.find(v => v.isWinner) || item.result.subjectLineAnalysis?.[0];
                    const previousItem = history[index + 1];
                    let scoreDiff: number | null = null;
                    if (previousItem) {
                        scoreDiff = item.result.inboxPlacementScore.score - previousItem.result.inboxPlacementScore.score;
                    }

                    return (
                      <div key={item.id} className="bg-muted/50 p-3 rounded-lg border border-border flex items-center justify-between gap-4 animate-fade-in" data-testid={`history-item-${item.id}`}>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{winner?.subject || item.content.variations?.[0]?.subject || 'Untitled Analysis'}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                                <span>{formatDate(item.date)}</span>
                                <span className="w-1 h-1 bg-muted-foreground/50 rounded-full"></span>
                                <span>Score: <b className="text-purple-600 dark:text-purple-300">{item.result.inboxPlacementScore.score}</b></span>
                                
                                {scoreDiff !== null && scoreDiff !== 0 && (
                                    <span className={`flex items-center font-bold ${scoreDiff > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                        {scoreDiff > 0 ? '▲' : '▼'} {Math.abs(scoreDiff)}
                                    </span>
                                )}

                                <span className="w-1 h-1 bg-muted-foreground/50 rounded-full"></span>
                                <span>Grade: <b className="text-purple-600 dark:text-purple-300">{item.result.overallGrade.grade}</b></span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                           <button onClick={() => onView(item)} title="View Report" className="p-2 text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400 transition-colors rounded-full hover:bg-muted" data-testid={`button-view-history-${item.id}`}>
                                <EyeIcon className="w-5 h-5" />
                           </button>
                           <button onClick={() => onLoad(item)} title="Load into Editor" className="p-2 text-muted-foreground hover:text-green-500 dark:hover:text-green-400 transition-colors rounded-full hover:bg-muted" data-testid={`button-load-history-${item.id}`}>
                                <UploadCloudIcon className="w-5 h-5" />
                           </button>
                           <button onClick={() => onDelete(item.id)} title="Delete" className="p-2 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-muted" data-testid={`button-delete-history-${item.id}`}>
                                <TrashIcon className="w-5 h-5" />
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {history.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex justify-end">
                    <button onClick={onClear} className="text-sm text-red-600 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400 hover:underline" data-testid="button-clear-history">
                        Clear All History
                    </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
