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
    const parsed = JSON.parse(jsonString) as RewrittenEmail;
    
    // Convert literal \n sequences to actual newlines
    return {
      subject: parsed.subject?.replace(/\\n/g, '\n') || '',
      previewText: parsed.previewText?.replace(/\\n/g, '\n') || '',
      body: parsed.body?.replace(/\\n/g, '\n') || '',
    };

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
        const parsed = JSON.parse(jsonString) as FollowUpEmail;
        
        // Convert literal \n sequences to actual newlines
        return {
            subject: parsed.subject?.replace(/\\n/g, '\n') || '',
            body: parsed.body?.replace(/\\n/g, '\n') || '',
        };

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
            // Convert literal \n sequences to actual newlines in each email
            return parsedResult.map((email: FollowUpSequenceEmail) => ({
                ...email,
                subject: email.subject?.replace(/\\n/g, '\n') || '',
                body: email.body?.replace(/\\n/g, '\n') || '',
            })) as FollowUpSequenceEmail[];
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
  // Fix AI sometimes returning decimals (0.32) instead of percentages (32)
  const variations = data.variations || [];
  return variations.map((v: SubjectVariation) => ({
    ...v,
    predictedOpenRate: v.predictedOpenRate < 1 ? Math.round(v.predictedOpenRate * 100) : Math.round(v.predictedOpenRate)
  }));
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
  const parsed = JSON.parse(res.text || '{}');
  
  // Convert literal \n sequences to actual newlines
  return {
    subject: parsed.subject?.replace(/\\n/g, '\n') || '',
    previewText: parsed.previewText?.replace(/\\n/g, '\n') || '',
    body: parsed.body?.replace(/\\n/g, '\n') || '',
    toneNotes: parsed.toneNotes || '',
  };
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

// Competitor Email Analysis
import type { CompetitorAnalysisResult, InboxPlacementSimulation } from "@shared/schema";

const competitorAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    strengths: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING },
          explanation: { type: Type.STRING },
          howToApply: { type: Type.STRING },
        }
      }
    },
    weaknesses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING },
          explanation: { type: Type.STRING },
          yourOpportunity: { type: Type.STRING },
        }
      }
    },
    tactics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tactic: { type: Type.STRING },
          description: { type: Type.STRING },
          effectiveness: { type: Type.STRING },
        }
      }
    },
    overallAssessment: { type: Type.STRING },
    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
  }
};

export const analyzeCompetitorEmail = async (competitorEmail: string): Promise<CompetitorAnalysisResult> => {
  const prompt = `Analyze this competitor's marketing email and provide actionable insights for improving my own email marketing.

COMPETITOR EMAIL:
${competitorEmail}

Provide a comprehensive competitive analysis:

1. **Strengths** (3-5 items): What does this email do well? For each:
   - point: The strength
   - explanation: Why it's effective
   - howToApply: How you can apply this to your own emails

2. **Weaknesses** (3-5 items): What could be improved? For each:
   - point: The weakness
   - explanation: Why it hurts the email's effectiveness
   - yourOpportunity: How you can capitalize on this in your emails

3. **Tactics**: What persuasion/marketing tactics are being used? For each:
   - tactic: Name of the tactic
   - description: How it's implemented
   - effectiveness: 'High', 'Medium', or 'Low'

4. **Overall Assessment**: A 2-3 sentence summary of the email's effectiveness

5. **Key Takeaways**: 4-6 bullet points of the most important lessons

6. **Suggested Improvements**: 4-6 specific ways to beat this competitor's emails`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: competitorAnalysisSchema
    }
  });

  const result = JSON.parse(res.text || '{}');
  return {
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    tactics: result.tactics || [],
    overallAssessment: result.overallAssessment || 'Unable to analyze',
    keyTakeaways: result.keyTakeaways || [],
    suggestedImprovements: result.suggestedImprovements || [],
  };
};

