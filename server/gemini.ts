import { GoogleGenAI, Type } from "@google/genai";
import type { 
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
  SenderScoreInput,
  SenderScoreResult
} from "@shared/schema";

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

export const gradeCopy = async (body: string, variations: { subject: string; previewText: string }[]): Promise<GradingResult> => {
  try {
    const fullEmailCopy = variations.map((v, i) => 
      `---Variation ${i + 1}---\nSubject: ${v.subject}\nPreview: ${v.previewText}`
    ).join('\n\n') + `\n\n---Email Body (Common to all variations)---\n${body}`;

    const systemInstruction = `You are an expert email marketing and deliverability analyst. Your task is to perform a comprehensive analysis of the provided email copy. Your response MUST be a single JSON object matching the provided schema.

1.  **Inbox Placement Score:** Based on a holistic review of all the other factors, provide a single predictive 'score' from 0 to 100 representing the probability of this email landing in the recipient's primary inbox, avoiding spam and promotions folders. Provide a brief 'summary' explaining the main reasons for this score.
2.  **Inbox Placement PREDICTION:** Based on all factors, predict where this email will land for each major provider. For Gmail, choose 'Primary', 'Promotions', or 'Spam'. For Outlook, choose 'Focused', 'Other', or 'Junk'. For Apple Mail, choose 'Inbox' or 'Junk'. Provide a concise 'reason' for each prediction.
3.  **Standard Grading:** Provide a grade (A+, B, C-, etc.), a one-sentence summary, and actionable feedback for each section: Subject Line, Preview Text (base these on the winning variation), Body Copy, and Call to Action. Also provide an overall grade and summary.
4.  **Spam Trigger Word Analysis:** Identify words/phrases likely to be flagged by spam filters. For each, provide the 'word', a detailed 'reason', a wide range of safer alternative words ('suggestions'), a single, direct replacement 'suggestion' from that list, a 'severity' score ('High', 'Medium', 'Low'), and an array of 'rephraseExamples' containing 1-2 examples of how to rewrite the surrounding sentence to avoid the trigger. If none are found, return an empty array.
5.  **Structural Analysis:** Identify non-keyword issues: Excessive Capitalization, Excessive Punctuation, and poor Sentence Structure. For each, provide its type, summary, feedback, suggestion, severity, and the exact 'originalText' from the email that triggered the finding. If none are found, return an empty array.
6.  **Subject Line Showdown (A/B Test Simulation):** Analyze all provided Subject/Preview text variations. For each variation, provide its text, a 'predictionScore' (0-100) for its likely success, and a 'rationale'. Designate exactly one variation as the winner by setting 'isWinner' to true. The winner should be the one with the highest potential open rate based on clarity, engagement, and low spam risk.
7.  **Personalization & Authenticity Score:** Analyze the email body. Provide a 'score' (0-100) for how personalized and authentic it feels. Also, provide a 'summary' and a list of actionable 'feedback' points to make it feel more one-to-one and less like a generic blast.
8.  **Link & Reputation Analysis:** Scan the email body for all hyperlinks. For each link found, analyze it for deliverability red flags. Provide the 'url', the 'anchorText', a 'status' ('Good', 'Warning', 'Bad'), a 'reason' for the status (e.g., "Uses a public URL shortener", "Non-descriptive anchor text"), and a 'suggestion' for improvement. If no links are found, return an empty array.
9.  **Reply-Ability Analysis:** A reply is a strong positive signal for deliverability. Analyze the email for its likelihood of getting a reply. Provide a 'score' (0-100), a 'summary', and 'feedback' on how to encourage a response (e.g., by asking a question).
10. **Plain-Text Version Analysis:** A clean plain-text version is crucial for deliverability. Generate a 'plainTextVersion' of the email body, ensuring it's readable and all links are preserved. Provide a 'readabilityScore' (0-100) for this plain-text version and 'feedback' on its quality.
11. **Accessibility Analysis:** Analyze the email body for common accessibility issues as if it were HTML. Check for missing 'alt' text on implied images, poor color contrast between text and background, non-descriptive link text (like "click here"), and use of non-semantic HTML for layout. Provide a 'type', 'summary', 'suggestion', and 'severity'. If no issues are found, return an empty array.`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Please analyze the following email copy and its variations, providing a detailed grade and deliverability analysis.\n\n${fullEmailCopy}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: gradingSchema
      }
    });

    const jsonString = res.text?.trim() || '{}';
    return JSON.parse(jsonString) as GradingResult;
  } catch (error) {
    console.error("Error calling AI service:", error);
    throw new Error("An error occurred while grading the email. Please try again.");
  }
};

const rewriteSchema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING, description: "The rewritten, improved subject line." },
    previewText: { type: Type.STRING, description: "The rewritten, improved preview text." },
    body: { type: Type.STRING, description: "The rewritten, improved email body." },
  },
  required: ["subject", "previewText", "body"],
};

