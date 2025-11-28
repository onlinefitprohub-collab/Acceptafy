interface HistoryViewBannerProps {
  date: string;
  onClose: () => void;
}

export const HistoryViewBanner: React.FC<HistoryViewBannerProps> = ({ date, onClose }) => {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-purple-300 text-sm">
          Viewing analysis from <span className="font-semibold">{formattedDate}</span>
        </span>
      </div>
      <button 
        onClick={onClose}
        className="px-3 py-1.5 text-sm font-medium text-purple-300 bg-purple-500/20 rounded-full hover:bg-purple-500/30 transition-colors"
      >
        Close
      </button>
    </div>
  );
};
