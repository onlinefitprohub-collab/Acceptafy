import { useCallback } from 'react';
import type { SpamTrigger } from '../types';
import { Textarea } from '@/components/ui/textarea';

interface HighlightedTextareaProps {
    value: string;
    onChange: (e: { target: { value: string } }) => void;
    spamTriggers?: SpamTrigger[];
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

export const HighlightedTextarea: React.FC<HighlightedTextareaProps> = ({
    value,
    onChange,
    className,
    placeholder,
    disabled,
}) => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange({ target: { value: e.target.value } });
    }, [onChange]);

    return (
        <Textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`resize-none w-full h-full min-h-[200px] ${className || ''}`}
            data-testid="textarea-email-body"
        />
    );
};
