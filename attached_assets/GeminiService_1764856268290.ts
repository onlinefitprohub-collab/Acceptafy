import { GoogleGenAI, Type } from "@google/genai";
// Fix: Import types from the central types.ts file to resolve circular dependencies.
import type { 
    GradingResult, 
    ReplyAbilityAnalysis, 
    PlainTextAnalysis, 
    DomainHealth, 
    ListQualityAnalysis, 
    BimiRecord,
    GlossaryTerm,
    RewrittenEmail,
    RewriteGoal,
    FollowUpEmail,
    FollowUpGoal,
    FollowUpSequenceEmail,
    DnsRecords,
    SentenceGrade
} from '../types';


const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        inboxPlacementScore: {
            type: Type.OBJECT,
            description: "A predictive score from 0 to 100 representing the likelihood of the email landing in the primary inbox, synthesizing all other analysis points.",
            properties: {
                score: { type: Type.NUMBER, description: "The numerical score from 0-100." },
                summary: { type: Type.STRING, description: "A one-sentence explanation of the key factors influencing this score." },
            },
            required: ["score", "summary"],
        },
        overallGrade: {
            type: Type.OBJECT,
            properties: {
                grade: { type: Type.STRING, description: "A single letter grade (e.g., A+, B, C-)." },
                summary: { type: Type.STRING, description: "A one-sentence summary of the overall performance." },
            },
            required: ["grade", "summary"],
        },
        subjectLine: {
            type: Type.OBJECT,
            properties: {
                grade: { type: Type.STRING },
                summary: { type: Type.STRING },
                feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["grade", "summary", "feedback"],
        },
        previewText: {
            type: Type.OBJECT,
            properties: {
                grade: { type: Type.STRING },
                summary: { type: Type.STRING },
                feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["grade", "summary", "feedback"],
        },
        bodyCopy: {
            type: Type.OBJECT,
            properties: {
                grade: { type: Type.STRING },
                summary: { type: Type.STRING },
                feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["grade", "summary", "feedback"],
        },
        callToAction: {
            type: Type.OBJECT,
            properties: {
                grade: { type: Type.STRING },
                summary: { type: Type.STRING },
                feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["grade", "summary", "feedback"],
        },
        spamAnalysis: {
            type: Type.ARRAY,
            description: "A list of identified spam trigger words and their suggested alternatives. Should be an empty array if no trigger words are found.",
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING, description: "The identified spam trigger word or phrase." },
                    reason: { type: Type.STRING, description: "A detailed explanation of why this word might trigger spam filters, including context." },
                    suggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "A wide list of suggested alternative words or phrases that are safer."
                    },
                    suggestion: {
                        type: Type.STRING,
                        description: "A single, direct replacement suggestion for the trigger word, chosen from the 'suggestions' list."
                    },
                    severity: {
                        type: Type.STRING,
                        description: "The severity of the trigger word, rated as 'High', 'Medium', or 'Low'."
                    },
                    rephraseExamples: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "One or two examples of how to rephrase the surrounding sentence to avoid the trigger word naturally."
                    }
                },
                required: ["word", "reason", "suggestions", "suggestion", "severity", "rephraseExamples"],
            },
        },
        structuralAnalysis: {
            type: Type.ARRAY,
            description: "A list of structural or stylistic issues found in the email, such as excessive capitalization, punctuation, or poor sentence structure.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "The category of the issue, one of 'Capitalization', 'Punctuation', or 'Sentence Structure'." },
                    summary: { type: Type.STRING, description: "A one-sentence summary of the issue found." },
                    feedback: { type: Type.STRING, description: "A detailed explanation of why this is a problem for spam filters or readability." },
                    suggestion: { type: Type.STRING, description: "Actionable advice on how to fix the issue." },
                    severity: { type: Type.STRING, description: "The severity of the issue, rated as 'High', 'Medium', or 'Low'." },
                    originalText: { type: Type.STRING, description: "The exact sentence or text fragment from the email that triggered this finding." }
                },
                required: ["type", "summary", "feedback", "suggestion", "severity", "originalText"],
            },
        },
        subjectLineAnalysis: {
            type: Type.ARRAY,
            description: "A/B test simulation. An analysis of each subject line variation, predicting which one will perform best.",
            items: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING },
                    previewText: { type: Type.STRING },
                    predictionScore: { type: Type.NUMBER, description: "A score from 0 to 100 indicating the predicted open rate success." },
                    rationale: { type: Type.STRING, description: "Detailed rationale comparing the variations on clarity, curiosity, urgency, and spamminess." },
                    isWinner: { type: Type.BOOLEAN, description: "True if this is the predicted best-performing variation." }
                },
                required: ["subject", "previewText", "predictionScore", "rationale", "isWinner"],
            }
        },
        personalizationScore: {
            type: Type.OBJECT,
            description: "An analysis of the email's authenticity and personalization.",
            properties: {
                score: { type: Type.NUMBER, description: "A score from 0 to 100 on how personalized and authentic the email feels." },
                summary: { type: Type.STRING, description: "A one-sentence summary of the personalization score." },
                feedback: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable feedback on how to make the email feel more one-to-one." }
            },
            required: ["score", "summary", "feedback"]
        },
        linkAnalysis: {
            type: Type.ARRAY,
            description: "An analysis of all hyperlinks in the email for deliverability issues.",
            items: {
                type: Type.OBJECT,
                properties: {
                    url: { type: Type.STRING, description: "The full URL of the link." },
                    anchorText: { type: Type.STRING, description: "The clickable text for the link." },
                    status: { type: Type.STRING, description: "The status of the link: 'Good', 'Warning', or 'Bad'." },
                    reason: { type: Type.STRING, description: "The reason for the given status." },
                    suggestion: { type: Type.STRING, description: "A suggestion for how to improve the link." }
                },
                required: ["url", "anchorText", "status", "reason", "suggestion"],
            }
        },
        replyAbilityAnalysis: {
            type: Type.OBJECT,
            description: "Analysis of how likely the email is to receive a reply.",
            properties: {
                score: { type: Type.NUMBER, description: "A score from 0-100 indicating the likelihood of getting a reply." },
                summary: { type: Type.STRING, description: "A one-sentence summary of the reply-ability score." },
                feedback: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable feedback for increasing reply rates, like adding a question." }
            },
            required: ["score", "summary", "feedback"]
        },
        plainTextAnalysis: {
            type: Type.OBJECT,
            description: "Analysis of the plain-text version of the email for deliverability.",
            properties: {
                plainTextVersion: { type: Type.STRING, description: "The auto-generated, clean plain-text version of the email body." },
                readabilityScore: { type: Type.NUMBER, description: "A score from 0-100 on the readability and formatting of the plain-text version." },
                feedback: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Feedback on the plain-text version's quality and any potential issues." }
            },
            required: ["plainTextVersion", "readabilityScore", "feedback"]
        },
        inboxPlacementPrediction: {
            type: Type.OBJECT,
            description: "Predicts where the email will land in major inboxes.",
            properties: {
                gmail: {
                    type: Type.OBJECT,
                    properties: {
                        placement: { type: Type.STRING, description: "Predicted placement: 'Primary', 'Promotions', or 'Spam'." },
                        reason: { type: Type.STRING, description: "A concise reason for the Gmail placement prediction." }
                    },
                    required: ["placement", "reason"]
                },
                outlook: {
                    type: Type.OBJECT,
                    properties: {
                        placement: { type: Type.STRING, description: "Predicted placement: 'Focused', 'Other', or 'Junk'." },
                        reason: { type: Type.STRING, description: "A concise reason for the Outlook placement prediction." }
                    },
                    required: ["placement", "reason"]
                },
                appleMail: {
                    type: Type.OBJECT,
                    properties: {
                        placement: { type: Type.STRING, description: "Predicted placement: 'Inbox' or 'Junk'." },
                        reason: { type: Type.STRING, description: "A concise reason for the Apple Mail placement prediction." }
                    },
                    required: ["placement", "reason"]
                }
            },
            required: ["gmail", "outlook", "appleMail"]
        },
        accessibilityAnalysis: {
            type: Type.ARRAY,
            description: "A list of accessibility issues found in the email.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "The category of issue: 'Alt Text', 'Contrast', 'Semantic HTML', 'Link Text'." },
                    summary: { type: Type.STRING, description: "A one-sentence summary of the issue." },
                    suggestion: { type: Type.STRING, description: "Actionable advice on how to fix it." },
                    severity: { type: Type.STRING, description: "The severity: 'High', 'Medium', or 'Low'." }
                },
                required: ["type", "summary", "suggestion", "severity"]
            }
        }
    },
    required: ["inboxPlacementScore", "overallGrade", "subjectLine", "previewText", "bodyCopy", "callToAction", "spamAnalysis", "structuralAnalysis", "subjectLineAnalysis", "personalizationScore", "linkAnalysis", "replyAbilityAnalysis", "plainTextAnalysis", "inboxPlacementPrediction", "accessibilityAnalysis"],
};

