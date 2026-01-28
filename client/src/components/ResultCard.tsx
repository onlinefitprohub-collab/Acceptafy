import { useState } from 'react';
import type { SectionGrade } from '../types';
import { ChevronDownIcon } from './icons/CategoryIcons';
import { InfoTooltip } from './InfoTooltip';
import { Check, AlertTriangle, Lightbulb } from 'lucide-react';

// Parse a long summary into structured sections
const parseSummaryIntoSections = (summary: string): { strengths: string[]; improvements: string[]; notes: string[] } => {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const notes: string[] = [];

  // Split by sentence endings, handling multiple punctuation types
  const sentences = summary
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    // Identify strengths (positive indicators)
    if (
      lower.includes('good') ||
      lower.includes('effective') ||
      lower.includes('strong') ||
      lower.includes('clear') ||
      lower.includes('appropriate') ||
      lower.includes('avoids') ||
      lower.includes('plus') ||
      lower.includes('main strength') ||
      lower.includes('intriguing') ||
      lower.includes('suggests value')
    ) {
      strengths.push(sentence);
    }
    // Identify areas for improvement (negative indicators)
    else if (
      lower.includes('could') ||
      lower.includes('should') ||
      lower.includes('but') ||
      lower.includes('however') ||
      lower.includes('missing') ||
      lower.includes('not personalized') ||
      lower.includes('might not') ||
      lower.includes('leaves a gap') ||
      lower.includes('improve')
    ) {
      improvements.push(sentence);
    }
    // Everything else goes to notes
    else {
      notes.push(sentence);
    }
  });

  return { strengths, improvements, notes };
};

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
  
  // Handle undefined gradeData gracefully
  if (!gradeData || !gradeData.grade) {
    return null;
  }
  
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

      {/* Structured Summary Display */}
      <div className="my-4 space-y-3" data-testid={`text-summary-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        {(() => {
          const { strengths, improvements, notes } = parseSummaryIntoSections(gradeData.summary);
          const hasStructure = strengths.length > 0 || improvements.length > 0;
          
          if (!hasStructure) {
            // Fallback to simple display for short summaries
            return <p className="text-muted-foreground italic">"{gradeData.summary}"</p>;
          }
          
          return (
            <div className="space-y-3">
              {strengths.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span>Strengths</span>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {strengths.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground list-disc">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {improvements.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Areas for Improvement</span>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {improvements.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground list-disc">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {notes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                    <Lightbulb className="w-4 h-4" />
                    <span>Notes</span>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {notes.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground list-disc">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}
      </div>

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
