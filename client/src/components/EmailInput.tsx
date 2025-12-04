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
    <div className="bg-purple-900/30 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className="text-xl font-bold text-white">Subject Variation</h2>
        <button 
          className="p-2 text-gray-400 hover:text-white transition-colors"
          data-testid="button-toggle-editor"
        >
          <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-fade-in">
          {variations.map((variation, index) => (
            <div key={index} className="space-y-4">
              {variations.length > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase">Variation {index + 1}</span>
                  <button 
                    onClick={() => removeVariation(index)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    data-testid={`button-remove-variation-${index}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Subject Line</label>
                <div className="flex items-center justify-between">
                  <HighlightedInput 
                    value={variation.subject} 
                    onChange={(e) => handleChange(index, 'subject', e.target.value)} 
                    spamTriggers={spamTriggers} 
                    className="w-full bg-purple-950/60 border border-purple-500/30 rounded-lg p-3 text-white placeholder-gray-500 input-glow-focus" 
                    placeholder="Big News!" 
                  />
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{variation.subject.length} / 60</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Preview Text</label>
                <div className="flex items-center justify-between">
                  <HighlightedInput 
                    value={variation.previewText} 
                    onChange={(e) => handleChange(index, 'previewText', e.target.value)} 
                    spamTriggers={spamTriggers} 
                    className="w-full bg-purple-950/60 border border-purple-500/30 rounded-lg p-3 text-white placeholder-gray-500 input-glow-focus" 
                    placeholder="Our Summer Sale is Here!" 
                  />
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{variation.previewText.length} / 90</span>
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={addVariation}
            className="px-4 py-2 text-sm font-medium text-purple-300 bg-purple-800/40 rounded-lg hover:bg-purple-800/60 transition-colors border border-purple-500/30"
            data-testid="button-add-variation"
          >
            + Add Variation
          </button>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Email Body</label>
            <HighlightedTextarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              spamTriggers={spamTriggers} 
              className="w-full h-48 bg-purple-950/60 p-4 rounded-lg text-white border border-purple-500/30 placeholder-gray-500 input-glow-focus resize-none" 
              placeholder="Hi [Name],

Don't miss out on our biggest sale of the year. You can get up to 50% off on all our products. This is a limited time offer, so act now!

Click here to shop: https://example.com/sale

Thanks,
The Team"
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

          <div className="flex justify-end">
            <button 
              onClick={onGrade} 
              disabled={isLoading || (!body.trim() && !variations.some(v => v.subject.trim()))}
              className="px-8 py-3 btn-gradient-purple rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-grade-email"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Grade My Email'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