export const gradeCopy = async (emailBody: string, variations: { subject: string; previewText: string }[]): Promise<GradingResult> => {
    try {
        const fullEmailCopy = variations.map((v, i) => 
            `---Variation ${i + 1}---\nSubject: ${v.subject}\nPreview: ${v.previewText}`
        ).join('\n\n') + `\n\n---Email Body (Common to all variations)---\n${emailBody}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Please analyze the following email copy and its variations, providing a detailed grade and deliverability analysis.\n\n${fullEmailCopy}`,
            config: {
                systemInstruction: `You are an expert email marketing and deliverability analyst. Your task is to perform a comprehensive analysis of the provided email copy. Your response MUST be a single JSON object matching the provided schema.

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
11. **Accessibility Analysis:** Analyze the email body for common accessibility issues as if it were HTML. Check for missing 'alt' text on implied images, poor color contrast between text and background, non-descriptive link text (like "click here"), and use of non-semantic HTML for layout. Provide a 'type', 'summary', 'suggestion', and 'severity'. If no issues are found, return an empty array.`,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                thinkingConfig: { thinkingBudget: 8192 },
            }
        });

        if (response.promptFeedback?.blockReason === 'SAFETY') {
            const flaggedCategories = response.promptFeedback.safetyRatings
                ?.filter(rating => rating.probability !== 'NEGLIGIBLE' && rating.probability !== 'LOW')
                .map(rating => rating.category.replace('HARM_CATEGORY_', '').replace(/_/g, ' ').toLowerCase());

            if (flaggedCategories && flaggedCategories.length > 0) {
                const categoriesString = flaggedCategories.join(', ');
                throw new Error(`Your email copy was blocked for safety reasons related to: ${categoriesString}. Please revise the content to remove sensitive topics.`);
            } else {
                throw new Error('Your email copy was blocked for violating safety policies. Please try rephrasing any potentially sensitive topics.');
            }
        }
        
        if (response.promptFeedback?.blockReason) {
            throw new Error(`The request was blocked by the API. Reason: ${response.promptFeedback.blockReason}. This can sometimes happen with content that is very long or complex.`);
        }

        if (!response.candidates || response.candidates.length === 0) {
            throw new Error("The AI model did not return a response. This often happens if the content is flagged by safety filters that are not explicitly reported. Try simplifying or rephrasing your copy.");
        }

        const jsonString = response.text.trim();
        if (!jsonString) {
            throw new Error("The AI model returned an empty response. Your content might be too ambiguous or complex. Please try modifying your email copy.");
        }
        
        try {
            const parsedResult = JSON.parse(jsonString);
            return parsedResult as GradingResult;
        } catch (jsonError) {
             throw new Error("The AI model returned a malformed response. This can be caused by very long copy or content that pushes the boundaries of safety policies. Please try simplifying your email.");
        }

    } catch (error) {
        console.error("Error calling AI service:", error);
        if (error instanceof Error) {
            if (error.message.startsWith('Your email copy was blocked') || 
                error.message.startsWith('The request was blocked') ||
                error.message.startsWith('The AI model did not return') ||
                error.message.startsWith('The AI model returned an empty response') ||
                error.message.startsWith('The AI model returned a malformed response')) {
                throw error;
            }
             throw new Error(`An unexpected issue occurred with the AI service. This could be a temporary network problem or an issue with the service itself. Please try again shortly. Details: ${error.message}`);
        }
        throw new Error("An unknown and unexpected error occurred.");
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

export const rewriteCopy = async (emailBody: string, subject: string, previewText: string, goal: RewriteGoal): Promise<RewrittenEmail> => {
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
      model: 'gemini-2.5-pro',
      contents: `Please rewrite the following email. The main goal of the rewrite is: ${goal}.\n\n${content}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: rewriteSchema,
      }
    });

    const jsonString = result.text.trim();
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
    goal: FollowUpGoal,
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
            model: 'gemini-2.5-pro',
            contents: `Here is the original email:\n${originalContent}\n\nHere is a summary of its analysis:\n${analysisSummary}\n\nPlease write a follow-up email. ${goalInstruction}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: followUpSchema,
            }
        });

        const jsonString = result.text.trim();
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
            model: 'gemini-2.5-pro',
            contents: `Here is the original email:\n${originalContent}\n\nHere is a summary of its analysis:\n${analysisSummary}\n\nPlease write a 10-email follow-up sequence. The overall goal is: "${sequenceGoal}".`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: followUpSequenceSchema,
            }
        });

        if (response.promptFeedback?.blockReason === 'SAFETY') {
            const flaggedCategories = response.promptFeedback.safetyRatings
                ?.filter(rating => rating.probability !== 'NEGLIGIBLE' && rating.probability !== 'LOW')
                .map(rating => rating.category.replace('HARM_CATEGORY_', '').replace(/_/g, ' ').toLowerCase());

            if (flaggedCategories && flaggedCategories.length > 0) {
                const categoriesString = flaggedCategories.join(', ');
                throw new Error(`Your email copy was blocked for safety reasons related to: ${categoriesString}. Please revise the content to remove sensitive topics.`);
            } else {
                throw new Error('Your email copy was blocked for violating safety policies. Please try rephrasing any potentially sensitive topics.');
            }
        }
        
        if (response.promptFeedback?.blockReason) {
             throw new Error(`The request was blocked by the API. Reason: ${response.promptFeedback.blockReason}. This can sometimes happen with content that is very long or complex.`);
        }

        if (!response.candidates || response.candidates.length === 0) {
            throw new Error("The AI model did not return a response. This often happens if the content is flagged by safety filters that are not explicitly reported. Try simplifying or rephrasing your copy.");
        }
        
        const jsonString = response.text.trim();
        if (!jsonString) {
            throw new Error("The AI model returned an empty response. Your content might be too ambiguous or complex. Please try modifying your email copy.");
        }

        try {
            const parsedResult = JSON.parse(jsonString);
            if (Array.isArray(parsedResult) && parsedResult.length > 0) {
                return parsedResult as FollowUpSequenceEmail[];
            } else {
                throw new Error("AI did not return a valid email sequence.");
            }
        } catch (jsonError) {
             throw new Error("The AI model returned a malformed response. This can be caused by very long copy or content that pushes the boundaries of safety policies. Please try simplifying your email.");
        }

    } catch (error) {
        console.error("Error calling AI follow-up sequence generation service:", error);
         if (error instanceof Error) {
            if (error.message.startsWith('Your email copy was blocked') || 
                error.message.startsWith('The request was blocked') ||
                error.message.startsWith('The AI model did not return') ||
                error.message.startsWith('The AI model returned an empty response') ||
                error.message.startsWith('The AI model returned a malformed response') ||
                error.message.startsWith('AI did not return a valid')) {
                throw error;
            }
             throw new Error(`An unexpected issue occurred with the AI service. This could be a temporary network problem or an issue with the service itself. Please try again shortly. Details: ${error.message}`);
        }
        throw new Error("An unknown and unexpected error occurred.");
    }
};


