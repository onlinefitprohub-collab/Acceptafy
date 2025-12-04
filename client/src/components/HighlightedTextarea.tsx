import type { SpamTrigger } from '../types';

interface HighlightedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  spamTriggers: SpamTrigger[];
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
      className={`${className || ''} outline-none transition-all resize-none`}
      data-testid="textarea-email-body"
      {...props} 
    />
  );
};