export const rewriteCopy = async (emailBody: string, subject: string, previewText: string, goal: string): Promise<RewrittenEmail> => {
  try {
    const content = `---Original Email---\nSubject: ${subject}\nPreview: ${previewText}\n\n---Body---\n${emailBody}`;
    
    let systemInstruction: string;
    const baseInstruction = `You are an expert email copywriter specializing in high-conversion, high-deliverability emails. Rewrite the provided email content (subject, preview text, and body). Preserve the core message and intent of the original email. Return the result as a single JSON object.`;

    switch (goal) {
        case 'urgency':
            systemInstruction = `${baseInstruction} Your primary goal is to increase the sense of urgency. Focus on using time-sensitive language, scarcity principles, and compelling calls-to-action that encourage immediate response, while still eliminating spam triggers.`;
            break;
        case 'clarity':
            systemInstruction = `${baseInstruction} Your primary goal is to maximize clarity and readability. Focus on simplifying complex sentences, using direct and unambiguous language, and ensuring the main message is immediately understandable.`;
            break;
        case 'concise':
            systemInstruction = `${baseInstruction} Your primary goal is to make the copy more concise. Focus on eliminating filler words, tightening sentences, and conveying the message in as few words as possible without losing impact.`;
            break;
        case 'general':
        default:
            systemInstruction = `You are an expert email copywriter specializing in high-conversion, high-deliverability emails. Rewrite the provided email content (subject, preview text, and body). Your goals are:
1.  Maximize clarity and impact.
2.  Eliminate spam trigger words and phrases.
3.  Improve sentence structure and readability.
4.  Strengthen the call to action.
5.  Preserve the core message and intent of the original email.
Return the result as a single JSON object.`;
            break;
    }
    
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Please rewrite the following email. The main goal of the rewrite is: ${goal}.\n\n${content}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: rewriteSchema,
      }
    });

    const jsonString = result.text?.trim() || '{}';
    return JSON.parse(jsonString) as RewrittenEmail;

  } catch (error) {
    console.error("Error calling AI rewrite service:", error);
    throw new Error("Failed to get rewritten copy from the AI service.");
  }
};

const followUpSchema = {
    type: Type.OBJECT,
    properties: {
        subject: { type: Type.STRING, description: "The concise, effective subject line for the follow-up email." },
        body: { type: Type.STRING, description: "The full body of the follow-up email, written in a friendly and professional tone." },
    },
    required: ["subject", "body"],
};

export const generateFollowUpEmail = async (
    originalEmail: { subject: string; body: string; },
    analysis: GradingResult,
    goal: string,
    context?: string
): Promise<FollowUpEmail> => {
    try {
        const originalContent = `---Original Email---\nSubject: ${originalEmail.subject}\n\n---Body---\n${originalEmail.body}`;
        const analysisSummary = `The original email was analyzed and received an overall grade of ${analysis.overallGrade.grade}. Key feedback was: ${analysis.overallGrade.summary}. The main spam concern was: ${analysis.spamAnalysis[0]?.reason || 'none'}.`;

        let goalInstruction = '';
        switch (goal) {
            case 'reminder':
                goalInstruction = 'The goal is to send a gentle, polite reminder to the recipient, prompting them to take the original call-to-action without being pushy.';
                break;
            case 'discount':
                goalInstruction = 'The goal is to re-engage the recipient by offering a special discount or incentive. The offer should be clearly stated and create a sense of value and urgency.';
                break;
            case 'query':
                goalInstruction = `The goal is to address a specific question or concern from the recipient. The context for the query is: "${context}". The tone should be helpful, reassuring, and aim to resolve their query while gently guiding them back to the original call-to-action.`;
                break;
        }

        const systemInstruction = `You are an expert email marketing strategist. Your task is to write a follow-up email based on a provided original email and its performance analysis.

        -   You must adhere to the specific 'goal' provided.
        -   The tone should be consistent with a professional and friendly brand voice.
        -   The follow-up must be concise, clear, and focused on its single goal.
        -   AVOID all spam triggers and poor formatting practices identified in the original analysis.
        -   Reference the original email's context subtly, so the recipient knows what it's about. Do not be repetitive.
        -   The call-to-action should be clear and singular.
        -   Return the result as a single JSON object.`;

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Here is the original email:\n${originalContent}\n\nHere is a summary of its analysis:\n${analysisSummary}\n\nPlease write a follow-up email. ${goalInstruction}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: followUpSchema,
            }
        });

        const jsonString = result.text?.trim() || '{}';
        return JSON.parse(jsonString) as FollowUpEmail;

    } catch (error) {
        console.error("Error calling AI follow-up generation service:", error);
        throw new Error("Failed to get follow-up email from the AI service.");
    }
};

