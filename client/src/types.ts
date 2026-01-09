export interface SectionGrade {
  grade: string;
  summary: string;
  feedback: string[];
}

export interface SpamTrigger {
  word?: string;
  phrase?: string;
  reason: string;
  suggestions?: string[];
  alternatives?: string[];
  suggestion?: string;
  bestReplacement?: string;
  severity: 'High' | 'Medium' | 'Low';
  rephraseExamples?: string[];
}

export interface StructuralFinding {
  type: 'Capitalization' | 'Punctuation' | 'Sentence Structure';
  summary: string;
  feedback: string;
  suggestion: string;
  severity: 'High' | 'Medium' | 'Low';
  originalText: string;
}

export interface SubjectLineVariation {
  subject: string;
  previewText: string;
  predictionScore: number;
  rationale: string;
  isWinner: boolean;
}

export interface PersonalizationScore {
  score: number;
  summary: string;
  feedback: string[];
}

export interface LinkAnalysisFinding {
  url: string;
  anchorText: string;
  status: 'Good' | 'Warning' | 'Bad';
  reason: string;
  suggestion: string;
}

export interface ReplyAbilityAnalysis {
  score: number;
  summary: string;
  feedback: string[];
}

export interface PlainTextAnalysis {
  plainTextVersion: string;
  readabilityScore: number;
  feedback: string[];
}

export interface InboxPlacementPrediction {
    gmail: {
        placement: 'Primary' | 'Promotions' | 'Spam';
        reason: string;
    };
    outlook: {
        placement: 'Focused' | 'Other' | 'Junk';
        reason: string;
    };
    appleMail: {
        placement: 'Inbox' | 'Junk';
        reason: string;
    };
}

export interface AccessibilityFinding {
    type: 'Alt Text' | 'Contrast' | 'Semantic HTML' | 'Link Text';
    summary: string;
    suggestion: string;
    severity: 'High' | 'Medium' | 'Low';
}

export interface GradingResult {
  inboxPlacementScore: {
    score: number;
    summary: string;
  };
  overallGrade: {
    grade: string;
    summary: string;
  };
  subjectLine: SectionGrade;
  previewText: SectionGrade;
  bodyCopy: SectionGrade;
  callToAction: SectionGrade;
  spamAnalysis: SpamTrigger[];
  structuralAnalysis: StructuralFinding[];
  subjectLineAnalysis: SubjectLineVariation[];
  personalizationScore: PersonalizationScore;
  linkAnalysis: LinkAnalysisFinding[];
  replyAbilityAnalysis: ReplyAbilityAnalysis;
  plainTextAnalysis: PlainTextAnalysis;
  inboxPlacementPrediction: InboxPlacementPrediction;
  accessibilityAnalysis: AccessibilityFinding[];
  benchmarkFeedback?: BenchmarkFeedback;
}

export interface HistoryItem {
  id: string;
  date: string;
  content: {
    body: string;
    variations: { subject: string; previewText: string }[];
  };
  result: GradingResult;
}

export interface GlossaryTerm {
    simpleDefinition: string;
    detailedExplanation: string;
    practicalExample: string;
}

export interface RewrittenEmail {
  subject: string;
  previewText: string;
  body: string;
}

export type RewriteGoal = 'general' | 'urgency' | 'clarity' | 'concise';

export interface FollowUpEmail {
    subject: string;
    body: string;
}

export type FollowUpGoal = 'reminder' | 'discount' | 'query' | 'sequence';

export interface FollowUpSequenceEmail {
    timingSuggestion: string;
    subject: string;
    body: string;
    rationale: string;
}

export interface DnsRecords {
    spf: string;
    dkim: string;
    dmarc: string;
}

export interface SentenceGrade {
  isGood: boolean;
  feedback: string;
}

export interface DomainHealth {
    status: 'Clean' | 'Warning' | 'Blacklisted';
    report: string;
    recommendation: string;
}

export interface EmailQualityStatus {
    email: string;
    isValid: boolean;
    isRoleBased: boolean;
    isFreeProvider: boolean;
    isDisposable: boolean;
    isPotentialSpamTrap: boolean;
    reason?: string;
}

export interface ListQualityAnalysis {
    roleBasedAccountPercentage: number;
    freeMailProviderPercentage: number;
    disposableDomainIndicators: boolean;
    spamTrapIndicators: boolean;
    summaryReport: string;
    emailStatuses?: EmailQualityStatus[];
}

