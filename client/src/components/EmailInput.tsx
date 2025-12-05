import { useState, useEffect } from 'react';
import type { SpamTrigger } from '../types';
import { HighlightedTextarea } from './HighlightedTextarea';
import { HighlightedInput } from './HighlightedInput';
import { ChevronDownIcon, AlertIcon } from './icons/CategoryIcons';

interface Variation {
  subject: string;
  previewText: string;
}

interface EmailInputProps {
  variations: Variation[];
  setVariations: React.Dispatch<React.SetStateAction<Variation[]>>;
  body: string;
  setBody: (value: string) => void;
  onGrade: () => void;
  isLoading: boolean;
  spamTriggers: SpamTrigger[];
}

const SUBJECT_CHAR_LIMIT = 100;
const PREVIEW_CHAR_LIMIT = 250;

export const EmailInput: React.FC<EmailInputProps> = ({
  variations,
  setVariations,
  body,
  setBody,
  onGrade,
  isLoading,
  spamTriggers,
}) => {
  const [openVariations, setOpenVariations] = useState<Set<number>>(new Set());

  useEffect(() => {
    setOpenVariations(new Set(variations.map((_, i) => i)));
  }, [variations.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGrade();
  };

  const handleVariationChange = (index: number, field: keyof Variation, value: string) => {
    const newVariations = [...variations];
    newVariations[index][field] = value;
    setVariations(newVariations);
  };

  const addVariation = () => {
    const newIndex = variations.length;
    setVariations([...variations, { subject: '', previewText: '' }]);
    setOpenVariations(prev => new Set(prev).add(newIndex));
  };

  const removeVariation = (index: number) => {
    const newVariations = variations.filter((_, i) => i !== index);
    setVariations(newVariations);
    setOpenVariations(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const toggleVariation = (index: number) => {
    setOpenVariations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 sm:p-6 rounded-2xl shadow-2xl space-y-6 animate-scale-in">
      
      {variations.map((variation, index) => {
        const isOpen = openVariations.has(index);
        const subjectLength = variation.subject.length;
        const isSubjectOverLimit = subjectLength > SUBJECT_CHAR_LIMIT;
        const previewLength = variation.previewText.length;
        const isPreviewOverLimit = previewLength > PREVIEW_CHAR_LIMIT;

        return (
          <div key={index} className="bg-white/5 rounded-lg border border-white/10 transition-all duration-300 hover:border-purple-500/50 hover:bg-white/10">
            <button
              type="button"
              onClick={() => toggleVariation(index)}
              aria-expanded={isOpen}
              className={`w-full flex justify-between items-center text-left p-4 transition-colors group ${isOpen ? 'rounded-t-lg bg-white/10' : 'rounded-lg'}`}
              data-testid={`button-toggle-variation-${index}`}
            >
              <p className="font-bold text-gray-300 group-hover:text-purple-300 transition-colors">
                {`Subject Variation ${index > 0 ? index + 1 : ''}`.trim()}
              </p>
              <div className="flex items-center gap-2">
                {variations.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVariation(index);
                    }}
                    className="text-gray-500 hover:text-red-400 rounded-full transition-colors p-1 z-10"
                    aria-label={`Remove Variation ${index + 1}`}
                    data-testid={`button-remove-variation-${index}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                )}
                <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="space-y-4 p-4 border-t border-white/10">
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                        <label htmlFor={`subject-${index}`} className="block text-sm font-medium text-gray-400">
                            Subject Line
                        </label>
                        <span className={`text-xs transition-colors ${isSubjectOverLimit ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                            {subjectLength} / {SUBJECT_CHAR_LIMIT}
                        </span>
                    </div>
                    <div className="relative">
                      <HighlightedInput
                        id={`subject-${index}`}
                        type="text"
                        value={variation.subject}
                        onChange={(e) => handleVariationChange(index, 'subject', e.target.value)}
                        placeholder="e.g., Big News! Our Summer Sale is Here!"
                        className={`w-full bg-gray-900 border rounded-lg focus:outline-none transition-all duration-300 input-inset-shadow ${isSubjectOverLimit ? 'border-red-500 ring-2 ring-red-500/50 animate-pulse-red-border' : 'border-white/20 focus:border-purple-500 input-glow-focus'}`}
                        disabled={isLoading}
                        spamTriggers={spamTriggers}
                      />
                      {isSubjectOverLimit && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <AlertIcon className="h-5 w-5 text-red-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                        <label htmlFor={`preview-${index}`} className="block text-sm font-medium text-gray-400">
                          Preview Text
                        </label>
                        <span className={`text-xs transition-colors ${isPreviewOverLimit ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                            {previewLength} / {PREVIEW_CHAR_LIMIT}
                        </span>
                    </div>
                    <div className="relative">
                      <HighlightedInput
                        id={`preview-${index}`}
                        type="text"
                        value={variation.previewText}
                        onChange={(e) => handleVariationChange(index, 'previewText', e.target.value)}
                        placeholder="e.g., Don't miss out on guaranteed savings..."
                        className={`w-full bg-gray-900 border rounded-lg focus:outline-none transition-all duration-300 input-inset-shadow ${isPreviewOverLimit ? 'border-red-500 ring-2 ring-red-500/50 animate-pulse-red-border' : 'border-white/20 focus:border-purple-500 input-glow-focus'}`}
                        disabled={isLoading}
                        spamTriggers={spamTriggers}
                      />
                      {isPreviewOverLimit && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <AlertIcon className="h-5 w-5 text-red-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex justify-start">
        <button
          type="button"
          onClick={addVariation}
          disabled={isLoading}
          className="px-4 py-2 bg-white/10 text-gray-300 font-semibold rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-purple-500 hover:text-white transform hover:scale-105"
          data-testid="button-add-variation"
        >
          + Add Variation
        </button>
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-300 mb-2">
          Email Body
        </label>
        <HighlightedTextarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          spamTriggers={spamTriggers}
          disabled={isLoading}
          placeholder="Hi [Name]..."
          className="w-full h-64 bg-gray-900 border border-white/20 rounded-lg focus:outline-none transition-all duration-300 font-sans input-inset-shadow focus:border-purple-500 input-glow-focus"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 text-white font-bold rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 btn-gradient-purple"
          data-testid="button-grade-email"
        >
          {isLoading ? 'Analyzing...' : 'Grade My Email'}
        </button>
      </div>
    </form>
  );
};
