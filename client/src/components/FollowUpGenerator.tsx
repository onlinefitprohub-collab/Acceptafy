import { useState } from 'react';
import type { FollowUpGoal } from '../types';
import { FollowUpIcon } from './icons/CategoryIcons';

interface FollowUpGeneratorProps {
  onGenerate: (goal: FollowUpGoal, context: string) => void;
  isGenerating: boolean;
  isRewriting: boolean;
}

const SEQUENCE_TYPES = [
  'sequence', 'nurture', 'welcome', 're-engagement', 'launch', 
  'book-a-call', 'abandoned-cart', 'webinar', 'testimonial', 'upsell', 'survey'
];

const getSequencePlaceholder = (goal: string): string => {
  const placeholders: Record<string, string> = {
    'sequence': 'Enter the main goal of the sequence (e.g., convert trial users)',
    'nurture': 'Describe your audience and desired outcome (e.g., educate leads about product benefits)',
    'welcome': 'Describe what new subscribers should learn (e.g., onboard new SaaS users)',
    're-engagement': 'Describe inactive segment to re-activate (e.g., users who haven\'t logged in for 30 days)',
    'launch': 'Describe the product/feature being launched (e.g., new course on email marketing)',
    'book-a-call': 'Describe the call offer and target audience (e.g., free strategy session for agency leads)',
    'abandoned-cart': 'Describe the product type and urgency (e.g., e-commerce fashion items)',
    'webinar': 'Describe the webinar topic and registration goal (e.g., live training on deliverability)',
    'testimonial': 'Describe when to request reviews (e.g., 30 days after purchase)',
    'upsell': 'Describe the upsell offer (e.g., upgrade from basic to premium plan)',
    'survey': 'Describe feedback goal (e.g., NPS survey after onboarding)',
  };
  return placeholders[goal] || 'Enter the sequence goal...';
};

export const FollowUpGenerator: React.FC<FollowUpGeneratorProps> = ({ onGenerate, isGenerating, isRewriting }) => {
  const [goal, setGoal] = useState<FollowUpGoal>('reminder');
  const [context, setContext] = useState('');
  const [sequenceGoal, setSequenceGoal] = useState('');

  const isSequenceType = SEQUENCE_TYPES.includes(goal);

  const handleGenerateClick = () => {
    onGenerate(goal, isSequenceType ? sequenceGoal : context);
  };

  const isDisabled = isGenerating || isRewriting;
  const isButtonDisabled = isDisabled || (goal === 'query' && !context.trim()) || (isSequenceType && !sequenceGoal.trim());
  

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4" data-testid="followup-generator">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
        <div className="flex items-center gap-2 w-full sm:w-80 flex-shrink-0">
          <label htmlFor="followup-goal" className="text-sm font-medium text-gray-300 flex-shrink-0">Follow-up Goal:</label>
          <select
            id="followup-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value as FollowUpGoal)}
            disabled={isDisabled}
            className="bg-gray-900/50 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
            data-testid="select-followup-goal"
          >
            <optgroup label="Single Follow-Up">
              <option value="reminder">Gentle Reminder</option>
              <option value="discount">Offer Discount</option>
              <option value="query">Address a Query</option>
            </optgroup>
            <optgroup label="Email Sequences">
              <option value="sequence">Custom Sequence</option>
              <option value="nurture">Nurture Sequence</option>
              <option value="welcome">Welcome Sequence</option>
              <option value="re-engagement">Re-engagement Sequence</option>
              <option value="launch">Product Launch Sequence</option>
              <option value="book-a-call">Book a Call Sequence</option>
              <option value="abandoned-cart">Abandoned Cart Sequence</option>
              <option value="webinar">Webinar Sequence</option>
              <option value="testimonial">Testimonial Request Sequence</option>
              <option value="upsell">Upsell/Cross-sell Sequence</option>
              <option value="survey">Survey/Feedback Sequence</option>
            </optgroup>
          </select>
        </div>
        <div className="w-full sm:flex-1 transition-opacity duration-300 animate-fade-in">
            {goal === 'query' && (
                <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Enter recipient's query here..."
                    disabled={isDisabled}
                    className="bg-gray-900/50 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                    data-testid="input-query-context"
                />
            )}
            {isSequenceType && (
                 <input
                    type="text"
                    value={sequenceGoal}
                    onChange={(e) => setSequenceGoal(e.target.value)}
                    placeholder={getSequencePlaceholder(goal)}
                    disabled={isDisabled}
                    className="bg-gray-900/50 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                    data-testid="input-sequence-goal"
                />
            )}
        </div>
      </div>
      <button
        onClick={handleGenerateClick}
        disabled={isButtonDisabled}
        className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center gap-2 w-full sm:w-auto justify-center sm:min-w-72"
        data-testid="button-generate-followup"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <FollowUpIcon />
            <span>{isSequenceType ? 'Generate Sequence' : 'Generate Follow-up'}</span>
          </>
        )}
      </button>
    </div>
  );
};
