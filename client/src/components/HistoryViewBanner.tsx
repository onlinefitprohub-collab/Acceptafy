import { CloseIcon } from './icons/CategoryIcons';

interface HistoryViewBannerProps {
  date: string;
  onClose: () => void;
}

export const HistoryViewBanner: React.FC<HistoryViewBannerProps> = ({ date, onClose }) => {
  const formattedDate = new Date(date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="mb-6 p-4 bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-500 text-purple-700 dark:text-purple-200 rounded-lg flex items-center justify-between animate-fade-in" data-testid="history-view-banner">
      <p className="text-sm sm:text-base">
        You are viewing an analysis from <strong className="font-semibold text-purple-900 dark:text-white">{formattedDate}</strong>.
      </p>
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-1 text-sm font-semibold bg-purple-500/30 rounded-full hover:bg-purple-500/50 text-purple-900 dark:text-white transition-colors"
        data-testid="button-close-history-view"
      >
        <CloseIcon className="w-4 h-4" />
        <span>Close View</span>
      </button>
    </div>
  );
};