// Inbox Placement Simulation - Enhanced with additional analysis factors
const providerAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    placement: { type: Type.STRING },
    confidence: { type: Type.NUMBER },
    confidenceBreakdown: {
      type: Type.OBJECT,
      properties: {
        contentScore: { type: Type.NUMBER },
        structureScore: { type: Type.NUMBER },
        authenticationScore: { type: Type.NUMBER },
        reputationScore: { type: Type.NUMBER },
      }
    },
    factors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING },
          impact: { type: Type.STRING },
          weight: { type: Type.NUMBER },
          explanation: { type: Type.STRING },
        }
      }
    },
    providerSpecificNotes: { type: Type.STRING },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
  }
};

const inboxPlacementSchema = {
  type: Type.OBJECT,
  properties: {
    gmail: providerAnalysisSchema,
    outlook: providerAnalysisSchema,
    yahoo: providerAnalysisSchema,
    appleMail: providerAnalysisSchema,
    overallScore: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    topRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
    topOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
    htmlAnalysis: {
      type: Type.OBJECT,
      properties: {
        hasInlineStyles: { type: Type.BOOLEAN },
        usesTableLayout: { type: Type.BOOLEAN },
        hasExternalResources: { type: Type.BOOLEAN },
        cssComplexity: { type: Type.STRING },
        structureScore: { type: Type.NUMBER },
        issues: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
      }
    },
    imageTextRatio: {
      type: Type.OBJECT,
      properties: {
        ratio: { type: Type.NUMBER },
        rating: { type: Type.STRING },
        estimatedImageCount: { type: Type.NUMBER },
        textPercentage: { type: Type.NUMBER },
        recommendation: { type: Type.STRING },
      }
    },
    authenticationImpact: {
      type: Type.OBJECT,
      properties: {
        spfImpact: { type: Type.STRING },
        dkimImpact: { type: Type.STRING },
        dmarcImpact: { type: Type.STRING },
        overallAuthScore: { type: Type.NUMBER },
        missingAuthentication: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendation: { type: Type.STRING },
      }
    },
    patternMatching: {
      type: Type.OBJECT,
      properties: {
        matchedPatterns: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pattern: { type: Type.STRING },
              category: { type: Type.STRING },
              severity: { type: Type.STRING },
              description: { type: Type.STRING },
            }
          }
        },
        spamSignatureScore: { type: Type.NUMBER },
        promotionalSignatureScore: { type: Type.NUMBER },
        transactionalSignatureScore: { type: Type.NUMBER },
        personalSignatureScore: { type: Type.NUMBER },
        dominantCategory: { type: Type.STRING },
      }
    },
  }
};

