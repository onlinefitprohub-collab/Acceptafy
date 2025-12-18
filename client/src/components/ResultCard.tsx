import { useState } from 'react';
import type { SectionGrade } from '../types';
import { ChevronDownIcon } from './icons/CategoryIcons';
import { InfoTooltip } from './InfoTooltip';

interface ResultCardProps {
  title: string;
  icon: React.ReactNode;
  gradeData: SectionGrade;
  tooltipText: string;
}

const getGradeTextColor = (grade: string): string => {
  if (grade.startsWith('A') || grade.startsWith('B')) return 'text-green-400';
  if (grade.startsWith('C')) return 'text-yellow-400';
  return 'text-red-400';
};

const gradeToPercentage = (grade: string): { percent: number; color: string; trackColor: string; } => {
    grade = grade.toUpperCase();
    if (grade.startsWith('A+')) return { percent: 100, color: 'bg-green-400', trackColor: 'bg-green-900/50' };
    if (grade.startsWith('A')) return { percent: 90, color: 'bg-green-400', trackColor: 'bg-green-900/50' };
    if (grade.startsWith('B')) return { percent: 75, color: 'bg-yellow-400', trackColor: 'bg-yellow-900/50' };
    if (grade.startsWith('C')) return { percent: 50, color: 'bg-yellow-400', trackColor: 'bg-yellow-900/50' };
    if (grade.startsWith('D')) return { percent: 25, color: 'bg-red-400', trackColor: 'bg-red-900/50' };
    return { percent: 10, color: 'bg-red-400', trackColor: 'bg-red-900/50' };
};

export const ResultCard: React.FC<ResultCardProps> = ({ title, icon, gradeData, tooltipText }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const gradeTextColor = getGradeTextColor(gradeData.grade);
  const { percent, color, trackColor } = gradeToPercentage(gradeData.grade);
  const uniqueId = `feedback-${title.replace(/\s+/g, '-')}`;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-lg transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-md"
        aria-expanded={isExpanded}
        aria-controls={uniqueId}
        data-testid={`button-expand-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-purple-600 dark:text-purple-400">{icon}</span>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h3>
          <InfoTooltip text={tooltipText} />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className={`text-lg sm:text-xl font-bold ${gradeTextColor}`} data-testid={`text-grade-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {gradeData.grade}
            </span>
            <div className={`w-20 h-2 rounded-full ${trackColor}`}>
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${percent}%` }}></div>
            </div>
          </div>
          <ChevronDownIcon className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <p className="text-muted-foreground italic my-4" data-testid={`text-summary-${title.toLowerCase().replace(/\s+/g, '-')}`}>"{gradeData.summary}"</p>

      <div
        id={uniqueId}
        className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-foreground mb-2">Detailed Feedback:</h4>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              {(gradeData.feedback || []).map((item, index) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
