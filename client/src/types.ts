export interface SectionGrade { grade: string; summary: string; feedback: string[]; }
export interface SpamTrigger { word: string; reason: string; suggestions: string[]; suggestion: string; severity: 'High' | 'Medium' | 'Low'; rephraseExamples: string[]; }
export interface StructuralFinding { type: 'Capitalization' | 'Punctuation' | 'Sentence Structure'; summary: string; feedback: string; suggestion: string; severity: 'High' | 'Medium' | 'Low'; originalText: string; }
export interface SubjectLineVariation { subject: string; previewText: string; predictionScore: number; rationale: string; isWinner: boolean; }
export interface PersonalizationScore { score: number; summary: string; feedback: string[]; }
export interface LinkAnalysisFinding { url: string; anchorText: string; status: 'Good' | 'Warning' | 'Bad'; reason: string; suggestion: string; }
export interface ReplyAbilityAnalysis { score: number; summary: string; feedback: string[]; }
export interface PlainTextAnalysis { plainTextVersion: string; readabilityScore: number; feedback: string[]; }
export interface InboxPlacementPrediction { gmail: { placement: 'Primary' | 'Promotions' | 'Spam'; reason: string; }; outlook: { placement: 'Focused' | 'Other' | 'Junk'; reason: string; }; appleMail: { placement: 'Inbox' | 'Junk'; reason: string; }; }
export interface AccessibilityFinding { type: 'Alt Text' | 'Contrast' | 'Semantic HTML' | 'Link Text'; summary: string; suggestion: string; severity: 'High' | 'Medium' | 'Low'; }
export interface GradingResult { inboxPlacementScore: { score: number; summary: string; }; overallGrade: { grade: string; summary: string; }; subjectLine: SectionGrade; previewText: SectionGrade; bodyCopy: SectionGrade; callToAction: SectionGrade; spamAnalysis: SpamTrigger[]; structuralAnalysis: StructuralFinding[]; subjectLineAnalysis: SubjectLineVariation[]; personalizationScore: PersonalizationScore; linkAnalysis: LinkAnalysisFinding[]; replyAbilityAnalysis: ReplyAbilityAnalysis; plainTextAnalysis: PlainTextAnalysis; inboxPlacementPrediction: InboxPlacementPrediction; accessibilityAnalysis: AccessibilityFinding[]; }
export interface HistoryItem { id: string; date: string; content: { body: string; variations: { subject: string; previewText: string }[]; }; result: GradingResult; }
export interface RewrittenEmail { subject: string; previewText: string; body: string; }
export type RewriteGoal = 'general' | 'urgency' | 'clarity' | 'concise';
export interface FollowUpEmail { subject: string; body: string; }
export type FollowUpGoal = 'reminder' | 'discount' | 'query' | 'sequence';
export interface FollowUpSequenceEmail { timingSuggestion: string; subject: string; body: string; rationale: string; }
export interface DnsRecords { spf: string; dkim: string; dmarc: string; }
export interface SentenceGrade { isGood: boolean; feedback: string; }
export interface DomainHealth { status: 'Clean' | 'Warning' | 'Blacklisted'; report: string; recommendation: string; }
export interface ListQualityAnalysis { roleBasedAccountPercentage: number; freeMailProviderPercentage: number; disposableDomainIndicators: boolean; spamTrapIndicators: boolean; summaryReport: string; }
export interface BimiRecord { dmarcPrerequisite: string; logoRequirements: string; bimiRecord: string; }
export interface GlossaryTerm { simpleDefinition: string; detailedExplanation: string; practicalExample: string; }
export interface EmailVariation { subject: string; previewText: string; }
export interface SubjectVariation { subject: string; previewText: string; predictedOpenRate: number; style: string; rationale: string; }
export interface OptimizationItem { priority: number; category: string; issue: string; impact: string; action: string; actionType: 'quickfix' | 'rewrite' | 'manual'; targetWord?: string; replacement?: string; }
export interface ToneRewrite { subject: string; previewText: string; body: string; toneNotes: string; }
export type ToneProfile = 'professional' | 'friendly' | 'urgent' | 'fomo' | 'storytelling';
export interface EmailPreview { gmail: { inboxDisplay: string; mobileDisplay: string }; outlook: { inboxDisplay: string; mobileDisplay: string }; apple: { inboxDisplay: string; mobileDisplay: string }; characterCounts: { subject: number; preview: number; subjectOptimal: boolean; previewOptimal: boolean }; truncationWarnings: string[]; }