export const simulateInboxPlacement = async (
  subject: string,
  previewText: string,
  body: string,
  domain?: string
): Promise<InboxPlacementSimulation> => {
  const prompt = `Perform a comprehensive inbox placement simulation for this email across major email providers.

SUBJECT: ${subject}
PREVIEW TEXT: ${previewText}
BODY:
${body}

${domain ? `SENDING DOMAIN: ${domain}` : 'SENDING DOMAIN: Not provided (assume typical sender)'}

## PROVIDER-SPECIFIC ANALYSIS

For each provider (Gmail, Outlook, Yahoo, Apple Mail), provide:

1. **Placement**: 
   - Gmail: Primary, Promotions, Social, Updates, or Spam
   - Outlook: Focused, Other, or Junk
   - Yahoo: Inbox or Spam
   - Apple Mail: Inbox or Junk

2. **Confidence**: 0-100% overall confidence in this prediction

3. **Confidence Breakdown** (0-100 each):
   - contentScore: Based on email copy quality and spam signals
   - structureScore: Based on HTML/formatting quality
   - authenticationScore: Based on expected authentication (SPF/DKIM/DMARC)
   - reputationScore: Based on domain reputation signals

4. **Factors**: 4-6 weighted factors influencing this decision:
   - factor: The factor name
   - impact: 'Positive', 'Negative', or 'Neutral'
   - weight: 0-100 (importance of this factor)
   - explanation: Detailed explanation of why this factor matters for THIS specific provider

5. **Provider-Specific Notes**: Unique considerations for this provider's filtering algorithms

6. **Recommendations**: 3-4 specific, actionable tips for this provider

## HTML STRUCTURE ANALYSIS

Analyze the email's HTML structure:
- hasInlineStyles: Does it use inline CSS styles?
- usesTableLayout: Does it use table-based layouts (common in email)?
- hasExternalResources: Are there external images, CSS, or scripts?
- cssComplexity: 'Simple', 'Moderate', or 'Complex'
- structureScore: 0-100 overall HTML quality score
- issues: List of specific HTML/structure problems found
- recommendations: How to improve the HTML structure

## IMAGE-TO-TEXT RATIO ANALYSIS

Analyze the balance between images and text:
- ratio: Decimal ratio (e.g., 0.3 means 30% images, 70% text)
- rating: 'Excellent', 'Good', 'Fair', 'Poor', or 'Critical'
- estimatedImageCount: Number of images detected/implied
- textPercentage: Percentage of content that is readable text
- recommendation: Specific advice to improve the ratio

## AUTHENTICATION IMPACT ANALYSIS

Analyze how email authentication affects deliverability:
- spfImpact: 'Critical', 'High', 'Medium', or 'Low' - how much SPF affects this email
- dkimImpact: 'Critical', 'High', 'Medium', or 'Low' - how much DKIM affects this email
- dmarcImpact: 'Critical', 'High', 'Medium', or 'Low' - how much DMARC affects this email
- overallAuthScore: 0-100 expected authentication score
- missingAuthentication: List any authentication that appears to be missing
- recommendation: Authentication setup advice

## PATTERN MATCHING ANALYSIS

Identify spam and category patterns:
- matchedPatterns: Array of detected patterns with:
  - pattern: Name/description of the pattern
  - category: 'Spam', 'Promotional', 'Transactional', or 'Personal'
  - severity: 'High', 'Medium', or 'Low'
  - description: Why this pattern was detected
- spamSignatureScore: 0-100 how much this looks like spam
- promotionalSignatureScore: 0-100 how much this looks promotional
- transactionalSignatureScore: 0-100 how much this looks transactional
- personalSignatureScore: 0-100 how much this looks like personal mail
- dominantCategory: The most likely category for this email

## OVERALL ANALYSIS

- **Overall Score**: 0-100 comprehensive deliverability score
- **Summary**: 3-4 sentence summary covering key findings
- **Top Risks**: 4-6 specific, prioritized deliverability risks
- **Top Opportunities**: 4-6 actionable improvements ranked by impact`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: inboxPlacementSchema
    }
  });

  const result = JSON.parse(res.text || '{}');
  
  const defaultConfidenceBreakdown = {
    contentScore: 50,
    structureScore: 50,
    authenticationScore: 50,
    reputationScore: 50,
  };

  const defaultHtmlAnalysis = {
    hasInlineStyles: false,
    usesTableLayout: false,
    hasExternalResources: false,
    cssComplexity: 'Simple' as const,
    structureScore: 50,
    issues: [] as string[],
    recommendations: [] as string[],
  };

  const defaultImageTextRatio = {
    ratio: 0,
    rating: 'Good' as const,
    estimatedImageCount: 0,
    textPercentage: 100,
    recommendation: '',
  };

  const defaultAuthImpact = {
    spfImpact: 'Medium' as const,
    dkimImpact: 'Medium' as const,
    dmarcImpact: 'Medium' as const,
    overallAuthScore: 50,
    missingAuthentication: [] as string[],
    recommendation: '',
  };

  const defaultPatternMatching = {
    matchedPatterns: [] as Array<{ pattern: string; category: string; severity: string; description: string }>,
    spamSignatureScore: 0,
    promotionalSignatureScore: 0,
    transactionalSignatureScore: 0,
    personalSignatureScore: 0,
    dominantCategory: 'Personal' as const,
  };

  const parseProviderResult = (provider: any, defaultPlacement: string) => ({
    placement: provider?.placement || defaultPlacement,
    confidence: provider?.confidence ?? 50,
    confidenceBreakdown: provider?.confidenceBreakdown ? {
      contentScore: provider.confidenceBreakdown.contentScore ?? 50,
      structureScore: provider.confidenceBreakdown.structureScore ?? 50,
      authenticationScore: provider.confidenceBreakdown.authenticationScore ?? 50,
      reputationScore: provider.confidenceBreakdown.reputationScore ?? 50,
    } : defaultConfidenceBreakdown,
    factors: (provider?.factors || []).map((f: any) => ({
      factor: f.factor || '',
      impact: f.impact || 'Neutral',
      weight: f.weight ?? 50,
      explanation: f.explanation || '',
    })),
    providerSpecificNotes: provider?.providerSpecificNotes || '',
    recommendations: provider?.recommendations || [],
  });

  return {
    gmail: parseProviderResult(result.gmail, 'Promotions'),
    outlook: parseProviderResult(result.outlook, 'Other'),
    yahoo: parseProviderResult(result.yahoo, 'Inbox'),
    appleMail: parseProviderResult(result.appleMail, 'Inbox'),
    overallScore: result.overallScore ?? 50,
    summary: result.summary || 'Unable to analyze',
    topRisks: result.topRisks || [],
    topOpportunities: result.topOpportunities || [],
    htmlAnalysis: result.htmlAnalysis ? {
      hasInlineStyles: result.htmlAnalysis.hasInlineStyles ?? false,
      usesTableLayout: result.htmlAnalysis.usesTableLayout ?? false,
      hasExternalResources: result.htmlAnalysis.hasExternalResources ?? false,
      cssComplexity: result.htmlAnalysis.cssComplexity || 'Simple',
      structureScore: result.htmlAnalysis.structureScore ?? 50,
      issues: result.htmlAnalysis.issues || [],
      recommendations: result.htmlAnalysis.recommendations || [],
    } : defaultHtmlAnalysis,
    imageTextRatio: result.imageTextRatio ? {
      ratio: result.imageTextRatio.ratio ?? 0,
      rating: result.imageTextRatio.rating || 'Good',
      estimatedImageCount: result.imageTextRatio.estimatedImageCount ?? 0,
      textPercentage: result.imageTextRatio.textPercentage ?? 100,
      recommendation: result.imageTextRatio.recommendation || '',
    } : defaultImageTextRatio,
    authenticationImpact: result.authenticationImpact ? {
      spfImpact: result.authenticationImpact.spfImpact || 'Medium',
      dkimImpact: result.authenticationImpact.dkimImpact || 'Medium',
      dmarcImpact: result.authenticationImpact.dmarcImpact || 'Medium',
      overallAuthScore: result.authenticationImpact.overallAuthScore ?? 50,
      missingAuthentication: result.authenticationImpact.missingAuthentication || [],
      recommendation: result.authenticationImpact.recommendation || '',
    } : defaultAuthImpact,
    patternMatching: result.patternMatching ? {
      matchedPatterns: (result.patternMatching.matchedPatterns || []).map((p: any) => ({
        pattern: p.pattern || '',
        category: p.category || 'Personal',
        severity: p.severity || 'Low',
        description: p.description || '',
      })),
      spamSignatureScore: result.patternMatching.spamSignatureScore ?? 0,
      promotionalSignatureScore: result.patternMatching.promotionalSignatureScore ?? 0,
      transactionalSignatureScore: result.patternMatching.transactionalSignatureScore ?? 0,
      personalSignatureScore: result.patternMatching.personalSignatureScore ?? 0,
      dominantCategory: result.patternMatching.dominantCategory || 'Personal',
    } : defaultPatternMatching,
  };
};