const followUpSequenceSchema = {
    type: Type.ARRAY,
    description: "A sequence of exactly 10 follow-up emails.",
    items: {
        type: Type.OBJECT,
        properties: {
            timingSuggestion: { type: Type.STRING, description: "When this email should be sent, e.g., 'Day 1', 'Day 3', 'Day 7'." },
            subject: { type: Type.STRING, description: "The concise, effective subject line for this specific email in the sequence." },
            body: { type: Type.STRING, description: "The full body of the follow-up email, written in a friendly and professional tone." },
            rationale: { type: Type.STRING, description: "A brief, one-sentence explanation of this email's purpose within the overall sequence." },
        },
        required: ["timingSuggestion", "subject", "body", "rationale"],
    },
};

export const generateFollowUpSequence = async (
    originalEmail: { subject: string; body: string; },
    analysis: GradingResult,
    sequenceGoal: string
): Promise<FollowUpSequenceEmail[]> => {
    try {
        const originalContent = `---Original Email---\nSubject: ${originalEmail.subject}\n\n---Body---\n${originalEmail.body}`;
        const analysisSummary = `The original email was analyzed and received an overall grade of ${analysis.overallGrade.grade}. Key feedback was: ${analysis.overallGrade.summary}. The main spam concern was: ${analysis.spamAnalysis[0]?.reason || 'none'}. The personalization score was ${analysis.personalizationScore.score}/100.`;

        const systemInstruction = `You are an expert email marketing and deliverability strategist. Your task is to write a 10-email follow-up sequence based on an original email and its performance analysis. The overall goal of this sequence is to: "${sequenceGoal}".

        **CRITICAL DELIVERABILITY RULES:**
        1.  **High Inbox Probability:** Your primary objective is to create emails that land in the primary inbox. AVOID ALL spam triggers, especially those identified in the original analysis summary. Use natural, conversational language.
        2.  **Vary Content:** Each email must be unique. Do not repeat phrases or sentences. Vary the structure and call to action.
        3.  **Concise & Scannable:** Keep emails short, focused, and easy to read. Use short paragraphs and bullet points where appropriate.
        4.  **Personalized Tone:** Write as if a human is writing to another human. Reference the original context subtly.
        
        **SEQUENCE STRUCTURE:**
        -   The sequence must have exactly 10 emails.
        -   Provide a logical 'timingSuggestion' for each (e.g., "Day 1", "Day 3", "Day 7", "Day 14").
        -   The tone should progress logically, starting friendly and gradually becoming more direct or offering more value.
        -   Each email must have a 'rationale' explaining its strategic purpose.
        -   Return the result as a single JSON array of 10 email objects.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Here is the original email:\n${originalContent}\n\nHere is a summary of its analysis:\n${analysisSummary}\n\nPlease write a 10-email follow-up sequence. The overall goal is: "${sequenceGoal}".`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: followUpSequenceSchema,
            }
        });
        
        const jsonString = response.text?.trim() || '[]';
        const parsedResult = JSON.parse(jsonString);
        if (Array.isArray(parsedResult) && parsedResult.length > 0) {
            return parsedResult as FollowUpSequenceEmail[];
        } else {
            throw new Error("AI did not return a valid email sequence.");
        }

    } catch (error) {
        console.error("Error calling AI follow-up sequence generation service:", error);
        throw new Error("Failed to generate follow-up sequence. Please try again.");
    }
};

const dnsSchema = {
    type: Type.OBJECT,
    properties: {
        spf: { type: Type.STRING, description: "The generated SPF TXT record value. It should be a standard, safe default like 'v=spf1 -all'." },
        dkim: { type: Type.STRING, description: "An example DKIM TXT record value. Use 'v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY' as a placeholder." },
        dmarc: { type: Type.STRING, description: "The generated DMARC TXT record value. Use a standard reporting policy, e.g., 'v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@YOUR_DOMAIN.COM'." },
    },
    required: ["spf", "dkim", "dmarc"],
};

