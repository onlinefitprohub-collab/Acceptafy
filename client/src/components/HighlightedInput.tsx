import { useMemo, useRef, useEffect } from 'react';
import type { SpamTrigger } from '../types';

interface HighlightedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    spamTriggers: SpamTrigger[];
}

const getSeverityHighlightClass = (severity: 'High' | 'Medium' | 'Low'): string => {
    switch (severity) {
        case 'High': return 'bg-red-500/40';
        case 'Medium': return 'bg-yellow-500/40';
        case 'Low': return 'bg-blue-500/40';
        default: return '';
    }
};

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const escapeHtml = (unsafe: string) => 
    unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");

export const HighlightedInput: React.FC<HighlightedInputProps> = ({
    value,
    spamTriggers,
    className,
    ...props
}) => {
    const backdropRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const highlightedHtml = useMemo(() => {
        const textValue = String(value || '');
        if (!spamTriggers || spamTriggers.length === 0 || !textValue) {
            return escapeHtml(textValue);
        }

        const triggerMap = new Map<string, SpamTrigger>();
        spamTriggers.forEach(trigger => {
            triggerMap.set(trigger.word.toLowerCase(), trigger);
        });

        const wordsToMatch = spamTriggers.map(t => escapeRegExp(t.word));
        if (wordsToMatch.length === 0) return escapeHtml(textValue);
        
        const regex = new RegExp(`\\b(${wordsToMatch.join('|')})\\b`, 'gi');
        
        const parts: string[] = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(textValue)) !== null) {
            if (match.index > lastIndex) {
                parts.push(escapeHtml(textValue.substring(lastIndex, match.index)));
            }
            const matchedWord = match[0];
            const trigger = triggerMap.get(matchedWord.toLowerCase());
            const highlightClass = trigger ? getSeverityHighlightClass(trigger.severity) : '';
            parts.push(`<span class="rounded ${highlightClass}">${escapeHtml(matchedWord)}</span>`);
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < textValue.length) {
            parts.push(escapeHtml(textValue.substring(lastIndex)));
        }
        
        return parts.join('');
    }, [value, spamTriggers]);

    const handleScroll = () => {
        if (backdropRef.current && inputRef.current) {
            backdropRef.current.scrollLeft = inputRef.current.scrollLeft;
        }
    };
    
    useEffect(() => {
        handleScroll();
    }, [value]);

    const sharedStyles: React.CSSProperties = {
        fontFamily: 'inherit',
        fontSize: '16px',
        lineHeight: '1.5',
        letterSpacing: 'normal',
        wordSpacing: 'normal',
        padding: '12px',
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
    };

    return (
        <div className={`relative ${className}`} style={{ overflow: 'hidden' }}>
            <div
                ref={backdropRef}
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none text-transparent select-none overflow-auto scrollbar-hide flex items-center"
                style={{ 
                    ...sharedStyles,
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                }}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
            <input
                ref={inputRef}
                value={value}
                onScroll={handleScroll}
                className="w-full bg-transparent caret-foreground relative z-10 block text-foreground"
                style={sharedStyles}
                data-testid="input-highlighted"
                {...props}
            />
        </div>
    );
};
