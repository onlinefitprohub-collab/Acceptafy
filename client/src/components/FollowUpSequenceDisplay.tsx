import { useState } from 'react';
import type { FollowUpSequenceEmail } from '../types';
import { CopyIcon, CheckIcon, UploadCloudIcon, ChevronDownIcon } from './icons/CategoryIcons';

interface FollowUpSequenceDisplayProps {
  sequence: FollowUpSequenceEmail[];
  onLoad: (followUp: FollowUpSequenceEmail) => void;
  onDiscard: () => void;
}

const useCopyToClipboard = (): [string | null, (text: string, id: string) => void] => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copy = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        });
    };

    return [copiedId, copy];
};

const SequenceItem: React.FC<{
    item: FollowUpSequenceEmail,
    index: number,
    isOpen: boolean,
    onToggle: () => void,
    onLoad: (item: FollowUpSequenceEmail) => void,
}> = ({ item, index, isOpen, onToggle, onLoad }) => {
    const [copiedId, copy] = useCopyToClipboard();
    
    return (
        <div className="bg-muted/50 rounded-lg border border-border transition-all duration-300" data-testid={`sequence-item-${index}`}>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={isOpen}
              className={`w-full flex justify-between items-center text-left p-4 hover:bg-muted transition-colors group ${isOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
              data-testid={`button-toggle-sequence-${index}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-purple-500/30 text-purple-600 dark:text-purple-300 rounded-md px-2 py-1 flex-shrink-0">{item.timingSuggestion}</span>
                <p className="font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors text-sm sm:text-base truncate">
                    {index + 1}: {item.subject}
                </p>
              </div>
              <ChevronDownIcon className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} flex-shrink-0`} />
            </button>
            <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="p-4 border-t border-border space-y-4">
                    <div>
                        <h4 className="font-semibold text-muted-foreground text-sm mb-1">Purpose of this Email:</h4>
                        <p className="text-foreground text-sm italic">"{item.rationale}"</p>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-muted-foreground">Subject</label>
                            <button 
                                onClick={() => copy(item.subject, `subject-${index}`)}
                                className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full transition-colors ${copiedId === `subject-${index}` ? 'bg-green-500/20 text-green-400 dark:text-green-300' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                data-testid={`button-copy-subject-${index}`}
                            >
                                {copiedId === `subject-${index}` ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                                <span>{copiedId === `subject-${index}` ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>
                        <p className="p-2 bg-muted/50 rounded text-foreground border border-border text-sm">{item.subject}</p>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-muted-foreground">Body</label>
                             <button 
                                onClick={() => copy(item.body, `body-${index}`)}
                                className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full transition-colors ${copiedId === `body-${index}` ? 'bg-green-500/20 text-green-400 dark:text-green-300' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                data-testid={`button-copy-body-${index}`}
                            >
                                {copiedId === `body-${index}` ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                                <span>{copiedId === `body-${index}` ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>
                        <div className="p-2 h-40 overflow-y-auto bg-muted/50 rounded text-muted-foreground border border-border whitespace-pre-wrap font-sans text-xs">
                            {item.body}
                        </div>
                    </div>
                     <div className="flex justify-end">
                        <button
                            onClick={() => onLoad(item)}
                            className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            data-testid={`button-load-sequence-${index}`}
                        >
                            <UploadCloudIcon className="w-4 h-4" />
                            <span>Load into Editor</span>
                        </button>
                     </div>
                </div>
              </div>
            </div>
        </div>
    );
};


export const FollowUpSequenceDisplay: React.FC<FollowUpSequenceDisplayProps> = ({ sequence, onLoad, onDiscard }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleToggle = (index: number) => {
        setOpenIndex(prev => (prev === index ? null : index));
    };

    return (
        <div className="my-8 p-4 sm:p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-500/30 animate-fade-in shadow-lg" data-testid="followup-sequence-display">
            <h3 className="text-xl font-bold text-purple-700 dark:text-purple-300 mb-4">Generated 10-Email Sequence</h3>
            
            <div className="space-y-3">
                {sequence.map((item, index) => (
                    <SequenceItem 
                        key={index}
                        item={item}
                        index={index}
                        isOpen={openIndex === index}
                        onToggle={() => handleToggle(index)}
                        onLoad={onLoad}
                    />
                ))}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-purple-200 dark:border-purple-500/30">
                <button
                    onClick={onDiscard}
                    className="px-5 py-2 text-sm font-semibold bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                    data-testid="button-discard-sequence"
                >
                    Discard Sequence
                </button>
            </div>
        </div>
    );
};