export const rewriteSentence = async (sentence: string): Promise<string> => {
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite this sentence to be more concise and clear, breaking it into two sentences if necessary. Only return the rewritten text, with no extra commentary or quotation marks.\n\nOriginal: "${sentence}"`,
    });
    return result.text.trim();
  } catch (error) {
    console.error("Error calling AI sentence rewrite service:", error);
    throw new Error("Failed to get rewritten sentence from the AI service.");
  }
};

const sentenceGradeSchema = {
    type: Type.OBJECT,
    properties: {
        isGood: { type: Type.BOOLEAN, description: "True if the sentence is grammatically correct, clear, and well-structured. False if it has issues." },
        feedback: { type: Type.STRING, description: "A very brief (3-5 word) summary of the sentence's quality, e.g., 'Clear and concise' or 'Slightly awkward'." },
    },
    required: ["isGood", "feedback"],
};

export const gradeSentence = async (sentence: string): Promise<SentenceGrade> => {
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following sentence for its structural quality, clarity, and conciseness. Is it a well-formed sentence? Provide your analysis in the requested JSON format.\n\nSentence: "${sentence}"`,
      config: {
        systemInstruction: `You are a helpful grammar and style checker. You will be given a single sentence and must evaluate its quality. Respond only with a JSON object.`,
        responseMimeType: "application/json",
        responseSchema: sentenceGradeSchema,
      }
    });
    const jsonString = result.text.trim();
    return JSON.parse(jsonString) as SentenceGrade;
  } catch (error) {
    console.error("Error calling AI sentence grading service:", error);
    throw new Error("Failed to get sentence grade from the AI service.");
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
        const jsonString = result.text.trim();
        return JSON.parse(jsonString) as DnsRecords;
    } catch (error) {
        console.error("Error calling AI DNS generation service:", error);
        throw new Error("Failed to generate DNS records.");
    }
};

