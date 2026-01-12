import { useState } from 'react';
import { InfoIcon } from './icons/CategoryIcons';

interface InfoTooltipProps {
  text: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="text-gray-400 hover:text-purple-400 transition-colors"
        aria-label="More information"
        data-testid="button-info-tooltip"
      >
        <InfoIcon className="w-4 h-4" />
      </button>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-popover border border-border rounded-lg shadow-xl text-sm text-popover-foreground animate-fade-in">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover"></div>
        </div>
      )}
    </div>
  );
};
