import { useRef, useCallback } from 'react';
import type { SpamTrigger } from '../types';
import { Textarea } from '@/components/ui/textarea';

interface HighlightedTextareaProps {
    value: string;
    onChange: (e: { target: { value: string } }) => void;
    spamTriggers: SpamTrigger[];
    className?: string;
    placeholder?: string;
    disabled?: boolean;
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
    onChange,
    spamTriggers,
    className,
    placeholder,
    disabled,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    const getHighlightedHtml = useCallback(() => {
        const textValue = String(value || '');
        if (!textValue) return '&nbsp;';
        
        if (!spamTriggers || spamTriggers.length === 0) {
            return escapeHtml(textValue).replace(/\n/g, '<br>') + '<br>';
        }

        const triggerMap = new Map<string, SpamTrigger>();
        spamTriggers.forEach(trigger => {
            triggerMap.set(trigger.word.toLowerCase(), trigger);
        });

        const wordsToMatch = spamTriggers.map(t => escapeRegExp(t.word));
        if (wordsToMatch.length === 0) {
            return escapeHtml(textValue).replace(/\n/g, '<br>') + '<br>';
        }
        
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
            parts.push(`<mark style="background-color: ${bgColor}; color: inherit; border-radius: 3px; padding: 1px 2px;">${escapeHtml(matchedWord)}</mark>`);
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < textValue.length) {
            parts.push(escapeHtml(textValue.substring(lastIndex)));
        }
        
        return parts.join('').replace(/\n/g, '<br>') + '<br>';
    }, [value, spamTriggers]);

    const handleScroll = useCallback(() => {
        if (textareaRef.current && highlightRef.current) {
            highlightRef.current.scrollTop = textareaRef.current.scrollTop;
            highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange({ target: { value: e.target.value } });
    }, [onChange]);

    return (
        <div className={`relative ${className || ''}`}>
            <div
                ref={highlightRef}
                className="absolute inset-0 overflow-hidden pointer-events-none text-transparent px-3 py-2"
                style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                }}
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: getHighlightedHtml() }}
            />
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onScroll={handleScroll}
                placeholder={placeholder}
                disabled={disabled}
                className="relative bg-transparent resize-none w-full h-full"
                style={{
                    caretColor: 'currentColor',
                }}
                data-testid="textarea-email-body"
            />
        </div>
    );
};
