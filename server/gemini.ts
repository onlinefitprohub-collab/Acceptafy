import { GoogleGenAI, Type } from "@google/genai";
import type { GradingResult, RewrittenEmail, FollowUpEmail, FollowUpSequenceEmail, DnsRecords, SentenceGrade, DomainHealth, ListQualityAnalysis, BimiRecord, GlossaryTerm } from "../client/src/types";

// This is using Replit's AI Integrations service, which provides Gemini-compatible API access without requiring your own Gemini API key.
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const gradingSchema = {
  type: Type.OBJECT,
  properties: {
    inboxPlacementScore: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING }
      }
    },
    overallGrade: {
      type: Type.OBJECT,
      properties: {
        grade: { type: Type.STRING },
        summary: { type: Type.STRING }
      }
    },
    subjectLine: {
      type: Type.OBJECT,
      properties: {
        grade: { type: Type.STRING },
        summary: { type: Type.STRING },
        feedback: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    previewText: {
      type: Type.OBJECT,
      properties: {
        grade: { type: Type.STRING },
        summary: { type: Type.STRING },
        feedback: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    bodyCopy: {
      type: Type.OBJECT,
      properties: {
        grade: { type: Type.STRING },
        summary: { type: Type.STRING },
        feedback: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    callToAction: {
      type: Type.OBJECT,
      properties: {
        grade: { type: Type.STRING },
        summary: { type: Type.STRING },
        feedback: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    spamAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          reason: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestion: { type: Type.STRING },
          severity: { type: Type.STRING },
          rephraseExamples: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
    structuralAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          summary: { type: Type.STRING },
          feedback: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          severity: { type: Type.STRING },
          originalText: { type: Type.STRING }
        }
      }
    },
    subjectLineAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          previewText: { type: Type.STRING },
          predictionScore: { type: Type.NUMBER },
          rationale: { type: Type.STRING },
          isWinner: { type: Type.BOOLEAN }
        }
      }
    },
    personalizationScore: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        feedback: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    linkAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          url: { type: Type.STRING },
          anchorText: { type: Type.STRING },
          status: { type: Type.STRING },
          reason: { type: Type.STRING },
          suggestion: { type: Type.STRING }
        }
      }
    },
    replyAbilityAnalysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        feedback: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    plainTextAnalysis: {
      type: Type.OBJECT,
      properties: {
        plainTextVersion: { type: Type.STRING },
        readabilityScore: { type: Type.NUMBER },
        feedback: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    inboxPlacementPrediction: {
      type: Type.OBJECT,
      properties: {
        gmail: {
          type: Type.OBJECT,
          properties: {
            placement: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        },
        outlook: {
          type: Type.OBJECT,
          properties: {
            placement: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        },
        appleMail: {
          type: Type.OBJECT,
          properties: {
            placement: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        }
      }
    },
    accessibilityAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          summary: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          severity: { type: Type.STRING }
        }
      }
    }
  }
};

export const gradeCopy = async (body: string, variations: any[]): Promise<GradingResult> => {
  const prompt = `You are an expert email marketing analyst. Analyze the following email thoroughly and provide detailed feedback.

Email Body:
${body}

Subject Line Variations:
${JSON.stringify(variations, null, 2)}

Provide a comprehensive analysis including:
1. Overall inbox placement score (0-100) with summary
2. Overall grade (A+, A, B+, B, C+, C, D, F) with summary
3. Subject line analysis with grade, summary, and specific feedback points
4. Preview text analysis with grade, summary, and specific feedback points
5. Body copy analysis with grade, summary, and specific feedback points
6. Call to action analysis with grade, summary, and specific feedback points
7. Spam trigger analysis - identify any words/phrases that might trigger spam filters with severity (High/Medium/Low), suggestions, and rephrase examples
8. Structural analysis - check for capitalization issues, punctuation problems, sentence structure issues
9. Subject line showdown - analyze each variation with prediction scores and identify the winner
10. Personalization score (0-100) with feedback
11. Link analysis - check any URLs for issues
12. Reply-ability score (0-100) - how likely is the recipient to reply
13. Plain text analysis - generate a plain text version and assess readability
14. Inbox placement prediction for Gmail (Primary/Promotions/Spam), Outlook (Focused/Other/Junk), Apple Mail (Inbox/Junk)
15. Accessibility analysis - check for alt text issues, contrast, semantic HTML, link text

Return a detailed JSON response.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: gradingSchema
    }
  });
  return JSON.parse(res.text || '{}');
};

export const rewriteCopy = async (body: string, subject: string, preview: string, goal: string): Promise<RewrittenEmail> => {
  const goalDescriptions: Record<string, string> = {
    general: 'general improvement for better engagement and clarity',
    urgency: 'create a sense of urgency and prompt immediate action',
    clarity: 'make the message clearer and easier to understand',
    concise: 'make it shorter and more concise while keeping the key message'
  };

  const prompt = `Rewrite this email for ${goalDescriptions[goal] || goal}.

Current Subject: ${subject}
Current Preview Text: ${preview}
Current Body: ${body}

Provide a rewritten version with improved subject line, preview text, and body copy. Return as JSON with keys: subject, previewText, body.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          previewText: { type: Type.STRING },
          body: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(res.text || '{}');
};