export const generatePostscript = async (emailBody: string): Promise<string> => {
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following email body and write a short, engaging postscript (P.S.) designed to encourage a reply. The P.S. should be conversational and ask a simple, open-ended question related to the email's topic. Return only the P.S. text itself, without any introductory phrases like "P.S.:".\n\n---Email Body---\n${emailBody}`,
        });
        return `P.S. ${result.text.trim()}`;
    } catch (error) {
        console.error("Error calling AI P.S. generation service:", error);
        throw new Error("Failed to generate postscript.");
    }
};

const glossarySchema = {
    type: Type.OBJECT,
    properties: {
        simpleDefinition: { type: Type.STRING, description: "A one-sentence, very simple definition of the term, suitable for a complete beginner." },
        detailedExplanation: { type: Type.STRING, description: "A more detailed, paragraph-length explanation of the term, its nuances, and how it works." },
        practicalExample: { type: Type.STRING, description: "A practical, real-world example of why this term matters to an email sender and how they might encounter it." },
    },
    required: ["simpleDefinition", "detailedExplanation", "practicalExample"],
};

export const explainTerm = async (term: string): Promise<GlossaryTerm> => {
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please explain the email marketing term: "${term}"`,
            config: {
                systemInstruction: `You are an expert email marketing educator. You will be given a term and must explain it clearly and concisely for a user who may not be an expert. Your response must be a single JSON object with three parts: a 'simpleDefinition', a 'detailedExplanation', and a 'practicalExample'.`,
                responseMimeType: "application/json",
                responseSchema: glossarySchema,
            }
        });
        const jsonString = result.text.trim();
        return JSON.parse(jsonString) as GlossaryTerm;
    } catch (error) {
        console.error("Error calling AI glossary service:", error);
        throw new Error("Failed to get explanation from the AI service.");
    }
};


// Pre-Flight Checklist Functions
const domainHealthSchema = {
    type: Type.OBJECT,
    properties: {
        status: { type: Type.STRING, description: "The final status: 'Clean', 'Warning', or 'Blacklisted'." },
        report: { type: Type.STRING, description: "A detailed report explaining the status. If blacklisted, mention on which (simulated) lists." },
        recommendation: { type: Type.STRING, description: "An actionable recommendation for the user. Empty string if status is 'Clean'." }
    },
    required: ["status", "report", "recommendation"]
};

export const checkDomainHealth = async (domain: string): Promise<DomainHealth> => {
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Simulate a domain health check for: ${domain}`,
            config: {
                systemInstruction: `You are a domain health analysis tool. The user will provide a domain name. Simulate a check against major DNS blacklists like Spamhaus, SORBS, and Barracuda. Return a plausible result as a single JSON object. The status can be 'Clean', 'Warning' (for minor issues), or 'Blacklisted'. Provide a clear 'report' explaining the finding and an actionable 'recommendation' if there are issues.`,
                responseMimeType: "application/json",
                responseSchema: domainHealthSchema,
            }
        });
        const jsonString = result.text.trim();
        return JSON.parse(jsonString) as DomainHealth;
    } catch (error) {
        console.error("Error calling AI domain health service:", error);
        throw new Error("Failed to get domain health from the AI service.");
    }
};

