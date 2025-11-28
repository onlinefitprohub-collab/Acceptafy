import { useState } from 'react';
import { HighlightedTextarea } from './HighlightedTextarea';
import { HighlightedInput } from './HighlightedInput';
import { ChevronDownIcon, AlertIcon, TrashIcon } from './icons/CategoryIcons';
import type { SpamTrigger, EmailVariation } from '../types';

interface EmailInputProps {
  variations: EmailVariation[];
  setVariations: (variations: EmailVariation[]) => void;
  body: string;
  setBody: (body: string) => void;
  onGrade: () => void;
  isLoading: boolean;
  spamTriggers: SpamTrigger[];
}

export const EmailInput: React.FC<EmailInputProps> = ({ 
  variations, 
  setVariations, 
  body, 
  setBody, 
  onGrade, 
  isLoading, 
  spamTriggers 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const addVariation = () => {
    setVariations([...variations, { subject: '', previewText: '' }]);
  };

  const removeVariation = (index: number) => {
    if (variations.length > 1) {
      const newVariations = variations.filter((_, i) => i !== index);
      setVariations(newVariations);
    }
  };

  const handleChange = (index: number, field: 'subject' | 'previewText', value: string) => {
    const newVariations = [...variations];
    newVariations[index][field] = value;
    setVariations(newVariations);
  };

  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Email Editor</h2>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          data-testid="button-toggle-editor"
        >
          <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Subject Line Variations</h3>
              <button 
                onClick={addVariation}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                data-testid="button-add-variation"
              >
                + Add Variation
              </button>
            </div>

            {variations.map((variation, index) => (
              <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Variation {index + 1}</span>
                  {variations.length > 1 && (
                    <button 
                      onClick={() => removeVariation(index)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      data-testid={`button-remove-variation-${index}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <HighlightedInput 
                  value={variation.subject} 
                  onChange={(e) => handleChange(index, 'subject', e.target.value)} 
                  spamTriggers={spamTriggers} 
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500" 
                  placeholder="Subject Line" 
                />
                <HighlightedInput 
                  value={variation.previewText} 
                  onChange={(e) => handleChange(index, 'previewText', e.target.value)} 
                  spamTriggers={spamTriggers} 
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500" 
                  placeholder="Preview Text" 
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Email Body</h3>
            <HighlightedTextarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              spamTriggers={spamTriggers} 
              className="w-full h-64 bg-gray-900/50 p-4 rounded-lg text-white border border-gray-600 placeholder-gray-500" 
              placeholder="Write your email body here..."
            />
          </div>

          {spamTriggers.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertIcon className="w-5 h-5 text-red-400" />
                <span className="text-red-300 font-semibold">Spam Triggers Detected</span>
              </div>
              <p className="text-sm text-gray-400">
                {spamTriggers.length} potential spam trigger{spamTriggers.length > 1 ? 's' : ''} found in your email.
              </p>
            </div>
          )}

          <button 
            onClick={onGrade} 
            disabled={isLoading || (!body.trim() && !variations.some(v => v.subject.trim()))}
            className="w-full py-4 btn-gradient-purple rounded-xl font-bold text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-grade-email"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing Your Email...
              </span>
            ) : (
              'Grade My Email'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