export const generateFollowUpEmail = async (original: any, analysis: any, goal: string, context: string): Promise<FollowUpEmail> => {
  const goalDescriptions: Record<string, string> = {
    reminder: 'a gentle reminder about the previous email',
    discount: 'offer a discount or special incentive',
    query: 'ask a question to re-engage the recipient'
  };

  const prompt = `Write a follow-up email based on the original email.

Goal: ${goalDescriptions[goal] || goal}
Additional Context: ${context || 'None provided'}

Original Email Body: ${original.body}
Original Subject: ${original.variations?.[0]?.subject || 'No subject'}

Create a compelling follow-up email. Return as JSON with keys: subject, body.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          body: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(res.text || '{}');
};

export const generateFollowUpSequence = async (original: any, analysis: any, goal: string): Promise<FollowUpSequenceEmail[]> => {
  const prompt = `Create a 10-email follow-up sequence based on this original email.

Goal: ${goal}
Original Email Body: ${original.body}
Original Subject: ${original.variations?.[0]?.subject || 'No subject'}

For each email in the sequence, provide:
- Timing suggestion (e.g., "Day 1", "Day 3", "Day 7")
- Subject line
- Body copy
- Rationale for why this email works at this point in the sequence

Return as JSON array with objects containing: timingSuggestion, subject, body, rationale.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timingSuggestion: { type: Type.STRING },
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
            rationale: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(res.text || '[]');
};

export const generateDnsRecords = async (domain: string): Promise<DnsRecords> => {
  const prompt = `Generate proper email authentication DNS records for the domain: ${domain}

Provide:
1. SPF record (TXT record format)
2. DKIM record (TXT record format with selector)
3. DMARC record (TXT record format)

Return as JSON with keys: spf, dkim, dmarc. Each should be the complete DNS record value.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          spf: { type: Type.STRING },
          dkim: { type: Type.STRING },
          dmarc: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(res.text || '{}');
};

export const checkDomainHealth = async (domain: string): Promise<DomainHealth> => {
  const prompt = `Simulate a domain health check for: ${domain}

Analyze and provide:
1. Status: Clean, Warning, or Blacklisted
2. Detailed report about the domain's email sending reputation
3. Recommendations for improving deliverability

Return as JSON with keys: status, report, recommendation.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING },
          report: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(res.text || '{}');
};

export const analyzeEmailList = async (sample: string): Promise<ListQualityAnalysis> => {
  const prompt = `Analyze this email list sample for quality issues:

${sample}

Provide:
1. Percentage of role-based accounts (info@, sales@, etc.)
2. Percentage of free mail providers (gmail, yahoo, etc.)
3. Whether there are disposable domain indicators
4. Whether there are spam trap indicators
5. Summary report with recommendations

Return as JSON with keys: roleBasedAccountPercentage, freeMailProviderPercentage, disposableDomainIndicators (boolean), spamTrapIndicators (boolean), summaryReport.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          roleBasedAccountPercentage: { type: Type.NUMBER },
          freeMailProviderPercentage: { type: Type.NUMBER },
          disposableDomainIndicators: { type: Type.BOOLEAN },
          spamTrapIndicators: { type: Type.BOOLEAN },
          summaryReport: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(res.text || '{}');
};

export const generateBimiRecord = async (domain: string): Promise<BimiRecord> => {
  const prompt = `Generate BIMI (Brand Indicators for Message Identification) setup guidance for: ${domain}

Provide:
1. DMARC prerequisites that must be met
2. Logo requirements (format, size, hosting)
3. The actual BIMI DNS record

Return as JSON with keys: dmarcPrerequisite, logoRequirements, bimiRecord.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dmarcPrerequisite: { type: Type.STRING },
          logoRequirements: { type: Type.STRING },
          bimiRecord: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(res.text || '{}');
};

export const generatePostscript = async (body: string): Promise<string> => {
  const prompt = `Write a compelling P.S. (postscript) for this email that reinforces the main message or adds urgency:

${body}

Return just the P.S. text, starting with "P.S."`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  return res.text || '';
};

export const rewriteSentence = async (text: string): Promise<string> => {
  const prompt = `Rewrite this sentence to be more engaging and effective for email marketing:

${text}

Return only the rewritten sentence.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  return res.text || '';
};

export const gradeSentence = async (text: string): Promise<SentenceGrade> => {
  const prompt = `Grade this sentence for email marketing effectiveness:

${text}

Provide:
1. Whether it's good (true/false)
2. Detailed feedback on why

Return as JSON with keys: isGood (boolean), feedback (string).`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isGood: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(res.text || '{}');
};

export const explainTerm = async (term: string): Promise<GlossaryTerm> => {
  const prompt = `Explain this email marketing term: ${term}

Provide:
1. A simple, one-sentence definition
2. A detailed explanation (2-3 paragraphs)
3. A practical example of how it's used

Return as JSON with keys: simpleDefinition, detailedExplanation, practicalExample.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          simpleDefinition: { type: Type.STRING },
          detailedExplanation: { type: Type.STRING },
          practicalExample: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(res.text || '{}');
};
