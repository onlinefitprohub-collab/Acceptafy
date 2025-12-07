export interface IndustryBenchmark {
  subjectLineLength: { optimal: number; max: number };
  readingLevel: { optimal: number; max: number };
  wordCount: { optimal: number; max: number };
  spamTolerance: {
    allowedWords: string[];
    warningThreshold: number;
  };
  description: string;
}

export interface EmailTypeBenchmark {
  subjectLineLength: { optimal: number; max: number };
  readingLevel: { optimal: number; max: number };
  wordCount: { optimal: number; max: number };
  description: string;
}

export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  saas: {
    subjectLineLength: { optimal: 50, max: 70 },
    readingLevel: { optimal: 8, max: 10 },
    wordCount: { optimal: 150, max: 300 },
    spamTolerance: {
      allowedWords: ['software', 'demo', 'trial', 'upgrade', 'features', 'integration'],
      warningThreshold: 3,
    },
    description: 'SaaS / Software',
  },
  ecommerce: {
    subjectLineLength: { optimal: 40, max: 60 },
    readingLevel: { optimal: 6, max: 8 },
    wordCount: { optimal: 100, max: 200 },
    spamTolerance: {
      allowedWords: ['sale', 'discount', 'free shipping', 'save', 'deal', 'offer', 'limited time'],
      warningThreshold: 4,
    },
    description: 'E-commerce / Retail',
  },
  real_estate: {
    subjectLineLength: { optimal: 35, max: 50 },
    readingLevel: { optimal: 7, max: 9 },
    wordCount: { optimal: 120, max: 250 },
    spamTolerance: {
      allowedWords: ['property', 'listing', 'home', 'mortgage', 'investment', 'price', 'market'],
      warningThreshold: 3,
    },
    description: 'Real Estate',
  },
  finance: {
    subjectLineLength: { optimal: 45, max: 65 },
    readingLevel: { optimal: 10, max: 12 },
    wordCount: { optimal: 200, max: 400 },
    spamTolerance: {
      allowedWords: ['interest rate', 'investment', 'portfolio', 'credit', 'account', 'balance', 'yield', 'returns'],
      warningThreshold: 5,
    },
    description: 'Finance / Banking',
  },
  healthcare: {
    subjectLineLength: { optimal: 45, max: 60 },
    readingLevel: { optimal: 8, max: 10 },
    wordCount: { optimal: 150, max: 300 },
    spamTolerance: {
      allowedWords: ['appointment', 'health', 'care', 'prescription', 'doctor', 'treatment', 'wellness'],
      warningThreshold: 3,
    },
    description: 'Healthcare',
  },
  agency: {
    subjectLineLength: { optimal: 45, max: 65 },
    readingLevel: { optimal: 8, max: 10 },
    wordCount: { optimal: 150, max: 300 },
    spamTolerance: {
      allowedWords: ['results', 'growth', 'strategy', 'campaign', 'roi', 'performance', 'analytics'],
      warningThreshold: 3,
    },
    description: 'Marketing Agency',
  },
  education: {
    subjectLineLength: { optimal: 50, max: 70 },
    readingLevel: { optimal: 7, max: 9 },
    wordCount: { optimal: 180, max: 350 },
    spamTolerance: {
      allowedWords: ['course', 'learn', 'enroll', 'certificate', 'training', 'skills', 'class'],
      warningThreshold: 3,
    },
    description: 'Education / Coaching',
  },
  recruiting: {
    subjectLineLength: { optimal: 40, max: 55 },
    readingLevel: { optimal: 8, max: 10 },
    wordCount: { optimal: 120, max: 200 },
    spamTolerance: {
      allowedWords: ['opportunity', 'position', 'role', 'salary', 'benefits', 'career', 'hiring'],
      warningThreshold: 4,
    },
    description: 'Recruiting / HR',
  },
  nonprofit: {
    subjectLineLength: { optimal: 45, max: 60 },
    readingLevel: { optimal: 7, max: 9 },
    wordCount: { optimal: 150, max: 300 },
    spamTolerance: {
      allowedWords: ['donate', 'donation', 'support', 'help', 'cause', 'impact', 'volunteer'],
      warningThreshold: 4,
    },
    description: 'Nonprofit',
  },
  consulting: {
    subjectLineLength: { optimal: 50, max: 70 },
    readingLevel: { optimal: 10, max: 12 },
    wordCount: { optimal: 180, max: 350 },
    spamTolerance: {
      allowedWords: ['expertise', 'solution', 'strategy', 'consulting', 'results', 'transformation'],
      warningThreshold: 3,
    },
    description: 'Consulting / Professional Services',
  },
};