// Send Time Optimizer
const sendTimeSchema = {
  type: Type.OBJECT,
  properties: {
    bestTimes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          hour: { type: Type.STRING },
          score: { type: Type.NUMBER },
          reason: { type: Type.STRING }
        }
      }
    },
    worstTimes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          hour: { type: Type.STRING },
          score: { type: Type.NUMBER },
          reason: { type: Type.STRING }
        }
      }
    },
    timezone: { type: Type.STRING },
    industryInsight: { type: Type.STRING },
    summary: { type: Type.STRING }
  }
};

export const optimizeSendTime = async (emailContent: string, industry?: string, audienceType?: string) => {
  const prompt = `Analyze this email and recommend the optimal send times for maximum engagement.

Email Content:
${emailContent}

${industry ? `Industry: ${industry}` : ''}
${audienceType ? `Audience Type: ${audienceType}` : ''}

Provide:
1. Top 3 best times to send (day of week + hour in 12h format)
2. Top 2 worst times to avoid
3. Consider the email content, industry trends, and audience behavior
4. Each time slot should have a score (0-100) and reason
5. Provide industry-specific insights
6. Assume US timezones unless specified`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: sendTimeSchema
    }
  });

  return JSON.parse(res.text || '{}');
};

// Engagement Predictor
const engagementSchema = {
  type: Type.OBJECT,
  properties: {
    predictedOpenRate: { type: Type.NUMBER },
    predictedClickRate: { type: Type.NUMBER },
    predictedUnsubscribeRate: { type: Type.NUMBER },
    engagementScore: { type: Type.NUMBER },
    factors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING },
          impact: { type: Type.STRING },
          weight: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        }
      }
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING }
  }
};

