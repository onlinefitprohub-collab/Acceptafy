import { useState, useEffect } from 'react';

interface ResultsHubProps {
  scoreData: {
    score: number;
    summary: string;
  };
  gradeData: {
    grade: string;
    summary: string;
  };
  isComparison?: boolean;
}

const getScoreVisualStyle = (score: number): { stroke: string; text: string; glow: string } => {
  if (score >= 80) {
    return { 
      stroke: 'stroke-green-400', 
      text: 'text-green-300', 
      glow: 'bg-glow-green' 
    };
  }
  if (score >= 50) {
    return { 
      stroke: 'stroke-yellow-400', 
      text: 'text-yellow-300', 
      glow: 'bg-glow-yellow' 
    };
  }
  return { 
    stroke: 'stroke-red-400', 
    text: 'text-red-300', 
    glow: 'bg-glow-red' 
  };
};

const getGamifiedGradeTitle = (grade: string): string => {
    grade = grade.toUpperCase();
    if (grade.startsWith('A+')) return "Inbox Legend";
    if (grade.startsWith('A')) return "Deliverability Master";
    if (grade.startsWith('B')) return "Solid Performer";
    if (grade.startsWith('C')) return "Needs Some Polish";
    if (grade.startsWith('D') || grade.startsWith('F')) return "Spam Folder Risk";
    return "Overall Content Grade";
};

const useCountUp = (end: number, duration: number = 1000) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        let start = 0;
        const startTime = Date.now();
        
        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            setCount(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);

    }, [end, duration]);
    
    return count;
};

export const ResultsHub: React.FC<ResultsHubProps> = ({ scoreData, gradeData, isComparison = false }) => {
  const { stroke, text, glow } = getScoreVisualStyle(scoreData.score);
  const animatedScore = useCountUp(scoreData.score);
  const isExcellentScore = scoreData.score >= 90;
  const gradeTitle = getGamifiedGradeTitle(gradeData.grade);

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 sm:p-6 text-center transition-shadow duration-500 ${glow} ${isExcellentScore && !isComparison ? 'aurora-background shimmer-effect' : ''} animate-fade-in`} data-testid="results-hub">
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
        {/* Score Circle */}
        <div className="flex-shrink-0">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              <circle
                className="stroke-current text-gray-900/50"
                strokeWidth="10"
                fill="transparent"
                r="54"
                cx="60"
                cy="60"
              />
              <circle
                className={`transition-all duration-500 ease-out ${stroke}`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                fill="transparent"
                r="54"
                cx="60"
                cy="60"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${text}`}>
                <span className="text-4xl sm:text-5xl font-bold tracking-tighter" data-testid="text-inbox-score">{animatedScore}<span className="text-2xl sm:text-3xl">%</span></span>
            </div>
          </div>
          <h2 className="text-base sm:text-xl font-bold mt-2 text-white">Inbox Authority Score</h2>
        </div>
        
        {/* Summary Text */}
        <div className="text-center md:text-left max-w-md">
            <p className="text-lg text-gray-300 italic" data-testid="text-score-summary">"{scoreData.summary}"</p>
            <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-gray-400"><span className="font-semibold text-gray-200">{gradeTitle}:</span> <span className={`font-bold text-xl ${text}`} data-testid="text-overall-grade">{gradeData.grade}</span></p>
                <p className="text-gray-400 mt-1 italic text-sm" data-testid="text-grade-summary">"{gradeData.summary}"</p>
            </div>
        </div>

      </div>
    </div>
  );
};
