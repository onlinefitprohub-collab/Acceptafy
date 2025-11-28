// Re-export shared types to maintain backward compatibility
export type {
  SectionGrade,
  SpamTrigger,
  StructuralFinding,
  SubjectLineVariation,
  PersonalizationScore,
  LinkAnalysisFinding,
  ReplyAbilityAnalysis,
  PlainTextAnalysis,
  InboxPlacementPrediction,
  AccessibilityFinding,
  GradingResult,
  RewrittenEmail,
  FollowUpEmail,
  FollowUpSequenceEmail,
  DnsRecords,
  SentenceGrade,
  DomainHealth,
  ListQualityAnalysis,
  BimiRecord,
  GlossaryTerm,
  SubjectVariation,
  OptimizationItem,
  ToneRewrite,
  EmailPreview,
} from '@shared/schema';

// Client-only types
export interface HistoryItem { 
  id: string; 
  date: string; 
  content: { 
    body: string; 
    variations: { subject: string; previewText: string }[]; 
  }; 
  result: import('@shared/schema').GradingResult; 
}
export interface EmailVariation { subject: string; previewText: string; }
export type RewriteGoal = 'general' | 'urgency' | 'clarity' | 'concise';
export type FollowUpGoal = 'reminder' | 'discount' | 'query' | 'sequence';
export type ToneProfile = 'professional' | 'friendly' | 'urgent' | 'fomo' | 'storytelling';