export interface BimiRecord {
    dmarcPrerequisite: string;
    logoRequirements: string;
    bimiRecord: string;
}

export interface EmailVariation {
  subject: string;
  previewText: string;
}

export type ToneProfile = 'professional' | 'friendly' | 'urgent' | 'fomo' | 'storytelling';

export interface SubjectVariation {
  subject: string;
  previewText: string;
  style: string;
  predictedOpenRate: number;
  rationale: string;
}

export interface OptimizationItem {
  priority: number;
  issue: string;
  action: string;
  category: string;
  impact: string;
  actionType?: 'quickfix' | 'rewrite' | 'manual';
  targetWord?: string;
  replacement?: string;
}

export interface ToneRewrite {
  subject: string;
  previewText: string;
  body: string;
  toneNotes: string;
}

export interface EmailPreview {
  gmail: { inboxDisplay: string; mobileDisplay: string };
  outlook: { inboxDisplay: string; mobileDisplay: string };
  apple: { inboxDisplay: string; mobileDisplay: string };
  characterCounts: {
    subject: number;
    preview: number;
    subjectOptimal: boolean;
    previewOptimal: boolean;
  };
  truncationWarnings: string[];
}

export interface WarmupDay {
  day: number;
  phase: 'Foundation' | 'Growth' | 'Scale' | 'Optimization';
  emailVolume: number;
  targetOpenRate: number;
  targetReplyRate: number;
  actions: string[];
  tips: string[];
  milestone?: string;
}

export interface WarmupPlan {
  domain: string;
  totalDays: number;
  overview: string;
  phases: {
    name: string;
    days: string;
    goal: string;
    volumeRange: string;
  }[];
  schedule: WarmupDay[];
  bestPractices: string[];
  warningSignals: string[];
}

export interface SpamCheckResult {
  triggers: SpamTrigger[];
  overallRisk: 'Low' | 'Medium' | 'High';
  riskSummary: string;
  inboxProbability: number;
}

export interface EmotionBreakdown {
  emotion: string;
  percentage: number;
  description: string;
}

export interface ToneImprovement {
  section: string;
  currentTone: string;
  suggestedTone: string;
  originalText: string;
  improvedText: string;
  reason: string;
}

export interface SentimentAnalysisResult {
  overallSentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
  sentimentScore: number;
  emotionBreakdown: EmotionBreakdown[];
  toneDescription: string;
  engagementPrediction: number;
  emotionalTriggers: string[];
  improvements: ToneImprovement[];
  summary: string;
}

export interface CompetitorStrength {
  point: string;
  explanation: string;
  howToApply: string;
}

export interface CompetitorWeakness {
  point: string;
  explanation: string;
  yourOpportunity: string;
}

export interface CompetitorTactic {
  tactic: string;
  description: string;
  effectiveness: 'High' | 'Medium' | 'Low';
}

export interface CompetitorAnalysisResult {
  strengths: CompetitorStrength[];
  weaknesses: CompetitorWeakness[];
  tactics: CompetitorTactic[];
  overallAssessment: string;
  keyTakeaways: string[];
  suggestedImprovements: string[];
}

export interface BenchmarkFeedback {
  industryComparison: string | null;
  emailTypeComparison: string | null;
  benchmarkInsights: string[];
  industryPercentile: number | null;
  emailTypePercentile: number | null;
}

export interface SendTimeSlot {
  day: string;
  hour: string;
  score: number;
  reason: string;
}

export interface SendTimeOptimization {
  bestTimes: SendTimeSlot[];
  worstTimes: SendTimeSlot[];
  timezone: string;
  industryInsight: string;
  summary: string;
}

export interface EngagementPrediction {
  predictedOpenRate: number;
  predictedClickRate: number;
  predictedUnsubscribeRate: number;
  engagementScore: number;
  factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    explanation: string;
  }[];
  recommendations: string[];
  summary: string;
}

export interface IndustryBenchmark {
  industry: string;
  yourScore: number;
  industryAverage: number;
  topPerformers: number;
  percentile: number;
  metrics: {
    metric: string;
    yourValue: number | string;
    benchmark: number | string;
    status: 'above' | 'at' | 'below';
    tip: string;
  }[];
  summary: string;
}

export interface ReputationInsight {
  overallHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  score: number;
  factors: {
    factor: string;
    status: 'good' | 'warning' | 'critical';
    description: string;
    actionItem: string;
  }[];
  tips: string[];
  summary: string;
}