export const predictEngagement = async (subject: string, preview: string, body: string, industry?: string) => {
  const prompt = `Predict the engagement metrics for this email campaign.

Subject Line: ${subject}
Preview Text: ${preview}
Body: ${body}
${industry ? `Industry: ${industry}` : ''}

Analyze and predict:
1. Predicted Open Rate (0-100%)
2. Predicted Click-Through Rate (0-100%)
3. Predicted Unsubscribe Rate (0-5%)
4. Overall Engagement Score (0-100)
5. List the top factors affecting engagement with their impact (positive/negative/neutral) and weight (0-100)
6. Provide actionable recommendations to improve engagement
7. Write a summary of the engagement potential`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: engagementSchema
    }
  });

  return JSON.parse(res.text || '{}');
};

// Industry Benchmarking
const industryBenchmarkSchema = {
  type: Type.OBJECT,
  properties: {
    industry: { type: Type.STRING },
    yourScore: { type: Type.NUMBER },
    industryAverage: { type: Type.NUMBER },
    topPerformers: { type: Type.NUMBER },
    percentile: { type: Type.NUMBER },
    metrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          metric: { type: Type.STRING },
          yourValue: { type: Type.STRING },
          benchmark: { type: Type.STRING },
          status: { type: Type.STRING },
          tip: { type: Type.STRING }
        }
      }
    },
    summary: { type: Type.STRING }
  }
};

export const compareToIndustry = async (emailContent: string, subject: string, industry: string, overallScore: number) => {
  const prompt = `Compare this email against ${industry} industry benchmarks.

Subject: ${subject}
Email Content: ${emailContent}
Current Overall Score: ${overallScore}

Analyze against ${industry} industry standards and provide:
1. Industry name
2. The email's score normalized for this industry
3. Industry average score (based on typical email marketing performance)
4. Top performers score threshold
5. Where this email ranks (percentile)
6. Compare at least 5 key metrics (subject length, personalization, CTA clarity, mobile-friendliness, spam risk) with benchmarks
7. For each metric, indicate if it's above/at/below benchmark and provide an improvement tip
8. Summarize how this email compares to industry standards`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: industryBenchmarkSchema
    }
  });

  return JSON.parse(res.text || '{}');
};

