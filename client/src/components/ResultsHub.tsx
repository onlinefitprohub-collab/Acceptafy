import { GmailIcon, OutlookIcon, AppleMailIcon } from './icons/CategoryIcons';
import type { GradingResult } from '../types';

interface ResultsHubProps {
  scoreData: { score: number; summary: string };
  gradeData: { grade: string; summary: string };
  inboxPrediction?: GradingResult['inboxPlacementPrediction'];
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
};

const getGlowClass = (score: number) => {
  if (score >= 80) return 'bg-glow-green';
  if (score >= 60) return 'bg-glow-yellow';
  return 'bg-glow-red';
};

const getGradeColor = (grade: string) => {
  if (grade.startsWith('A')) return 'text-green-400';
  if (grade.startsWith('B')) return 'text-yellow-400';
  if (grade.startsWith('C')) return 'text-orange-400';
  return 'text-red-400';
};

const getPlacementColor = (placement: string) => {
  const good = ['Primary', 'Focused', 'Inbox'];
  const bad = ['Spam', 'Junk'];
  if (good.includes(placement)) return 'text-green-400';
  if (bad.includes(placement)) return 'text-red-400';
  return 'text-yellow-400';
};

export const ResultsHub: React.FC<ResultsHubProps> = ({ scoreData, gradeData, inboxPrediction }) => {
  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 animate-scale-in">
      <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
        <div className={`text-center p-6 rounded-xl ${getGlowClass(scoreData.score)}`}>
          <div className={`text-6xl font-bold ${getScoreColor(scoreData.score)}`} data-testid="text-inbox-score">
            {scoreData.score}
          </div>
          <div className="text-gray-400 text-sm mt-1">Inbox Placement Score</div>
        </div>

        <div className="text-center p-6">
          <div className={`text-6xl font-bold ${getGradeColor(gradeData.grade)}`} data-testid="text-overall-grade">
            {gradeData.grade}
          </div>
          <div className="text-gray-400 text-sm mt-1">Overall Grade</div>
        </div>

        <div className="text-gray-300 italic max-w-md text-center lg:text-left">
          <p data-testid="text-grade-summary">{gradeData.summary}</p>
        </div>
      </div>

      {inboxPrediction && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-4 text-center">
            Inbox Placement Prediction
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <GmailIcon className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-white">Gmail</span>
              </div>
              <div className={`text-xl font-bold ${getPlacementColor(inboxPrediction.gmail.placement)}`}>
                {inboxPrediction.gmail.placement}
              </div>
              <p className="text-xs text-gray-400 mt-1">{inboxPrediction.gmail.reason}</p>
            </div>

            <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <OutlookIcon className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-white">Outlook</span>
              </div>
              <div className={`text-xl font-bold ${getPlacementColor(inboxPrediction.outlook.placement)}`}>
                {inboxPrediction.outlook.placement}
              </div>
              <p className="text-xs text-gray-400 mt-1">{inboxPrediction.outlook.reason}</p>
            </div>

            <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AppleMailIcon className="w-5 h-5 text-gray-400" />
                <span className="font-semibold text-white">Apple Mail</span>
              </div>
              <div className={`text-xl font-bold ${getPlacementColor(inboxPrediction.appleMail.placement)}`}>
                {inboxPrediction.appleMail.placement}
              </div>
              <p className="text-xs text-gray-400 mt-1">{inboxPrediction.appleMail.reason}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
