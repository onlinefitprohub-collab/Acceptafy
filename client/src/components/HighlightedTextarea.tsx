import { useMemo, useRef, useEffect, useCallback } from 'react';
import type { SpamTrigger } from '../types';

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
        case 'High': return 'rgba(239, 68, 68, 0.5)';
        case 'Medium': return 'rgba(234, 179, 8, 0.5)';
        case 'Low': return 'rgba(59, 130, 246, 0.5)';
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
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalUpdate = useRef(false);

    const highlightedHtml = useMemo(() => {
        const textValue = String(value || '');
        if (!textValue) return '';
        
        if (!spamTriggers || spamTriggers.length === 0) {
            return escapeHtml(textValue).replace(/\n/g, '<br>');
        }

        const triggerMap = new Map<string, SpamTrigger>();
        spamTriggers.forEach(trigger => {
            triggerMap.set(trigger.word.toLowerCase(), trigger);
        });

        const wordsToMatch = spamTriggers.map(t => escapeRegExp(t.word));
        if (wordsToMatch.length === 0) {
            return escapeHtml(textValue).replace(/\n/g, '<br>');
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
            parts.push(`<mark style="background-color: ${bgColor}; color: inherit; border-radius: 3px; padding: 0 2px;">${escapeHtml(matchedWord)}</mark>`);
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < textValue.length) {
            parts.push(escapeHtml(textValue.substring(lastIndex)));
        }
        
        return parts.join('').replace(/\n/g, '<br>');
    }, [value, spamTriggers]);

    const getTextFromHtml = useCallback((element: HTMLElement): string => {
        let text = '';
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            } else if (node.nodeName === 'BR') {
                text += '\n';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                text += getTextFromHtml(node as HTMLElement);
            }
        });
        return text;
    }, []);

    const handleInput = useCallback(() => {
        if (editorRef.current && !isInternalUpdate.current) {
            const newText = getTextFromHtml(editorRef.current);
            onChange({ target: { value: newText } });
        }
    }, [onChange, getTextFromHtml]);

    const saveCursorPosition = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !editorRef.current) return null;
        
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editorRef.current);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        return preCaretRange.toString().length;
    }, []);

    const restoreCursorPosition = useCallback((position: number | null) => {
        if (position === null || !editorRef.current) return;
        
        const selection = window.getSelection();
        if (!selection) return;

        let currentPos = 0;
        const range = document.createRange();
        
        const findPosition = (node: Node): boolean => {
            if (node.nodeType === Node.TEXT_NODE) {
                const textLength = node.textContent?.length || 0;
                if (currentPos + textLength >= position) {
                    range.setStart(node, position - currentPos);
                    range.setEnd(node, position - currentPos);
                    return true;
                }
                currentPos += textLength;
            } else if (node.nodeName === 'BR') {
                if (currentPos === position) {
                    range.setStartAfter(node);
                    range.setEndAfter(node);
                    return true;
                }
                currentPos += 1;
            } else {
                for (const child of Array.from(node.childNodes)) {
                    if (findPosition(child)) return true;
                }
            }
            return false;
        };

        if (findPosition(editorRef.current)) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }, []);

    useEffect(() => {
        if (editorRef.current) {
            const currentText = getTextFromHtml(editorRef.current);
            if (currentText !== value) {
                isInternalUpdate.current = true;
                const cursorPos = saveCursorPosition();
                editorRef.current.innerHTML = highlightedHtml || '<br>';
                restoreCursorPosition(cursorPos);
                isInternalUpdate.current = false;
            }
        }
    }, [highlightedHtml, value, getTextFromHtml, saveCursorPosition, restoreCursorPosition]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.execCommand('insertLineBreak');
        }
    }, []);

    return (
        <div className={`relative ${className || ''}`}>
            <div
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleInput}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className="w-full h-full overflow-auto outline-none text-foreground"
                style={{
                    padding: '16px',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    minHeight: '100%',
                }}
                data-testid="textarea-highlighted"
                data-placeholder={placeholder}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: highlightedHtml || '<br>' }}
            />
            {!value && placeholder && (
                <div 
                    className="absolute top-0 left-0 pointer-events-none text-muted-foreground"
                    style={{ padding: '16px' }}
                >
                    {placeholder}
                </div>
            )}
        </div>
    );
};