// Reputation Insights
const reputationSchema = {
  type: Type.OBJECT,
  properties: {
    overallHealth: { type: Type.STRING },
    score: { type: Type.NUMBER },
    factors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING },
          status: { type: Type.STRING },
          description: { type: Type.STRING },
          actionItem: { type: Type.STRING }
        }
      }
    },
    tips: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING }
  }
};

export const analyzeReputation = async (emailContent: string, domain?: string, historicalData?: any) => {
  const prompt = `Analyze the sender reputation signals from this email content.

Email Content: ${emailContent}
${domain ? `Sender Domain: ${domain}` : ''}

Evaluate reputation factors based on email content:
1. Overall Health (Excellent/Good/Fair/Poor)
2. Reputation Score (0-100)
3. Analyze these factors and their status (good/warning/critical):
   - Authentication signals (SPF, DKIM, DMARC mentions)
   - Content quality (spam triggers, professionalism)
   - List hygiene indicators
   - Engagement optimization
   - Unsubscribe compliance
   - Link quality
4. Provide actionable items for each factor
5. List 3-5 quick tips to improve reputation
6. Summarize the overall reputation health`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: reputationSchema
    }
  });

  return JSON.parse(res.text || '{}');
};

// ESP Stats Analysis Schema
const espStatsAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    overallHealth: { type: Type.STRING, description: "Overall health rating: Excellent, Good, Fair, or Poor" },
    healthScore: { type: Type.NUMBER, description: "Overall health score from 0-100" },
    summary: { type: Type.STRING, description: "Brief 1-2 sentence summary in simple language" },
    strengths: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Key strengths - short, simple sentences"
    },
    concerns: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Areas needing attention - short, simple sentences"
    },
    senderReputation: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "Estimated sender reputation 0-100 based on engagement data" },
        status: { type: Type.STRING, description: "Excellent, Good, Fair, or Poor" },
        explanation: { type: Type.STRING, description: "Simple explanation of what this means" }
      }
    },
    domainHealth: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "Domain health score 0-100 based on bounce rates and engagement" },
        status: { type: Type.STRING, description: "Healthy, At Risk, or Critical" },
        listQuality: { type: Type.STRING, description: "Clean, Needs Attention, or Poor based on bounces" },
        explanation: { type: Type.STRING, description: "Simple explanation" }
      }
    },
    spamRisk: {
      type: Type.OBJECT,
      properties: {
        level: { type: Type.STRING, description: "Low, Medium, or High" },
        score: { type: Type.NUMBER, description: "Spam risk score 0-100 (lower is better)" },
        factors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Risk factors if any" },
        explanation: { type: Type.STRING, description: "Simple explanation" }
      }
    },
    inboxPlacementInsights: {
      type: Type.OBJECT,
      properties: {
        estimatedInboxRate: { type: Type.NUMBER, description: "Estimated inbox placement rate 0-100" },
        gmailPrediction: { type: Type.STRING, description: "Primary, Promotions, or Spam" },
        gmailConfidence: { type: Type.NUMBER, description: "Confidence percentage 0-100" },
        outlookPrediction: { type: Type.STRING, description: "Focused, Other, or Junk" },
        outlookConfidence: { type: Type.NUMBER, description: "Confidence percentage 0-100" },
        yahooPrediction: { type: Type.STRING, description: "Inbox or Spam" },
        yahooConfidence: { type: Type.NUMBER, description: "Confidence percentage 0-100" },
        promotionsRisk: { type: Type.NUMBER, description: "Chance of landing in Promotions tab 0-100" },
        spamRisk: { type: Type.NUMBER, description: "Chance of landing in Spam 0-100" },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    engagementScore: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "Overall engagement score 0-100" },
        status: { type: Type.STRING, description: "Excellent, Good, Average, or Poor" },
        openEngagement: { type: Type.STRING, description: "Strong, Average, or Weak" },
        clickEngagement: { type: Type.STRING, description: "Strong, Average, or Weak" },
        trend: { type: Type.STRING, description: "Improving, Stable, or Declining based on campaign data" }
      }
    },
    engagementAnalysis: {
      type: Type.OBJECT,
      properties: {
        openRateAssessment: { type: Type.STRING, description: "Above Average, Average, or Below Average" },
        clickRateAssessment: { type: Type.STRING, description: "Assessment of click rates" },
        bounceRateAssessment: { type: Type.STRING, description: "Assessment of bounce rates" },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    actionableRecommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          priority: { type: Type.STRING, description: "Priority: High, Medium, or Low" },
          category: { type: Type.STRING, description: "Category: Content, Timing, List Health, Technical, or Engagement" },
          recommendation: { type: Type.STRING, description: "Specific actionable recommendation in simple language" },
          expectedImpact: { type: Type.STRING, description: "Expected impact in simple terms" }
        }
      }
    },
    benchmarkComparison: {
      type: Type.OBJECT,
      properties: {
        openRateVsIndustry: { type: Type.STRING, description: "Simple comparison like '10% above average'" },
        clickRateVsIndustry: { type: Type.STRING, description: "Simple comparison" },
        bounceRateVsIndustry: { type: Type.STRING, description: "Simple comparison" }
      }
    }
  }
};

