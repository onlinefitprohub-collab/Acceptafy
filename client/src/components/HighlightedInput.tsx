import type { SpamTrigger } from '../types';

interface HighlightedInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  spamTriggers: SpamTrigger[];
  className?: string;
  placeholder?: string;
}

export const HighlightedInput: React.FC<HighlightedInputProps> = ({ 
  value, 
  spamTriggers, 
  className, 
  ...props 
}) => {
  return (
    <input 
      value={value} 
      className={`${className} input-glow-focus input-inset-shadow outline-none transition-all`} 
      data-testid="input-email-field"
      {...props} 
    />
  );
};
