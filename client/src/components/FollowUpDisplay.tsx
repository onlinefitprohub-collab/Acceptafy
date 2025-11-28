import type { FollowUpEmail } from '../types';

interface FollowUpDisplayProps {
  followUp: FollowUpEmail;
  onLoad: () => void;
  onDismiss: () => void;
}

export const FollowUpDisplay: React.FC<FollowUpDisplayProps> = ({ followUp, onLoad, onDismiss }) => {
  return (
    <div className="bg-purple-500/10 p-6 rounded-xl border border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
          Generated Follow-Up
        </h3>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white transition-colors"
          data-testid="button-dismiss-followup"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">Subject Line</div>
          <div className="text-white font-medium">{followUp.subject}</div>
        </div>
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">Email Body</div>
          <div className="text-gray-300 whitespace-pre-wrap text-sm bg-white/5 p-4 rounded-lg max-h-64 overflow-y-auto">
            {followUp.body}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onLoad}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          data-testid="button-load-followup"
        >
          Load into Editor
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(`Subject: ${followUp.subject}\n\n${followUp.body}`)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
          data-testid="button-copy-followup"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