export interface ESPStatsAnalysis {
  overallHealth: string;
  healthScore: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  senderReputation: {
    score: number;
    status: string;
    explanation: string;
  };
  domainHealth: {
    score: number;
    status: string;
    listQuality: string;
    explanation: string;
  };
  spamRisk: {
    level: string;
    score: number;
    factors: string[];
    explanation: string;
  };
  inboxPlacementInsights: {
    estimatedInboxRate: number;
    gmailPrediction: string;
    gmailConfidence: number;
    outlookPrediction: string;
    outlookConfidence: number;
    yahooPrediction: string;
    yahooConfidence: number;
    promotionsRisk: number;
    spamRisk: number;
    recommendations: string[];
  };
  engagementScore: {
    score: number;
    status: string;
    openEngagement: string;
    clickEngagement: string;
    trend: string;
  };
  engagementAnalysis: {
    openRateAssessment: string;
    clickRateAssessment: string;
    bounceRateAssessment: string;
    suggestions: string[];
  };
  actionableRecommendations: Array<{
    priority: string;
    category: string;
    recommendation: string;
    expectedImpact: string;
  }>;
  benchmarkComparison: {
    openRateVsIndustry: string;
    clickRateVsIndustry: string;
    bounceRateVsIndustry: string;
  };
}