export const generateDnsRecords = async (domain: string): Promise<DnsRecords> => {
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate the standard SPF, DKIM, and DMARC DNS records for the domain: ${domain}. Replace placeholders like 'YOUR_DOMAIN.COM' with the actual domain provided.`,
            config: {
                systemInstruction: `You are a DNS and email deliverability expert. You will be given a domain name and must generate the standard SPF, DKIM, and DMARC TXT record values for it.
                - For SPF, provide a secure default that doesn't include any specific mail servers yet.
                - For DKIM, provide a standard placeholder as the public key is unknown.
                - For DMARC, provide a standard record with a 'quarantine' policy and a reporting email address.
                - Your response MUST be a single JSON object.`,
                responseMimeType: "application/json",
                responseSchema: dnsSchema,
            }
        });
        const jsonString = result.text?.trim() || '{}';
        return JSON.parse(jsonString) as DnsRecords;
    } catch (error) {
        console.error("Error calling AI DNS generation service:", error);
        throw new Error("Failed to generate DNS records.");
    }
};

export const checkDomainHealth = async (domain: string): Promise<DomainHealth> => {
  const prompt = `Simulate a comprehensive domain health check for email deliverability for: ${domain}

Analyze the domain's email sending reputation and provide a detailed report covering these specific areas:

1. SPF (Sender Policy Framework): Analyze the SPF record configuration, whether it uses -all or ~all, and if it properly lists all sending sources.

2. DKIM (DomainKeys Identified Mail): Evaluate if DKIM is properly configured, key rotation practices, and signing consistency.

3. DMARC (Domain-based Message Authentication, Reporting & Conformance): Check the DMARC policy (none/quarantine/reject), reporting configuration, and alignment settings.

4. Reverse DNS (rDNS): Assess if sending IPs have proper reverse DNS configured.

5. Blacklist Status: Check against major blacklists like Spamhaus, SURBL, MXToolbox.

6. Mail Server Configuration: Evaluate TLS encryption, open relay status, and server security.

7. Content & Engagement: Note any content quality or engagement metrics that could affect deliverability.

Format the report with each section labeled clearly (e.g., "SPF (Sender Policy Framework): ...").

Return as JSON with:
- status: "Clean", "Warning", or "Blacklisted"
- report: The detailed analysis covering all 7 areas above, with each section clearly labeled
- recommendation: Specific actionable steps to improve deliverability`;

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

export const generatePostscript = async (emailBody: string): Promise<string> => {
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following email body and write a short, engaging postscript (P.S.) designed to encourage a reply. The P.S. should be conversational and ask a simple, open-ended question related to the email's topic. Return only the P.S. text itself, without any introductory phrases like "P.S.:".\n\n---Email Body---\n${emailBody}`,
        });
        return `P.S. ${result.text?.trim() || ''}`;
    } catch (error) {
        console.error("Error calling AI P.S. generation service:", error);
        throw new Error("Failed to generate postscript.");
    }
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

