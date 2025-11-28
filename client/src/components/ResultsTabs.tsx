import { useState } from 'react';
import type { GradingResult, SpamTrigger, StructuralFinding } from '../types';

interface ResultsTabsProps {
  result: GradingResult;
  onSuggestionClick: (word: string, suggestion: string) => void;
  onQuickFix: (word: string, suggestion: string) => void;
  onFullRewrite: (original: string, newText: string) => void;
}

const tabs = [
  { id: 'grades', label: 'Section Grades' },
  { id: 'spam', label: 'Spam Triggers' },
  { id: 'structural', label: 'Structural Issues' },
  { id: 'ab-test', label: 'A/B Test' },
  { id: 'personalization', label: 'Personalization' },
  { id: 'links', label: 'Links' },
  { id: 'reply', label: 'Reply-ability' },
  { id: 'accessibility', label: 'Accessibility' },
];

const getGradeColor = (grade: string) => {
  if (grade.startsWith('A')) return 'text-green-400 border-green-500';
  if (grade.startsWith('B')) return 'text-yellow-400 border-yellow-500';
  if (grade.startsWith('C')) return 'text-orange-400 border-orange-500';
  return 'text-red-400 border-red-500';
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'High': return 'bg-red-500/20 border-red-500 text-red-300';
    case 'Medium': return 'bg-yellow-500/20 border-yellow-500 text-yellow-300';
    case 'Low': return 'bg-blue-500/20 border-blue-500 text-blue-300';
    default: return 'bg-gray-500/20 border-gray-500 text-gray-300';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Good': return 'text-green-400';
    case 'Warning': return 'text-yellow-400';
    case 'Bad': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

export const ResultsTabs: React.FC<ResultsTabsProps> = ({ 
  result, 
  onSuggestionClick,
  onQuickFix,
  onFullRewrite 
}) => {
  const [activeTab, setActiveTab] = useState('grades');

  const renderSectionGrade = (title: string, section: { grade: string; summary: string; feedback: string[] }) => (
    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white">{title}</h4>
        <span className={`text-2xl font-bold ${getGradeColor(section.grade)}`}>{section.grade}</span>
      </div>
      <p className="text-sm text-gray-300 mb-3">{section.summary}</p>
      {section.feedback && section.feedback.length > 0 && (
        <ul className="space-y-1">
          {section.feedback.map((item, i) => (
            <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderSpamTrigger = (trigger: SpamTrigger) => (
    <div key={trigger.word} className={`p-4 rounded-lg border ${getSeverityColor(trigger.severity)}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-white">"{trigger.word}"</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(trigger.severity)}`}>
              {trigger.severity}
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-2">{trigger.reason}</p>
          <div className="flex flex-wrap gap-2">
            {trigger.suggestions.slice(0, 5).map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(trigger.word, suggestion)}
                className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-gray-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => onQuickFix(trigger.word, trigger.suggestion)}
          className="flex-shrink-0 px-3 py-1.5 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
        >
          Quick Fix
        </button>
      </div>
    </div>
  );

  const renderStructuralFinding = (finding: StructuralFinding) => (
    <div key={finding.originalText} className={`p-4 rounded-lg border ${getSeverityColor(finding.severity)}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-white">{finding.type}</span>
        <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(finding.severity)}`}>
          {finding.severity}
        </span>
      </div>
      <p className="text-sm text-gray-300 mb-2">{finding.summary}</p>
      <div className="bg-white/5 p-2 rounded text-sm text-gray-400 italic mb-2">
        "{finding.originalText}"
      </div>
      <p className="text-xs text-gray-400">{finding.suggestion}</p>
    </div>
  );

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="flex overflow-x-auto border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'grades' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderSectionGrade('Subject Line', result.subjectLine)}
            {renderSectionGrade('Preview Text', result.previewText)}
            {renderSectionGrade('Body Copy', result.bodyCopy)}
            {renderSectionGrade('Call to Action', result.callToAction)}
          </div>
        )}

        {activeTab === 'spam' && (
          <div className="space-y-4">
            {result.spamAnalysis && result.spamAnalysis.length > 0 ? (
              result.spamAnalysis.map(renderSpamTrigger)
            ) : (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No spam triggers detected. Great job!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'structural' && (
          <div className="space-y-4">
            {result.structuralAnalysis && result.structuralAnalysis.length > 0 ? (
              result.structuralAnalysis.map(renderStructuralFinding)
            ) : (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No structural issues found. Well formatted!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ab-test' && (
          <div className="space-y-4">
            {result.subjectLineAnalysis?.map((variation, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${variation.isWinner ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{variation.subject}</span>
                    {variation.isWinner && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/30 text-green-300 rounded">Winner</span>
                    )}
                  </div>
                  <span className="text-2xl font-bold text-purple-400">{variation.predictionScore}</span>
                </div>
                <p className="text-sm text-gray-400">{variation.rationale}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'personalization' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-4xl font-bold text-purple-400">{result.personalizationScore?.score || 0}</div>
              <div>
                <div className="text-white font-semibold">Personalization Score</div>
                <div className="text-sm text-gray-400">{result.personalizationScore?.summary}</div>
              </div>
            </div>
            {result.personalizationScore?.feedback && result.personalizationScore.feedback.length > 0 && (
              <ul className="space-y-2">
                {result.personalizationScore.feedback.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-4">
            {result.linkAnalysis && result.linkAnalysis.length > 0 ? (
              result.linkAnalysis.map((link, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${getStatusColor(link.status)}`}>{link.status}</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-sm text-gray-400 truncate">{link.anchorText}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate mb-2">{link.url}</div>
                      <p className="text-sm text-gray-400">{link.reason}</p>
                      {link.suggestion && (
                        <p className="text-sm text-purple-400 mt-1">{link.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No links found in the email.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reply' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-4xl font-bold text-purple-400">{result.replyAbilityAnalysis?.score || 0}</div>
              <div>
                <div className="text-white font-semibold">Reply-Ability Score</div>
                <div className="text-sm text-gray-400">{result.replyAbilityAnalysis?.summary}</div>
              </div>
            </div>
            {result.replyAbilityAnalysis?.feedback && result.replyAbilityAnalysis.feedback.length > 0 && (
              <ul className="space-y-2">
                {result.replyAbilityAnalysis.feedback.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'accessibility' && (
          <div className="space-y-4">
            {result.accessibilityAnalysis && result.accessibilityAnalysis.length > 0 ? (
              result.accessibilityAnalysis.map((issue, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">{issue.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{issue.summary}</p>
                  <p className="text-xs text-gray-400">{issue.suggestion}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No accessibility issues detected!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
