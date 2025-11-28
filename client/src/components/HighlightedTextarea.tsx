import type { SpamTrigger } from '../types';

interface HighlightedTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  spamTriggers: SpamTrigger[];
  className?: string;
  placeholder?: string;
}

export const HighlightedTextarea: React.FC<HighlightedTextareaProps> = ({ 
  value, 
  spamTriggers, 
  className, 
  ...props 
}) => {
  return (
    <textarea 
      value={value} 
      className={`${className} input-glow-focus input-inset-shadow outline-none transition-all resize-none`}
      data-testid="textarea-email-body"
      {...props} 
    />
  );
};