export const analyzeESPStats = async (stats: {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgBounceRate: number;
  campaigns?: Array<{
    campaignName: string;
    subject?: string;
    totalSent: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  }>;
}): Promise<ESPStatsAnalysis> => {
  try {
    const campaignDetails = stats.campaigns?.slice(0, 10).map(c => 
      `- "${c.campaignName}": ${c.totalSent} sent, ${c.openRate.toFixed(1)}% opens, ${c.clickRate.toFixed(1)}% clicks, ${c.bounceRate.toFixed(1)}% bounces`
    ).join('\n') || 'No campaign details available';

    const prompt = `Analyze these email campaign stats and provide comprehensive deliverability insights.

**Email Performance Data:**
- Total Campaigns: ${stats.totalCampaigns}
- Total Sent: ${stats.totalSent}
- Total Delivered: ${stats.totalDelivered}
- Total Opened: ${stats.totalOpened}
- Total Clicked: ${stats.totalClicked}
- Open Rate: ${stats.avgOpenRate.toFixed(1)}%
- Click Rate: ${stats.avgClickRate.toFixed(1)}%
- Bounce Rate: ${stats.avgBounceRate.toFixed(1)}%

**Individual Campaign Performance:**
${campaignDetails}

**Industry Standards:**
- Good open rate: 20-25%
- Good click rate: 2-3%
- Acceptable bounce rate: Under 2%
- Spam complaint threshold: Under 0.1%

Provide a complete deliverability analysis including:
1. Sender reputation score based on engagement patterns
2. Domain health assessment based on bounce rates
3. Spam risk evaluation
4. Inbox placement predictions for Gmail (Primary/Promotions/Spam), Outlook (Focused/Other/Junk), and Yahoo
5. Overall engagement score and trend
6. Prioritized recommendations`;

    const systemInstruction = `You are Acceptafy's email deliverability expert. Your job is to analyze email campaign data and provide comprehensive insights about inbox placement, sender reputation, and deliverability.

WRITING STYLE:
- Use simple, friendly language anyone can understand
- Be specific with numbers and percentages
- Keep explanations brief but informative
- Use "you/your" to make it personal
- Celebrate wins before discussing problems

ANALYSIS APPROACH:
1. **Sender Reputation**: Calculate based on open rates, click rates, and bounces. High engagement = good reputation.
2. **Domain Health**: Based on bounce rates and delivery success. 0% bounces = perfect health.
3. **Spam Risk**: Evaluate based on engagement levels. Low clicks + high volume = higher spam risk.
4. **Inbox Placement**: Predict where emails land based on engagement patterns:
   - High engagement + personal content = Primary/Focused
   - Marketing content + moderate engagement = Promotions/Other
   - Low engagement + high volume = Spam risk
5. **Engagement Score**: Weighted combination of opens and clicks vs. industry benchmarks.

SCORING GUIDELINES:
- 90-100: Excellent - top performer
- 80-89: Good - above average
- 60-79: Fair - room for improvement  
- Below 60: Needs attention

Return your analysis as a JSON object matching the provided schema.`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: espStatsAnalysisSchema
      }
    });

    return JSON.parse(res.text || '{}') as ESPStatsAnalysis;
  } catch (error) {
    console.error("Error analyzing ESP stats:", error);
    throw new Error("Failed to analyze ESP statistics.");
  }
};

// SEO suggestion schema for article meta generation
const seoSuggestionSchema = {
  type: Type.OBJECT,
  properties: {
    metaTitle: { type: Type.STRING },
    metaDescription: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};

export interface SEOSuggestion {
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

export const generateSEOSuggestions = async (
  title: string,
  excerpt: string,
  content: string
): Promise<SEOSuggestion> => {
  try {
    const plainTextContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
    
    const prompt = `Generate SEO-optimized metadata for this article about email marketing.

**Article Title:** ${title}

**Excerpt:** ${excerpt || 'Not provided'}

**Content Preview:** ${plainTextContent}

Create:
1. An optimized meta title (max 60 characters) that includes the main keyword and is compelling for search results
2. A meta description (max 160 characters) that summarizes the value proposition and encourages clicks
3. Up to 6 relevant tags based on the article's main topics`;

    const systemInstruction = `You are an SEO expert for Acceptafy, an email deliverability platform. Generate search-optimized metadata that will help articles rank well in Google.

GUIDELINES:
- Meta Title: Keep under 60 characters, front-load keywords, make it compelling
- Meta Description: Under 160 characters, include primary benefit, use action words
- Tags: Choose 4-6 lowercase tags that represent the article's main topics (email marketing, deliverability, spam prevention, etc.)

IMPORTANT:
- Never use the word "AI" in any output
- Focus on email marketing, deliverability, and campaign optimization topics
- Use natural language that appeals to marketers

Return your response as a JSON object with metaTitle, metaDescription, and tags fields.`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: seoSuggestionSchema
      }
    });

    return JSON.parse(res.text || '{}') as SEOSuggestion;
  } catch (error) {
    console.error("Error generating SEO suggestions:", error);
    throw new Error("Failed to generate SEO suggestions.");
  }
};
