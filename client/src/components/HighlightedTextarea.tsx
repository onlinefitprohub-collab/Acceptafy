import { useMemo, useRef, useEffect, useCallback } from 'react';
import type { SpamTrigger } from '../types';

interface HighlightedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    spamTriggers: SpamTrigger[];
}

const getSeverityColor = (severity: 'High' | 'Medium' | 'Low'): string => {
    switch (severity) {
        case 'High': return 'rgba(239, 68, 68, 0.4)';
        case 'Medium': return 'rgba(234, 179, 8, 0.4)';
        case 'Low': return 'rgba(59, 130, 246, 0.4)';
        default: return 'transparent';
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

export const HighlightedTextarea: React.FC<HighlightedTextareaProps> = ({
    value,
    spamTriggers,
    className,
    ...props
}) => {
    const backdropRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const highlightedHtml = useMemo(() => {
        const textValue = String(value || '');
        if (!spamTriggers || spamTriggers.length === 0 || !textValue) {
            return escapeHtml(textValue).replace(/\n/g, '\n') + '\u200b';
        }

        const triggerMap = new Map<string, SpamTrigger>();
        spamTriggers.forEach(trigger => {
            triggerMap.set(trigger.word.toLowerCase(), trigger);
        });

        const wordsToMatch = spamTriggers.map(t => escapeRegExp(t.word));
        if (wordsToMatch.length === 0) return escapeHtml(textValue) + '\u200b';
        
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
            const bgColor = trigger ? getSeverityColor(trigger.severity) : 'transparent';
            parts.push(`<mark style="background-color: ${bgColor}; color: transparent; border-radius: 3px;">${escapeHtml(matchedWord)}</mark>`);
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < textValue.length) {
            parts.push(escapeHtml(textValue.substring(lastIndex)));
        }
        
        return parts.join('') + '\u200b';
    }, [value, spamTriggers]);

    const syncScroll = useCallback(() => {
        if (backdropRef.current && textareaRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    }, []);
    
    useEffect(() => {
        syncScroll();
    }, [value, syncScroll]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.addEventListener('scroll', syncScroll);
            return () => textarea.removeEventListener('scroll', syncScroll);
        }
    }, [syncScroll]);

    const baseStyles: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        padding: '16px',
        margin: 0,
        border: 'none',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '24px',
        letterSpacing: 'normal',
        wordSpacing: 'normal',
        textAlign: 'left',
        textIndent: 0,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        boxSizing: 'border-box',
    };

    return (
        <div className={`relative ${className}`} style={{ overflow: 'hidden' }}>
            <div
                ref={backdropRef}
                aria-hidden="true"
                className="scrollbar-hide"
                style={{ 
                    ...baseStyles,
                    overflow: 'auto',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    color: 'transparent',
                    background: 'transparent',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                }}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
            <textarea
                ref={textareaRef}
                value={value}
                style={{
                    ...baseStyles,
                    position: 'relative',
                    overflow: 'auto',
                    background: 'transparent',
                    color: '#d1d5db',
                    caretColor: 'white',
                    resize: 'none',
                    outline: 'none',
                }}
                data-testid="textarea-highlighted"
                {...props}
            />
        </div>
    );
};
