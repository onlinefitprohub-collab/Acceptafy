import { AlertIcon, CloseIcon } from './icons/CategoryIcons';

interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

const isSafetyError = (message: string): boolean => {
    const keywords = ['safety', 'sensitive', 'violates', 'blocked'];
    return keywords.some(keyword => message.toLowerCase().includes(keyword));
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  const showSafetyLink = isSafetyError(message);
  
  return (
    <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-500 text-red-700 dark:text-red-200 rounded-lg flex flex-col sm:flex-row items-start justify-between gap-4 animate-fade-in" role="alert">
      <div className="flex items-start gap-3">
        <AlertIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
            <p><strong>Analysis Failed:</strong> {message}</p>
            {showSafetyLink && (
                <p className="mt-2">
                    For more details on content policies, you can review the{' '}
                    <a 
                        href="https://ai.google.dev/terms/prohibited_use_policy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-semibold underline hover:text-red-900 dark:hover:text-white"
                    >
                        Prohibited Use Policy
                    </a>.
                </p>
            )}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="p-1.5 text-red-600 dark:text-red-300 rounded-full hover:bg-red-500/30 transition-colors self-start sm:self-center flex-shrink-0"
        aria-label="Dismiss error message"
        data-testid="button-dismiss-error"
      >
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
