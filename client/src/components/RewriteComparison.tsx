import type { GradingResult, RewrittenEmail } from '../types';

interface RewriteComparisonProps {
  originalContent: { body: string; variations: { subject: string; previewText: string }[] };
  rewrittenContent: RewrittenEmail;
  originalResult: GradingResult;
  rewrittenResult: GradingResult;
  onAccept: () => void;
  onDiscard: () => void;
}

const getGradeColor = (grade: string) => {
  if (grade.startsWith('A')) return 'text-green-400';
  if (grade.startsWith('B')) return 'text-yellow-400';
  if (grade.startsWith('C')) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
};

export const RewriteComparison: React.FC<RewriteComparisonProps> = ({
  originalContent,
  rewrittenContent,
  originalResult,
  rewrittenResult,
  onAccept,
  onDiscard
}) => {
  const scoreDiff = rewrittenResult.inboxPlacementScore.score - originalResult.inboxPlacementScore.score;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Rewrite Comparison</h2>
        <p className="text-gray-400">Compare the original and AI-rewritten versions side by side</p>
      </div>

      <div className="flex items-center justify-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">Original Score</div>
          <div className={`text-3xl font-bold ${getScoreColor(originalResult.inboxPlacementScore.score)}`}>
            {originalResult.inboxPlacementScore.score}
          </div>
        </div>
        <div className="text-4xl text-gray-600">→</div>
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">New Score</div>
          <div className={`text-3xl font-bold ${getScoreColor(rewrittenResult.inboxPlacementScore.score)}`}>
            {rewrittenResult.inboxPlacementScore.score}
          </div>
        </div>
        {scoreDiff !== 0 && (
          <div className={`text-lg font-semibold ${scoreDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
            ({scoreDiff > 0 ? '+' : ''}{scoreDiff})
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-400">Original</h3>
            <span className={`text-2xl font-bold ${getGradeColor(originalResult.overallGrade.grade)}`}>
              {originalResult.overallGrade.grade}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Subject</div>
              <div className="text-gray-300">{originalContent.variations[0]?.subject}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Preview</div>
              <div className="text-gray-300">{originalContent.variations[0]?.previewText}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Body</div>
              <div className="text-gray-300 whitespace-pre-wrap text-sm max-h-48 overflow-y-auto">
                {originalContent.body}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-500/10 p-6 rounded-xl border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-300">Rewritten</h3>
            <span className={`text-2xl font-bold ${getGradeColor(rewrittenResult.overallGrade.grade)}`}>
              {rewrittenResult.overallGrade.grade}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">Subject</div>
              <div className="text-gray-200">{rewrittenContent.subject}</div>
            </div>
            <div>
              <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">Preview</div>
              <div className="text-gray-200">{rewrittenContent.previewText}</div>
            </div>
            <div>
              <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">Body</div>
              <div className="text-gray-200 whitespace-pre-wrap text-sm max-h-48 overflow-y-auto">
                {rewrittenContent.body}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onDiscard}
          className="px-6 py-3 text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-semibold"
          data-testid="button-discard-rewrite"
        >
          Keep Original
        </button>
        <button
          onClick={onAccept}
          className="px-6 py-3 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          data-testid="button-accept-rewrite"
        >
          Use Rewritten Version
        </button>
      </div>
    </div>
  );
};
