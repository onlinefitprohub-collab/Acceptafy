import { useState } from 'react';
import type { FollowUpGoal } from '../types';

interface FollowUpGeneratorProps {
  onGenerate: (goal: FollowUpGoal, context: string) => void;
  isGenerating: boolean;
}

export const FollowUpGenerator: React.FC<FollowUpGeneratorProps> = ({ onGenerate, isGenerating }) => {
  const [selectedGoal, setSelectedGoal] = useState<FollowUpGoal>('reminder');
  const [context, setContext] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);

  const goals: { id: FollowUpGoal; label: string; description: string }[] = [
    { id: 'reminder', label: 'Gentle Reminder', description: 'Politely nudge the recipient to take action' },
    { id: 'discount', label: 'Offer Discount', description: 'Re-engage with a special offer or incentive' },
    { id: 'query', label: 'Address Query', description: 'Respond to a specific question or concern' },
    { id: 'sequence', label: 'Full Sequence', description: 'Generate a 10-email follow-up sequence' },
  ];

  const handleGenerate = () => {
    onGenerate(selectedGoal, context);
  };

  return (
    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Generate Follow-Up
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => {
              setSelectedGoal(goal.id);
              setShowContextInput(goal.id === 'query');
            }}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedGoal === goal.id
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
            data-testid={`button-goal-${goal.id}`}
          >
            <div className="font-semibold text-sm">{goal.label}</div>
            <div className="text-xs opacity-70 mt-1">{goal.description}</div>
          </button>
        ))}
      </div>

      {showContextInput && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Query Context</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="What specific question or concern should the follow-up address?"
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
            rows={3}
            data-testid="input-followup-context"
          />
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        data-testid="button-generate-followup"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate {selectedGoal === 'sequence' ? 'Sequence' : 'Follow-Up'}
          </>
        )}
      </button>
    </div>
  );
};