const listQualitySchema = {
    type: Type.OBJECT,
    properties: {
        roleBasedAccountPercentage: { type: Type.NUMBER },
        freeMailProviderPercentage: { type: Type.NUMBER },
        disposableDomainIndicators: { type: Type.BOOLEAN },
        spamTrapIndicators: { type: Type.BOOLEAN },
        summaryReport: { type: Type.STRING, description: "A paragraph explaining the overall quality and potential risks of this list." }
    },
    required: ["roleBasedAccountPercentage", "freeMailProviderPercentage", "disposableDomainIndicators", "spamTrapIndicators", "summaryReport"]
};

export const analyzeEmailList = async (emailListSample: string): Promise<ListQualityAnalysis> => {
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this sample of email addresses:\n${emailListSample}`,
            config: {
                systemInstruction: `You are an email list quality analyzer. The user will provide a sample of email addresses, one per line. Analyze this list and return a JSON object. Calculate 'roleBasedAccountPercentage' (info@, support@, etc.) and 'freeMailProviderPercentage' (gmail, yahoo, etc.). Identify 'disposableDomainIndicators' (e.g., mailinator.com) and potential 'spamTrapIndicators' (e.g., abuse@, randomly generated domains). Provide a final 'summaryReport' explaining the overall quality and potential deliverability risks.`,
                responseMimeType: "application/json",
                responseSchema: listQualitySchema,
            }
        });
        const jsonString = result.text.trim();
        return JSON.parse(jsonString) as ListQualityAnalysis;
    } catch (error) {
        console.error("Error calling AI list analysis service:", error);
        throw new Error("Failed to analyze email list.");
    }
};


// BIMI Generator Function
const bimiSchema = {
    type: Type.OBJECT,
    properties: {
        dmarcPrerequisite: { type: Type.STRING },
        logoRequirements: { type: Type.STRING },
        bimiRecord: { type: Type.STRING }
    },
    required: ["dmarcPrerequisite", "logoRequirements", "bimiRecord"]
};

export const generateBimiRecord = async (domain: string): Promise<BimiRecord> => {
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a BIMI record for the domain: ${domain}`,
            config: {
                systemInstruction: `You are a BIMI (Brand Indicators for Message Identification) record generator. The user provides a domain. Generate the necessary components for BIMI implementation. Return a JSON object with: 'dmarcPrerequisite' (a string explaining that DMARC must be set to p=quarantine or p=reject), 'logoRequirements' (a string explaining the SVG Tiny P/S format requirement), and 'bimiRecord' (the generated DNS TXT record for the _bimi subdomain, like 'v=BIMI1; l=https://URL_TO_YOUR_LOGO.svg;').`,
                responseMimeType: "application/json",
                responseSchema: bimiSchema,
            }
        });
        const jsonString = result.text.trim();
        return JSON.parse(jsonString) as BimiRecord;
    } catch (error) {
        console.error("Error calling AI BIMI generation service:", error);
        throw new Error("Failed to generate BIMI record.");
    }