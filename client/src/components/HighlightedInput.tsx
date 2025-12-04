import type { SpamTrigger } from '../types';

interface HighlightedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  spamTriggers: SpamTrigger[];
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
      className={`${className || ''} outline-none transition-all`} 
      data-testid="input-email-field"
      {...props} 
    />
  );
};