export const EMAIL_TYPE_BENCHMARKS: Record<string, EmailTypeBenchmark> = {
  cold_outreach: {
    subjectLineLength: { optimal: 35, max: 50 },
    readingLevel: { optimal: 6, max: 8 },
    wordCount: { optimal: 75, max: 125 },
    description: 'Cold Outreach / Sales',
  },
  newsletter: {
    subjectLineLength: { optimal: 50, max: 70 },
    readingLevel: { optimal: 7, max: 9 },
    wordCount: { optimal: 400, max: 1000 },
    description: 'Newsletter',
  },
  promotional: {
    subjectLineLength: { optimal: 40, max: 55 },
    readingLevel: { optimal: 5, max: 7 },
    wordCount: { optimal: 80, max: 150 },
    description: 'Promotional / Sale',
  },
  transactional: {
    subjectLineLength: { optimal: 45, max: 60 },
    readingLevel: { optimal: 8, max: 10 },
    wordCount: { optimal: 100, max: 200 },
    description: 'Transactional',
  },
  welcome: {
    subjectLineLength: { optimal: 40, max: 55 },
    readingLevel: { optimal: 6, max: 8 },
    wordCount: { optimal: 150, max: 300 },
    description: 'Welcome / Onboarding',
  },
  nurture: {
    subjectLineLength: { optimal: 50, max: 70 },
    readingLevel: { optimal: 7, max: 9 },
    wordCount: { optimal: 200, max: 400 },
    description: 'Nurture / Drip Sequence',
  },
  winback: {
    subjectLineLength: { optimal: 35, max: 50 },
    readingLevel: { optimal: 6, max: 8 },
    wordCount: { optimal: 100, max: 180 },
    description: 'Win-back / Re-engagement',
  },
  announcement: {
    subjectLineLength: { optimal: 45, max: 60 },
    readingLevel: { optimal: 7, max: 9 },
    wordCount: { optimal: 150, max: 300 },
    description: 'Product Announcement',
  },
  event: {
    subjectLineLength: { optimal: 45, max: 60 },
    readingLevel: { optimal: 7, max: 9 },
    wordCount: { optimal: 120, max: 250 },
    description: 'Event / Webinar Invite',
  },
};