export const generateSubjectVariations = async (
  originalSubject: string,
  originalPreview: string,
  bodyContext: string
): Promise<SubjectVariation[]> => {
  const prompt = `You are an expert email marketing copywriter. Generate 5 A/B test variations of this subject line and preview text combination.

Original Subject: ${originalSubject}
Original Preview: ${originalPreview}
Email Context: ${bodyContext.slice(0, 500)}

Create 5 distinct variations using these styles:
1. Curiosity Gap - Create intrigue without clickbait
2. Benefit-Focused - Lead with the value proposition
3. Urgency/Scarcity - Create time sensitivity (without spam triggers)
4. Personalization - Make it feel tailored and personal
5. Question-Based - Engage with a thought-provoking question

For each variation, predict the open rate (15-45% range) based on industry benchmarks.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          variations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                previewText: { type: Type.STRING },
                predictedOpenRate: { type: Type.NUMBER },
                style: { type: Type.STRING },
                rationale: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  const data = JSON.parse(res.text || '{}');
  return data.variations || [];
};

export const generateOptimizationRoadmap = async (
  gradingResult: GradingResult,
  subject: string,
  body: string
): Promise<OptimizationItem[]> => {
  const prompt = `Based on this email grading analysis, create a prioritized optimization roadmap.

Subject: ${subject}
Body: ${body.slice(0, 1000)}

Grading Summary:
- Overall Grade: ${gradingResult.overallGrade.grade}
- Inbox Score: ${gradingResult.inboxPlacementScore.score}
- Subject Grade: ${gradingResult.subjectLine.grade}
- Preview Grade: ${gradingResult.previewText.grade}
- Body Grade: ${gradingResult.bodyCopy.grade}
- CTA Grade: ${gradingResult.callToAction.grade}
- Spam Triggers Found: ${gradingResult.spamAnalysis?.length || 0}
- Structural Issues: ${gradingResult.structuralAnalysis?.length || 0}

Create a prioritized list of 5-8 optimization actions. Priority 1 = most impactful.
For each item, specify:
- The category (spam, subject, preview, body, cta, structure, personalization)
- The specific issue
- The impact if fixed (e.g., "+5-10 inbox score")
- The recommended action
- The action type: "quickfix" (word replacement), "rewrite" (AI rewrite needed), or "manual" (user action needed)
- If quickfix, include targetWord and replacement`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                priority: { type: Type.NUMBER },
                category: { type: Type.STRING },
                issue: { type: Type.STRING },
                impact: { type: Type.STRING },
                action: { type: Type.STRING },
                actionType: { type: Type.STRING },
                targetWord: { type: Type.STRING },
                replacement: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  const data = JSON.parse(res.text || '{}');
  return data.items || [];
};

export const rewriteWithTone = async (
  body: string,
  subject: string,
  preview: string,
  tone: 'professional' | 'friendly' | 'urgent' | 'fomo' | 'storytelling'
): Promise<ToneRewrite> => {
  const toneInstructions: Record<string, string> = {
    professional: 'Use formal, business-appropriate language. Be concise and authoritative. Focus on credibility and expertise.',
    friendly: 'Use warm, conversational language like talking to a friend. Add personality and be approachable. Use contractions naturally.',
    urgent: 'Create genuine urgency without spam triggers. Use time-sensitive language and emphasize immediate action benefits.',
    fomo: 'Emphasize exclusivity and what readers will miss out on. Use social proof and scarcity. Make them feel special for being included.',
    storytelling: 'Open with a mini-story or scenario. Create emotional connection. Use narrative techniques like tension and resolution.'
  };

  const prompt = `Rewrite this email with a ${tone.toUpperCase()} tone.

Tone Guidelines: ${toneInstructions[tone]}

Original Subject: ${subject}
Original Preview: ${preview}
Original Body:
${body}

Rewrite the entire email (subject, preview, and body) to match the ${tone} tone while:
1. Maintaining the core message and offer
2. Avoiding spam trigger words
3. Keeping it engaging and actionable
4. Optimizing for inbox placement`;

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
          body: { type: Type.STRING },
          toneNotes: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(res.text || '{}');
};

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

export const generateWarmupPlan = async (domain: string): Promise<WarmupPlan> => {
  const prompt = `Generate a comprehensive 30-day email warm-up plan for the domain: ${domain}

Create a detailed schedule that helps build sender reputation with inbox providers like Gmail, Outlook, and Yahoo.

The plan should include:
1. An overview explaining the importance of the warm-up process
2. Four phases: Foundation (Days 1-7), Growth (Days 8-14), Scale (Days 15-21), Optimization (Days 22-30)
3. A daily schedule with:
   - Email volume targets (starting very low, gradually increasing)
   - Target open rates and reply rates
   - Specific actions to take each day
   - Tips for success
   - Milestone markers for key days (Day 1, 7, 14, 21, 30)
4. Best practices for the warm-up period
5. Warning signals to watch for

Make the schedule realistic and follow industry best practices for email deliverability.

Return as JSON with this structure:
{
  "domain": "${domain}",
  "totalDays": 30,
  "overview": "Brief explanation of why warming up is important",
  "phases": [
    { "name": "Foundation", "days": "Days 1-7", "goal": "Build initial trust", "volumeRange": "10-50 emails/day" }
  ],
  "schedule": [
    {
      "day": 1,
      "phase": "Foundation",
      "emailVolume": 10,
      "targetOpenRate": 50,
      "targetReplyRate": 10,
      "actions": ["Send to your most engaged subscribers", "Focus on high-quality content"],
      "tips": ["Monitor bounce rates closely"],
      "milestone": "Day 1 - Launch"
    }
  ],
  "bestPractices": ["Always use double opt-in", "Keep bounce rate under 2%"],
  "warningSignals": ["Sudden drop in open rates", "Increase in spam complaints"]
}`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          domain: { type: Type.STRING },
          totalDays: { type: Type.NUMBER },
          overview: { type: Type.STRING },
          phases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                days: { type: Type.STRING },
                goal: { type: Type.STRING },
                volumeRange: { type: Type.STRING }
              }
            }
          },
          schedule: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                phase: { type: Type.STRING },
                emailVolume: { type: Type.NUMBER },
                targetOpenRate: { type: Type.NUMBER },
                targetReplyRate: { type: Type.NUMBER },
                actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                tips: { type: Type.ARRAY, items: { type: Type.STRING } },
                milestone: { type: Type.STRING }
              }
            }
          },
          bestPractices: { type: Type.ARRAY, items: { type: Type.STRING } },
          warningSignals: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(res.text || '{}');
};

export const generateEmailPreviews = async (
  subject: string,
  preview: string,
  senderName: string
): Promise<EmailPreview> => {
  const subjectLength = subject.length;
  const previewLength = preview.length;
  
  const truncationWarnings: string[] = [];
  
  if (subjectLength > 50) {
    truncationWarnings.push(`Subject will be truncated on mobile (${subjectLength} chars, max 50 recommended)`);
  }
  if (subjectLength > 70) {
    truncationWarnings.push(`Subject will be truncated on desktop Gmail (${subjectLength} chars, max 70 visible)`);
  }
  if (previewLength > 90) {
    truncationWarnings.push(`Preview text will be truncated on most clients (${previewLength} chars, max 90 recommended)`);
  }
  if (previewLength < 40) {
    truncationWarnings.push(`Preview text is short - email body may show (${previewLength} chars, 40-90 recommended)`);
  }

  const gmailDesktop = `${subject.slice(0, 70)}${subject.length > 70 ? '...' : ''} - ${preview.slice(0, 90)}`;
  const gmailMobile = `${subject.slice(0, 40)}${subject.length > 40 ? '...' : ''}`;
  
  const outlookDesktop = `${subject.slice(0, 60)}${subject.length > 60 ? '...' : ''} ${preview.slice(0, 50)}`;
  const outlookMobile = `${subject.slice(0, 35)}${subject.length > 35 ? '...' : ''}`;
  
  const appleDesktop = `${subject.slice(0, 65)}${subject.length > 65 ? '...' : ''} - ${preview.slice(0, 75)}`;
  const appleMobile = `${subject.slice(0, 38)}${subject.length > 38 ? '...' : ''}`;

  return {
    gmail: { inboxDisplay: gmailDesktop, mobileDisplay: gmailMobile },
    outlook: { inboxDisplay: outlookDesktop, mobileDisplay: outlookMobile },
    apple: { inboxDisplay: appleDesktop, mobileDisplay: appleMobile },
    characterCounts: {
      subject: subjectLength,
      preview: previewLength,
      subjectOptimal: subjectLength >= 30 && subjectLength <= 50,
      previewOptimal: previewLength >= 40 && previewLength <= 90
    },
    truncationWarnings
  };
};

interface SpamCheckResult {
  triggers: {
    word: string;
    reason: string;
    suggestions: string[];
    suggestion: string;
    severity: 'High' | 'Medium' | 'Low';
    rephraseExamples: string[];
  }[];
  overallRisk: 'Low' | 'Medium' | 'High';
  riskSummary: string;
  inboxProbability: number;
}

const spamCheckSchema = {
  type: Type.OBJECT,
  properties: {
    triggers: {
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
    overallRisk: { type: Type.STRING },
    riskSummary: { type: Type.STRING },
    inboxProbability: { type: Type.NUMBER }
  }
};

export const checkSpamTriggers = async (text: string, subject?: string, previewText?: string): Promise<SpamCheckResult> => {
  const fullContent = [
    subject ? `Subject: ${subject}` : '',
    previewText ? `Preview: ${previewText}` : '',
    `Body:\n${text}`
  ].filter(Boolean).join('\n\n');

  const prompt = `Analyze this email content for spam trigger words and phrases that could cause it to land in spam or promotions folders.

${fullContent}

Identify ALL potential spam triggers including:
1. Sales/marketing language ("buy now", "limited time", "act fast", etc.)
2. Money-related terms ("free", "discount", "$$$", "cheap", etc.)
3. Urgency/scarcity phrases ("hurry", "expires", "don't miss", etc.)
4. Excessive punctuation patterns (!!!, ???, ALL CAPS)
5. Suspicious phrases ("click here", "no obligation", "guaranteed", etc.)
6. Over-promising language ("100%", "amazing results", "miracle", etc.)

For each trigger found:
- Identify the exact word/phrase
- Explain why it triggers spam filters
- Provide 3-5 safer alternative words
- Give the single best replacement
- Rate severity: High (likely spam folder), Medium (promotions risk), Low (slight concern)
- Provide 1-2 examples of how to rephrase the sentence

Also provide:
- overallRisk: Low (0-2 triggers), Medium (3-5 triggers), High (6+ or any high severity)
- riskSummary: A brief explanation of the overall spam risk
- inboxProbability: 0-100 score estimating chance of reaching primary inbox`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: spamCheckSchema
    }
  });

  const result = JSON.parse(res.text || '{}');
  return {
    triggers: result.triggers || [],
    overallRisk: result.overallRisk || 'Low',
    riskSummary: result.riskSummary || 'No significant spam triggers detected.',
    inboxProbability: result.inboxProbability || 85
  };
};

// Advanced Spam Analysis for Pro tier - includes ISP-specific patterns, link analysis, and reputation scoring
export interface AdvancedSpamCheckResult extends SpamCheckResult {
  ispAnalysis: {
    gmail: { score: number; issues: string[]; recommendations: string[] };
    outlook: { score: number; issues: string[]; recommendations: string[] };
    yahoo: { score: number; issues: string[]; recommendations: string[] };
  };
  linkAnalysis: {
    totalLinks: number;
    suspiciousLinks: string[];
    shortenedLinks: string[];
    recommendations: string[];
  };
  authenticationImpact: {
    spfRequired: boolean;
    dkimRequired: boolean;
    dmarcRequired: boolean;
    recommendations: string[];
  };
  industryRisks: {
    industry: string;
    specificTriggers: string[];
    complianceNotes: string[];
  };
  competitiveInsight: string;
}

const advancedSpamCheckSchema = {
  type: Type.OBJECT,
  properties: {
    triggers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          reason: { type: Type.STRING },
          alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
          bestReplacement: { type: Type.STRING },
          severity: { type: Type.STRING },
          rephraseExamples: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
    overallRisk: { type: Type.STRING },
    riskSummary: { type: Type.STRING },
    inboxProbability: { type: Type.NUMBER },
    ispAnalysis: {
      type: Type.OBJECT,
      properties: {
        gmail: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            issues: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        outlook: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            issues: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        yahoo: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            issues: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    },
    linkAnalysis: {
      type: Type.OBJECT,
      properties: {
        totalLinks: { type: Type.NUMBER },
        suspiciousLinks: { type: Type.ARRAY, items: { type: Type.STRING } },
        shortenedLinks: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    authenticationImpact: {
      type: Type.OBJECT,
      properties: {
        spfRequired: { type: Type.BOOLEAN },
        dkimRequired: { type: Type.BOOLEAN },
        dmarcRequired: { type: Type.BOOLEAN },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    industryRisks: {
      type: Type.OBJECT,
      properties: {
        industry: { type: Type.STRING },
        specificTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
        complianceNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    competitiveInsight: { type: Type.STRING }
  }
};

export const checkSpamTriggersAdvanced = async (text: string, subject?: string, previewText?: string): Promise<AdvancedSpamCheckResult> => {
  const fullContent = [
    subject ? `Subject: ${subject}` : '',
    previewText ? `Preview: ${previewText}` : '',
    `Body:\n${text}`
  ].filter(Boolean).join('\n\n');

  const prompt = `You are an expert email deliverability consultant. Perform a comprehensive advanced spam analysis on this email content.

${fullContent}

Provide a DETAILED analysis including:

## 1. SPAM TRIGGERS (same as basic)
Identify ALL spam trigger words/phrases with severity, alternatives, and rephrase examples.

## 2. ISP-SPECIFIC ANALYSIS
Analyze how this email would perform with each major ISP:
- **Gmail**: Score 0-100, specific issues with Gmail's filters (promotions tab, spam), recommendations
- **Outlook/Microsoft**: Score 0-100, specific issues with Microsoft's filters (Focused inbox, spam), recommendations  
- **Yahoo/AOL**: Score 0-100, specific issues with Verizon Media filters, recommendations

## 3. LINK ANALYSIS
- Count all links in the email
- Identify suspicious links (unusual domains, redirects)
- Flag shortened URLs (bit.ly, tinyurl, etc.)
- Provide recommendations for link best practices

## 4. AUTHENTICATION IMPACT
Based on email content, assess:
- Would SPF authentication significantly help deliverability?
- Would DKIM signing be critical for this email type?
- Is DMARC policy important for this sender type?
- Specific recommendations for authentication setup

## 5. INDUSTRY-SPECIFIC RISKS
- Detect the likely industry (ecommerce, SaaS, finance, health, etc.)
- Identify industry-specific spam triggers and compliance issues
- Note relevant regulations (CAN-SPAM, GDPR, CCPA considerations)

## 6. COMPETITIVE INSIGHT
Provide a 1-2 sentence insight on how this email compares to industry best practices and what top performers do differently.

Provide overall risk assessment and inbox probability (0-100).`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: advancedSpamCheckSchema
    }
  });

  const result = JSON.parse(res.text || '{}');
  
  return {
    triggers: result.triggers || [],
    overallRisk: result.overallRisk || 'Low',
    riskSummary: result.riskSummary || 'No significant spam triggers detected.',
    inboxProbability: result.inboxProbability || 85,
    ispAnalysis: result.ispAnalysis || {
      gmail: { score: 85, issues: [], recommendations: [] },
      outlook: { score: 85, issues: [], recommendations: [] },
      yahoo: { score: 85, issues: [], recommendations: [] }
    },
    linkAnalysis: result.linkAnalysis || {
      totalLinks: 0,
      suspiciousLinks: [],
      shortenedLinks: [],
      recommendations: []
    },
    authenticationImpact: result.authenticationImpact || {
      spfRequired: true,
      dkimRequired: true,
      dmarcRequired: false,
      recommendations: []
    },
    industryRisks: result.industryRisks || {
      industry: 'General',
      specificTriggers: [],
      complianceNotes: []
    },
    competitiveInsight: result.competitiveInsight || 'Email follows standard best practices.'
  };
};

interface SentimentAnalysisResult {
  overallSentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
  sentimentScore: number;
  emotionBreakdown: {
    emotion: string;
    percentage: number;
    description: string;
  }[];
  toneDescription: string;
  engagementPrediction: number;
  emotionalTriggers: string[];
  improvements: {
    section: string;
    currentTone: string;
    suggestedTone: string;
    originalText: string;
    improvedText: string;
    reason: string;
  }[];
  summary: string;
}

const sentimentAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    overallSentiment: { type: Type.STRING },
    sentimentScore: { type: Type.NUMBER },
    emotionBreakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          emotion: { type: Type.STRING },
          percentage: { type: Type.NUMBER },
          description: { type: Type.STRING }
        }
      }
    },
    toneDescription: { type: Type.STRING },
    engagementPrediction: { type: Type.NUMBER },
    emotionalTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING },
          currentTone: { type: Type.STRING },
          suggestedTone: { type: Type.STRING },
          originalText: { type: Type.STRING },
          improvedText: { type: Type.STRING },
          reason: { type: Type.STRING }
        }
      }
    },
    summary: { type: Type.STRING }
  }
};

export const analyzeSentiment = async (text: string, subject?: string, previewText?: string): Promise<SentimentAnalysisResult> => {
  const fullContent = [
    subject ? `Subject: ${subject}` : '',
    previewText ? `Preview: ${previewText}` : '',
    `Body:\n${text}`
  ].filter(Boolean).join('\n\n');

  const prompt = `Analyze the emotional tone and sentiment of this email content to help improve reader engagement.

${fullContent}

Provide a comprehensive sentiment analysis including:

1. **Overall Sentiment**: Classify as Positive, Neutral, Negative, or Mixed
2. **Sentiment Score**: -100 (very negative) to +100 (very positive)
3. **Emotion Breakdown**: Identify the top 3-5 emotions present (e.g., excitement, urgency, trust, fear, curiosity) with percentages that sum to 100%
4. **Tone Description**: A brief description of the overall tone (e.g., "Professional yet warm", "Urgent and action-oriented")
5. **Engagement Prediction**: 0-100 score predicting how likely readers are to engage positively
6. **Emotional Triggers**: List specific words/phrases that evoke strong emotions
7. **Improvements**: Suggest 2-4 specific improvements to enhance emotional engagement:
   - Identify the section (subject, preview, opening, body, CTA, closing)
   - Note the current tone
   - Suggest a better tone
   - Show the original text
   - Provide an improved version
   - Explain why this change helps
8. **Summary**: A brief 2-3 sentence summary of the emotional impact and key recommendations

Focus on actionable insights that will help the email connect better with recipients and drive desired actions.`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: sentimentAnalysisSchema
    }
  });

  const result = JSON.parse(res.text || '{}');
  return {
    overallSentiment: result.overallSentiment || 'Neutral',
    sentimentScore: result.sentimentScore || 0,
    emotionBreakdown: result.emotionBreakdown || [],
    toneDescription: result.toneDescription || 'Unable to determine tone',
    engagementPrediction: result.engagementPrediction || 50,
    emotionalTriggers: result.emotionalTriggers || [],
    improvements: result.improvements || [],
    summary: result.summary || 'Analysis complete.'
  };
};

// Sender Score Estimator
const senderScoreSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER },
    grade: { type: Type.STRING },
    categories: {
      type: Type.OBJECT,
      properties: {
        authentication: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          }
        },
        listHygiene: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          }
        },
        engagement: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          }
        },
        infrastructure: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          }
        },
        bestPractices: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          }
        }
      }
    },
    topIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    comparisonToIndustry: { type: Type.STRING }
  }
};

export const estimateSenderScore = async (input: SenderScoreInput): Promise<SenderScoreResult> => {
  const prompt = `Analyze this email sender's practices and estimate their sender reputation score.

Domain: ${input.domain}

AUTHENTICATION:
- SPF configured: ${input.hasSpf ? 'Yes' : 'No'}
- DKIM configured: ${input.hasDkim ? 'Yes' : 'No'}
- DMARC configured: ${input.hasDmarc ? 'Yes' : 'No'}

LIST & ENGAGEMENT:
- List size: ${input.listSize.toLocaleString()} subscribers
- Average open rate: ${input.avgOpenRate}%
- Average bounce rate: ${input.avgBounceRate}%
- Average complaint rate: ${input.avgComplaintRate}%
- List age: ${input.listAgeMonths} months

INFRASTRUCTURE & PRACTICES:
- Sending frequency: ${input.sendingFrequency}
- Uses double opt-in: ${input.usesDoubleOptIn ? 'Yes' : 'No'}
- Has unsubscribe link: ${input.hasUnsubscribeLink ? 'Yes' : 'No'}
- Sends from dedicated IP: ${input.sendsFromDedicatedIp ? 'Yes' : 'No'}

Provide a comprehensive sender reputation analysis:

1. **Overall Score** (0-100): Based on all factors, estimate their sender score
2. **Grade**: A+, A, B+, B, C+, C, D, or F
3. **Category Scores** (0-100 each with specific feedback):
   - Authentication: SPF, DKIM, DMARC setup
   - List Hygiene: Bounce rates, complaint rates, list maintenance
   - Engagement: Open rates compared to industry benchmarks
   - Infrastructure: Dedicated IP, sending patterns
   - Best Practices: Double opt-in, unsubscribe compliance
4. **Top Issues**: List the 3-5 most critical issues hurting their reputation
5. **Recommendations**: Provide 4-6 actionable steps to improve their score
6. **Industry Comparison**: How they compare to average email senders

Industry benchmarks:
- Average open rate: 20-25%
- Good bounce rate: <2%
- Acceptable complaint rate: <0.1%
- All three auth protocols (SPF, DKIM, DMARC) should be configured`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: senderScoreSchema
    }
  });

  const result = JSON.parse(res.text || '{}');
  return {
    overallScore: result.overallScore || 50,
    grade: result.grade || 'C',
    categories: result.categories || {
      authentication: { score: 0, feedback: 'Unable to analyze' },
      listHygiene: { score: 0, feedback: 'Unable to analyze' },
      engagement: { score: 0, feedback: 'Unable to analyze' },
      infrastructure: { score: 0, feedback: 'Unable to analyze' },
      bestPractices: { score: 0, feedback: 'Unable to analyze' }
    },
    topIssues: result.topIssues || [],
    recommendations: result.recommendations || [],
    comparisonToIndustry: result.comparisonToIndustry || 'Unable to compare'
  };
};
