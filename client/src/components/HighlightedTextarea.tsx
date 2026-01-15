import { useCallback } from 'react';
import type { SpamTrigger } from '../types';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface HighlightedTextareaProps {
    value: string;
    onChange: (e: { target: { value: string } }) => void;
    spamTriggers: SpamTrigger[];
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

const getSeverityStyles = (severity: 'High' | 'Medium' | 'Low') => {
    switch (severity) {
        case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700';
        case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
        case 'Low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700';
        default: return 'bg-muted text-muted-foreground';
    }
};

export const HighlightedTextarea: React.FC<HighlightedTextareaProps> = ({
    value,
    onChange,
    spamTriggers,
    className,
    placeholder,
    disabled,
}) => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange({ target: { value: e.target.value } });
    }, [onChange]);

    // Get valid triggers with word/phrase
    const getWord = (t: SpamTrigger) => (t.word || t.phrase || '').trim();
    const validTriggers = spamTriggers?.filter(t => getWord(t).length > 0) || [];

    return (
        <div className={`space-y-2 ${className || ''}`}>
            <Textarea
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                className="resize-none w-full h-full min-h-[200px]"
                data-testid="textarea-email-body"
            />
            {validTriggers.length > 0 && (
                <div className="relative z-10 flex flex-wrap gap-2 p-3 mb-2 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Spam triggers found:</span>
                    </div>
                    {validTriggers.map((trigger, index) => (
                        <Badge 
                            key={index} 
                            variant="outline"
                            className={`${getSeverityStyles(trigger.severity)} border`}
                            title={trigger.reason}
                        >
                            {getWord(trigger)}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
};
