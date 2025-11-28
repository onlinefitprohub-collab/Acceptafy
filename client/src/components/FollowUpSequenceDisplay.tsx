import type { FollowUpSequenceEmail } from '../types';

interface FollowUpSequenceDisplayProps {
  sequence: FollowUpSequenceEmail[];
  onLoad: (email: FollowUpSequenceEmail) => void;
  onDismiss: () => void;
}

export const FollowUpSequenceDisplay: React.FC<FollowUpSequenceDisplayProps> = ({ 
  sequence, 
  onLoad, 
  onDismiss 
}) => {
  return (
    <div className="bg-purple-500/10 p-6 rounded-xl border border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          10-Email Follow-Up Sequence
        </h3>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white transition-colors"
          data-testid="button-dismiss-sequence"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {sequence.map((email, index) => (
          <div 
            key={index}
            className="bg-white/5 p-4 rounded-lg border border-white/10"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-500/30 text-purple-300 text-xs font-semibold px-2 py-1 rounded">
                    {email.timingSuggestion}
                  </span>
                  <span className="text-white font-medium truncate">{email.subject}</span>
                </div>
                <p className="text-sm text-gray-400 italic mb-2">{email.rationale}</p>
                <div className="text-gray-300 text-sm whitespace-pre-wrap line-clamp-3">
                  {email.body}
                </div>
              </div>
              <button
                onClick={() => onLoad(email)}
                className="flex-shrink-0 p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-colors"
                title="Load into editor"
                data-testid={`button-load-sequence-${index}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
