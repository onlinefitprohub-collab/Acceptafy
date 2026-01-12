import { useState } from 'react';
import type { FollowUpEmail } from '../types';
import { CopyIcon, CheckIcon, UploadCloudIcon } from './icons/CategoryIcons';

interface FollowUpDisplayProps {
  followUp: FollowUpEmail;
  onLoad: (followUp: FollowUpEmail) => void;
  onDiscard: () => void;
}

const useCopyToClipboard = (): [boolean, (text: string) => void] => {
    const [isCopied, setIsCopied] = useState(false);

    const copy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        });
    };

    return [isCopied, copy];
};

export const FollowUpDisplay: React.FC<FollowUpDisplayProps> = ({ followUp, onLoad, onDiscard }) => {
    const [isSubjectCopied, copySubject] = useCopyToClipboard();
    const [isBodyCopied, copyBody] = useCopyToClipboard();

    return (
        <div className="my-8 p-4 sm:p-6 bg-indigo-900/30 rounded-xl border border-indigo-500/50 animate-fade-in shadow-lg" data-testid="followup-display">
            <h3 className="text-xl font-bold text-indigo-300 mb-4">Generated Follow-up</h3>
            
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-300">Subject</label>
                        <button 
                            onClick={() => copySubject(followUp.subject)}
                            className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full transition-colors ${isSubjectCopied ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                            data-testid="button-copy-subject"
                        >
                            {isSubjectCopied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                            <span>{isSubjectCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>
                    <p className="p-3 bg-muted/50 rounded-lg text-foreground border border-border">{followUp.subject}</p>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-muted-foreground">Body</label>
                         <button 
                            onClick={() => copyBody(followUp.body)}
                            className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full transition-colors ${isBodyCopied ? 'bg-green-500/20 text-green-400 dark:text-green-300' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                            data-testid="button-copy-body"
                        >
                            {isBodyCopied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                            <span>{isBodyCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>
                    <div className="p-3 h-48 overflow-y-auto bg-muted/50 rounded-lg text-muted-foreground border border-border whitespace-pre-wrap font-sans text-sm">
                        {followUp.body}
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6 pt-4 border-t border-indigo-500/30">
                <button
                    onClick={onDiscard}
                    className="px-5 py-2 text-sm font-semibold bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                    data-testid="button-discard-followup"
                >
                    Discard
                </button>
                <button
                    onClick={() => onLoad(followUp)}
                    className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-[0_0_10px_rgba(129,140,248,0.4)]"
                    data-testid="button-load-followup"
                >
                    <UploadCloudIcon className="w-5 h-5" />
                    <span>Load into Editor</span>
                </button>
            </div>
        </div>
    );
};