export function calculateReadingLevel(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  if (words.length === 0 || sentences.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const fleschKincaid = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  
  return Math.max(1, Math.min(18, Math.round(fleschKincaid)));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const syllableMatches = word.match(/[aeiouy]{1,2}/g);
  return syllableMatches ? syllableMatches.length : 1;
}

export function generateBenchmarkFeedback(
  industry: string | undefined,
  emailType: string | undefined,
  metrics: {
    subjectLength: number;
    wordCount: number;
    readingLevel: number;
    spamWordsFound: string[];
  }
): {
  industryComparison: string | null;
  emailTypeComparison: string | null;
  benchmarkInsights: string[];
  industryPercentile: number | null;
  emailTypePercentile: number | null;
} {
  const insights: string[] = [];
  let industryComparison: string | null = null;
  let emailTypeComparison: string | null = null;
  let industryPercentile: number | null = null;
  let emailTypePercentile: number | null = null;
  
  if (industry && INDUSTRY_BENCHMARKS[industry]) {
    const benchmark = INDUSTRY_BENCHMARKS[industry];
    
    if (metrics.subjectLength > benchmark.subjectLineLength.max) {
      const overBy = Math.round(((metrics.subjectLength - benchmark.subjectLineLength.optimal) / benchmark.subjectLineLength.optimal) * 100);
      insights.push(`Your subject line is ${metrics.subjectLength} characters. Top-performing ${benchmark.description} emails have subject lines under ${benchmark.subjectLineLength.optimal} characters. You're ${overBy}% over the industry standard.`);
    } else if (metrics.subjectLength <= benchmark.subjectLineLength.optimal) {
      insights.push(`Your subject line length (${metrics.subjectLength} chars) is optimal for ${benchmark.description} emails.`);
    }
    
    if (metrics.readingLevel > benchmark.readingLevel.max) {
      insights.push(`You're writing at a grade ${metrics.readingLevel} reading level. In ${benchmark.description}, the highest converting emails are written at grade ${benchmark.readingLevel.optimal}. Simplify your vocabulary.`);
    } else if (metrics.readingLevel <= benchmark.readingLevel.optimal) {
      insights.push(`Your reading level (grade ${metrics.readingLevel}) is excellent for ${benchmark.description} audiences.`);
    }
    
    if (metrics.wordCount > benchmark.wordCount.max) {
      const overBy = Math.round(((metrics.wordCount - benchmark.wordCount.optimal) / benchmark.wordCount.optimal) * 100);
      insights.push(`Your email is ${metrics.wordCount} words. The industry benchmark for ${benchmark.description} is ${benchmark.wordCount.optimal} words. You're ${overBy}% over the optimal length.`);
    }
    
    const allowedSpamWords = metrics.spamWordsFound.filter(word => 
      benchmark.spamTolerance.allowedWords.some(allowed => 
        word.toLowerCase().includes(allowed.toLowerCase())
      )
    );
    if (allowedSpamWords.length > 0) {
      insights.push(`We detected "${allowedSpamWords.join('", "')}" which are typically flagged but are expected in ${benchmark.description} emails.`);
    }
    
    let industryScore = 100;
    if (metrics.subjectLength > benchmark.subjectLineLength.max) industryScore -= 20;
    if (metrics.readingLevel > benchmark.readingLevel.max) industryScore -= 25;
    if (metrics.wordCount > benchmark.wordCount.max) industryScore -= 20;
    industryPercentile = Math.max(10, Math.min(95, industryScore));
    
    if (industryPercentile >= 80) {
      industryComparison = `Your email is in the top ${100 - industryPercentile}% for ${benchmark.description}.`;
    } else if (industryPercentile >= 50) {
      industryComparison = `Your email matches the average for ${benchmark.description}, but there's room to reach top performers.`;
    } else {
      industryComparison = `Your email needs optimization to compete with successful ${benchmark.description} campaigns.`;
    }
  }
  
  if (emailType && EMAIL_TYPE_BENCHMARKS[emailType]) {
    const benchmark = EMAIL_TYPE_BENCHMARKS[emailType];
    
    if (metrics.wordCount > benchmark.wordCount.max) {
      insights.push(`For ${benchmark.description} emails, the optimal word count is ${benchmark.wordCount.optimal}. Your email is ${metrics.wordCount - benchmark.wordCount.optimal} words over.`);
    } else if (metrics.wordCount >= benchmark.wordCount.optimal * 0.7 && metrics.wordCount <= benchmark.wordCount.optimal * 1.3) {
      insights.push(`Your word count (${metrics.wordCount}) is within the ideal range for ${benchmark.description} emails.`);
    }
    
    let typeScore = 100;
    if (metrics.subjectLength > benchmark.subjectLineLength.max) typeScore -= 15;
    if (metrics.readingLevel > benchmark.readingLevel.max) typeScore -= 20;
    if (metrics.wordCount > benchmark.wordCount.max) typeScore -= 25;
    else if (metrics.wordCount < benchmark.wordCount.optimal * 0.5) typeScore -= 15;
    emailTypePercentile = Math.max(10, Math.min(95, typeScore));
    
    if (emailTypePercentile >= 80) {
      emailTypeComparison = `Your email structure is optimized for ${benchmark.description}.`;
    } else if (emailTypePercentile >= 50) {
      emailTypeComparison = `Your ${benchmark.description} email has good fundamentals but could be refined.`;
    } else {
      emailTypeComparison = `Your email structure doesn't match typical high-performing ${benchmark.description} patterns.`;
    }
  }
  
  return {
    industryComparison,
    emailTypeComparison,
    benchmarkInsights: insights,
    industryPercentile,
    emailTypePercentile,
  };
}
