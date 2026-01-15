import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
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
    },
    imageAnalysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        textToImageRatio: {
          type: Type.OBJECT,
          properties: {
            textPercent: { type: Type.NUMBER },
            imagePercent: { type: Type.NUMBER },
            status: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          }
        },
        images: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              index: { type: Type.NUMBER },
              hasAltText: { type: Type.BOOLEAN },
              altTextQuality: { type: Type.STRING },
              dimensionAnalysis: { type: Type.STRING },
              sizeAnalysis: { type: Type.STRING },
              placementFeedback: { type: Type.STRING },
              deliverabilityImpact: { type: Type.STRING }
            }
          }
        },
        feedback: { type: Type.ARRAY, items: { type: Type.STRING } }
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
11. **Accessibility Analysis:** Analyze the email body for common accessibility issues as if it were HTML. Check for missing 'alt' text on implied images, poor color contrast between text and background, non-descriptive link text (like "click here"), and use of non-semantic HTML for layout. Provide a 'type', 'summary', 'suggestion', and 'severity'. If no issues are found, return an empty array.
12. **Image Analysis (CRITICAL for deliverability):** If images are present in the email, provide comprehensive image analysis:
    - **Overall Score (0-100):** Rate the overall image usage for email deliverability and engagement
    - **Summary:** Brief overview of image usage quality
    - **Text-to-Image Ratio:** Analyze the balance between text content and images:
      - textPercent/imagePercent: Estimated percentages of email real estate
      - status: 'Optimal' (60-80% text), 'Warning' (40-60% or 80-90% text), 'Poor' (>90% or <40% text)
      - recommendation: Specific advice to improve the ratio (ideal is 60% text / 40% images for best deliverability)
    - **Per-Image Analysis:** For each image found, analyze:
      - hasAltText: Whether alt text is present
      - altTextQuality: 'Excellent', 'Good', 'Missing', or 'Poor' (generic alt like "image")
      - dimensionAnalysis: Comment on image dimensions (should be 600-800px wide max for email)
      - sizeAnalysis: If size is mentioned/detectable, comment on load time impact (images should be <100KB ideally)
      - placementFeedback: Is the image placement effective for the email's goal?
      - deliverabilityImpact: How does this image affect spam filters? (external hosting, tracking pixels, broken links)
    - **Feedback:** Array of specific, actionable recommendations to improve image usage
    If no images are found, return an empty imageAnalysis object with score 100 and summary "No images to analyze".`;

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

const getSequenceTypeInstructions = (sequenceType: string, context: string): { typeDescription: string; structureGuidance: string } => {
    const types: Record<string, { typeDescription: string; structureGuidance: string }> = {
        'sequence': {
            typeDescription: `a custom follow-up sequence to achieve: "${context}"`,
            structureGuidance: 'Progress logically from introduction to conversion, varying tactics throughout.'
        },
        'nurture': {
            typeDescription: `a nurture sequence designed to: "${context}"`,
            structureGuidance: `Structure: 
            - Emails 1-3: Provide educational value, establish expertise
            - Emails 4-6: Share case studies, testimonials, social proof
            - Emails 7-8: Address common objections and FAQs
            - Emails 9-10: Soft CTA to take next step`
        },
        'welcome': {
            typeDescription: `a welcome sequence for new subscribers: "${context}"`,
            structureGuidance: `Structure:
            - Email 1 (immediate): Warm welcome, set expectations, deliver promised lead magnet
            - Email 2 (Day 1): Introduce yourself/brand story
            - Email 3 (Day 3): Share quick win or valuable tip
            - Emails 4-6: Core value content, best resources
            - Emails 7-8: Social proof and community building
            - Emails 9-10: Introduce products/services naturally`
        },
        're-engagement': {
            typeDescription: `a re-engagement sequence to win back inactive subscribers: "${context}"`,
            structureGuidance: `Structure:
            - Email 1: "We miss you" - acknowledge absence, offer value
            - Email 2: Share what they've missed, highlight best content
            - Email 3: Special incentive or exclusive offer
            - Email 4: Ask for feedback - why did they disengage?
            - Email 5: Share customer success story
            - Email 6: Final exclusive offer with deadline
            - Email 7: "Last chance" reminder
            - Email 8-9: Provide easy re-engagement path
            - Email 10: Sunset warning - will remove if no engagement`
        },
        'launch': {
            typeDescription: `a product launch sequence for: "${context}"`,
            structureGuidance: `Structure:
            - Emails 1-2: Build anticipation, tease what's coming
            - Email 3: Reveal the product/offer
            - Email 4: Features and benefits deep dive
            - Email 5: Social proof and early results
            - Email 6: FAQ and objection handling
            - Email 7: Deadline reminder with bonuses
            - Email 8: Last chance urgency
            - Email 9: Final reminder
            - Email 10: Doors closing/cart closing`
        },
        'book-a-call': {
            typeDescription: `a call booking sequence to get prospects on sales calls: "${context}"`,
            structureGuidance: `Structure:
            - Email 1: Introduce the call offer and its value
            - Email 2: Share what they'll learn on the call
            - Email 3: Case study of someone who booked a call
            - Email 4: Address "I don't have time" objection
            - Email 5: Address "I'm not ready" objection
            - Email 6: Limited availability reminder
            - Email 7: What happens on the call (remove mystery)
            - Email 8: Success story with specific results
            - Email 9: Special incentive for booking now
            - Email 10: Final availability check`
        },
        'abandoned-cart': {
            typeDescription: `an abandoned cart recovery sequence for: "${context}"`,
            structureGuidance: `Structure:
            - Email 1 (1 hour): "Did you forget something?" - simple reminder
            - Email 2 (24 hours): Address common concerns, offer help
            - Email 3 (48 hours): Social proof - reviews and ratings
            - Email 4 (72 hours): Offer incentive (discount/free shipping)
            - Email 5 (5 days): Scarcity - limited stock warning
            - Email 6 (7 days): Last chance for incentive
            - Email 7-8 (10-14 days): Alternative product suggestions
            - Email 9 (21 days): Final reminder
            - Email 10 (30 days): Sunset with bigger incentive`
        },
        'webinar': {
            typeDescription: `a webinar promotion and follow-up sequence for: "${context}"`,
            structureGuidance: `Structure:
            - Email 1: Webinar invitation with clear value prop
            - Email 2: What they'll learn (3 key takeaways)
            - Email 3: Speaker credibility and testimonials
            - Email 4: 24-hour reminder
            - Email 5: "Starting soon" reminder (1 hour before)
            - Email 6 (post-webinar): Thank you + replay link
            - Email 7: Key insights summary + CTA
            - Email 8: Replay expiring warning
            - Email 9: Bonus resources for attendees
            - Email 10: Final CTA based on webinar content`
        },
        'testimonial': {
            typeDescription: `a testimonial and review request sequence: "${context}"`,
            structureGuidance: `Structure:
            - Email 1: Check-in on their experience
            - Email 2: Ask for quick feedback (1 question)
            - Email 3: Request full testimonial with easy template
            - Email 4: Offer incentive for detailed review
            - Email 5: Show examples of great testimonials
            - Email 6: Ask for specific platform review (Google, etc.)
            - Email 7: Photo/video testimonial request
            - Email 8: Case study collaboration offer
            - Email 9: Referral program introduction
            - Email 10: Thank you and next steps`
        },
        'upsell': {
            typeDescription: `an upsell/cross-sell sequence for: "${context}"`,
            structureGuidance: `Structure:
            - Email 1: Check satisfaction with current purchase
            - Email 2: Introduce complementary product naturally
            - Email 3: Show how others combine products
            - Email 4: Exclusive upgrade offer
            - Email 5: Feature comparison (current vs upgraded)
            - Email 6: Customer success story with upgrade
            - Email 7: Limited-time bundle offer
            - Email 8: Address "why do I need more" objection
            - Email 9: Deadline reminder
            - Email 10: Final offer with bonus`
        },
        'survey': {
            typeDescription: `a survey and feedback collection sequence: "${context}"`,
            structureGuidance: `Structure:
            - Email 1: Friendly survey request (emphasize brevity)
            - Email 2: Why their feedback matters
            - Email 3: Incentive offer for completing survey
            - Email 4: Preview of what you'll do with feedback
            - Email 5: Social proof - "Join X others who shared"
            - Email 6: Reminder with time estimate
            - Email 7: Almost deadline
            - Email 8: Final chance
            - Email 9: Thank you to participants
            - Email 10: Share survey results/actions taken`
        }
    };
    
    return types[sequenceType] || types['sequence'];
};

export const generateFollowUpSequence = async (
    originalEmail: { subject: string; body: string; },
    analysis: GradingResult,
    sequenceGoal: string,
    sequenceType: string = 'sequence'
): Promise<FollowUpSequenceEmail[]> => {
    try {
        const originalContent = `---Original Email---\nSubject: ${originalEmail.subject}\n\n---Body---\n${originalEmail.body}`;
        const analysisSummary = `The original email was analyzed and received an overall grade of ${analysis.overallGrade.grade}. Key feedback was: ${analysis.overallGrade.summary}. The main spam concern was: ${analysis.spamAnalysis[0]?.reason || 'none'}. The personalization score was ${analysis.personalizationScore.score}/100.`;
        
        const { typeDescription, structureGuidance } = getSequenceTypeInstructions(sequenceType, sequenceGoal);

        const systemInstruction = `You are an expert email marketing and deliverability strategist. Your task is to write ${typeDescription}.

        **CRITICAL DELIVERABILITY RULES:**
        1.  **High Inbox Probability:** Your primary objective is to create emails that land in the primary inbox. AVOID ALL spam triggers, especially those identified in the original analysis summary. Use natural, conversational language.
        2.  **Vary Content:** Each email must be unique. Do not repeat phrases or sentences. Vary the structure and call to action.
        3.  **Concise & Scannable:** Keep emails short, focused, and easy to read. Use short paragraphs and bullet points where appropriate.
        4.  **Personalized Tone:** Write as if a human is writing to another human. Reference the original context subtly.
        
        **SEQUENCE STRUCTURE:**
        ${structureGuidance}
        
        -   The sequence must have exactly 10 emails.
        -   Provide a logical 'timingSuggestion' for each (timing varies by sequence type).
        -   Each email must have a 'rationale' explaining its strategic purpose within this ${sequenceType} sequence.
        -   Return the result as a single JSON array of 10 email objects.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Here is the original email:\n${originalContent}\n\nHere is a summary of its analysis:\n${analysisSummary}\n\nPlease write a 10-email ${sequenceType} sequence. The goal/context is: "${sequenceGoal}".`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: followUpSequenceSchema,
            }
        });
        
        const jsonString = response.text?.trim() || '[]';
        const parsedResult = JSON.parse(jsonString);
        if (Array.isArray(parsedResult) && parsedResult.length > 0) {
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
  const emails = sample.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(e => e.length > 0);
  
  const prompt = `Analyze this email list for quality issues. For EACH email address, determine its quality status.

Email list:
${emails.join('\n')}

For each email, analyze:
- isValid: Does it have valid email format (user@domain.tld)?
- isRoleBased: Is it a role-based account (info@, sales@, admin@, support@, contact@, hello@, help@, billing@, etc.)?
- isFreeProvider: Is it from a free email provider (gmail.com, yahoo.com, hotmail.com, outlook.com, aol.com, mail.com, protonmail.com, icloud.com, etc.)?
- isDisposable: Is it from a known disposable/temporary email domain (mailinator, tempmail, 10minutemail, guerrillamail, throwaway, etc.)?
- isPotentialSpamTrap: Does it look like a potential spam trap (pristine traps often have patterns like random strings, typo domains, or recycled addresses)?
- reason: Brief explanation if the email has quality issues

Also calculate aggregate statistics:
- roleBasedAccountPercentage: Percentage of role-based accounts
- freeMailProviderPercentage: Percentage of free mail provider accounts
- disposableDomainIndicators: true if ANY disposable domains found
- spamTrapIndicators: true if ANY potential spam traps found
- summaryReport: Overall recommendations for list hygiene

Return as JSON.`;

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
          summaryReport: { type: Type.STRING },
          emailStatuses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                email: { type: Type.STRING },
                isValid: { type: Type.BOOLEAN },
                isRoleBased: { type: Type.BOOLEAN },
                isFreeProvider: { type: Type.BOOLEAN },
                isDisposable: { type: Type.BOOLEAN },
                isPotentialSpamTrap: { type: Type.BOOLEAN },
                reason: { type: Type.STRING }
              }
            }
          }
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

// Full article generation schema with enhanced SEO fields
const fullArticleSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    slug: { type: Type.STRING },
    excerpt: { type: Type.STRING },
    content: { type: Type.STRING },
    featuredImageKeywords: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    metaTitle: { type: Type.STRING },
    metaDescription: { type: Type.STRING },
    primaryKeyword: { type: Type.STRING },
    secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    articleFormat: { type: Type.STRING }
  },
  required: ['title', 'slug', 'excerpt', 'content', 'featuredImageKeywords', 'tags', 'metaTitle', 'metaDescription']
};

export interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageKeywords: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  articleFormat?: string;
}

// Article format definitions for unique, varied content
const ARTICLE_FORMATS = {
  'deep-dive': {
    name: 'Deep Dive Analysis',
    description: 'Comprehensive, in-depth exploration with expert insights and research',
    tone: 'authoritative and analytical',
    structure: `
<h2>[Compelling Hook Title]</h2>
<p>Open with a provocative question or surprising statistic that challenges conventional wisdom...</p>

<h2>The Current State of [Topic]</h2>
<p>Industry context and why this matters now more than ever...</p>
<blockquote><p><strong>Industry Data:</strong> [Specific statistic from recent study]</p></blockquote>

<h2>Breaking Down the Core Concepts</h2>
<h3>Understanding [Concept A]</h3>
<p>Deep technical explanation with examples...</p>
<h3>The Role of [Concept B]</h3>
<p>How this interconnects with the broader ecosystem...</p>
<h3>Advanced Considerations</h3>
<p>Nuances that separate beginners from experts...</p>

<h2>Expert Strategies That Actually Work</h2>
<p>Beyond the basics - tactics used by high-performing teams:</p>
<ol>
<li><strong>Strategy 1:</strong> Detailed implementation with expected results</li>
<li><strong>Strategy 2:</strong> Step-by-step with metrics to track</li>
<li><strong>Strategy 3:</strong> Advanced technique with case example</li>
</ol>

<h2>The Hidden Pitfalls Nobody Talks About</h2>
<ul>
<li><strong>Pitfall 1:</strong> Why most marketers get this wrong</li>
<li><strong>Pitfall 2:</strong> The counterintuitive truth about...</li>
<li><strong>Pitfall 3:</strong> What the data actually shows</li>
</ul>

<h2>Future-Proofing Your Approach</h2>
<p>Emerging trends and how to stay ahead...</p>

<h2>Key Takeaways</h2>
<p>Synthesized insights and action framework...</p>`
  },
  'case-study': {
    name: 'Real-World Case Study',
    description: 'Story-driven analysis with concrete examples and measurable results',
    tone: 'narrative and evidence-based',
    structure: `
<h2>The Challenge: [Problem Statement]</h2>
<p>Set the scene with a relatable scenario that many readers face...</p>

<h2>Background: Understanding the Stakes</h2>
<p>What was at risk and why traditional approaches weren't working...</p>
<blockquote><p><strong>The Reality:</strong> [Specific challenge with numbers]</p></blockquote>

<h2>The Turning Point</h2>
<p>What changed and the decision to try a new approach...</p>

<h2>The Strategy: Breaking It Down</h2>
<h3>Phase 1: [Initial Action]</h3>
<p>What was implemented first and immediate observations...</p>
<h3>Phase 2: [Optimization]</h3>
<p>Refinements based on early data...</p>
<h3>Phase 3: [Scaling]</h3>
<p>How success was amplified...</p>

<h2>The Results: By the Numbers</h2>
<ul>
<li><strong>Metric 1:</strong> Before vs. after comparison</li>
<li><strong>Metric 2:</strong> Percentage improvement</li>
<li><strong>Metric 3:</strong> Long-term impact</li>
</ul>

<h2>Lessons Learned</h2>
<p>What would be done differently and key insights gained...</p>

<h2>How to Apply This to Your Campaigns</h2>
<ol>
<li>Actionable step with context</li>
<li>Practical implementation tip</li>
<li>Quick win you can start today</li>
</ol>

<h2>The Bottom Line</h2>
<p>Summarized learnings with encouragement to take action...</p>`
  },
  'comparison': {
    name: 'Comparison & Analysis',
    description: 'Side-by-side evaluation helping readers make informed decisions',
    tone: 'objective and consultative',
    structure: `
<h2>The [Topic] Dilemma: Finding the Right Approach</h2>
<p>Why this decision matters and what's really at stake...</p>

<h2>Understanding Your Options</h2>
<p>A quick overview of the landscape before diving deep...</p>

<h2>Option A: [First Approach]</h2>
<h3>How It Works</h3>
<p>Core mechanics and methodology...</p>
<h3>Pros</h3>
<ul>
<li>Advantage with specific benefit</li>
<li>Another strength</li>
<li>When this shines</li>
</ul>
<h3>Cons</h3>
<ul>
<li>Limitation to consider</li>
<li>Potential drawback</li>
</ul>

<h2>Option B: [Second Approach]</h2>
<h3>How It Works</h3>
<p>Core mechanics and methodology...</p>
<h3>Pros</h3>
<ul>
<li>Advantage with specific benefit</li>
<li>Another strength</li>
<li>When this shines</li>
</ul>
<h3>Cons</h3>
<ul>
<li>Limitation to consider</li>
<li>Potential drawback</li>
</ul>

<h2>Head-to-Head Comparison</h2>
<p>Critical factors side by side:</p>
<ul>
<li><strong>Cost/Effort:</strong> Comparison analysis</li>
<li><strong>Results Timeline:</strong> What to expect</li>
<li><strong>Best Use Case:</strong> When to choose each</li>
</ul>

<h2>Expert Recommendation</h2>
<p>Based on different scenarios, here's our guidance...</p>

<h2>Making Your Decision</h2>
<p>Framework for choosing the right path for your situation...</p>`
  },
  'problem-solution': {
    name: 'Problem-Solution Framework',
    description: 'Focused on specific pain points with targeted, actionable fixes',
    tone: 'empathetic and solution-oriented',
    structure: `
<h2>Why [Problem] Is Costing You More Than You Think</h2>
<p>The hidden impact that most marketers underestimate...</p>
<blockquote><p><strong>The Cost:</strong> [Specific impact with data]</p></blockquote>

<h2>Root Causes: What's Really Going Wrong</h2>
<h3>Cause 1: [Specific Issue]</h3>
<p>How to identify if this affects you and why it happens...</p>
<h3>Cause 2: [Another Issue]</h3>
<p>Signs to look for and common misconceptions...</p>
<h3>Cause 3: [Third Issue]</h3>
<p>The least obvious but often most impactful factor...</p>

<h2>The Solution Framework</h2>
<p>A systematic approach to addressing each root cause...</p>

<h2>Fix 1: [Specific Solution]</h2>
<p>Step-by-step implementation:</p>
<ol>
<li>First action with expected outcome</li>
<li>Second step building on the first</li>
<li>Verification and optimization</li>
</ol>

<h2>Fix 2: [Another Solution]</h2>
<p>Implementation guide:</p>
<ol>
<li>Preparation steps</li>
<li>Core implementation</li>
<li>Testing and refinement</li>
</ol>

<h2>Fix 3: [Third Solution]</h2>
<p>Advanced remediation:</p>
<ol>
<li>When to apply this fix</li>
<li>How to implement correctly</li>
<li>Measuring success</li>
</ol>

<h2>Prevention: Ensuring It Doesn't Happen Again</h2>
<ul>
<li>Monitoring practice to adopt</li>
<li>Regular maintenance task</li>
<li>Early warning indicators</li>
</ul>

<h2>Quick Action Checklist</h2>
<p>Immediate steps you can take right now...</p>`
  },
  'trend-analysis': {
    name: 'Trend & Future Analysis',
    description: 'Forward-looking insights on industry changes and what they mean',
    tone: 'visionary and thought-leadership',
    structure: `
<h2>The Shift: How [Topic] Is Changing Everything</h2>
<p>The transformation happening right now and what sparked it...</p>

<h2>Where We Are Today</h2>
<p>Current landscape assessment with key indicators...</p>
<blockquote><p><strong>Current State:</strong> [Market data or trend indicator]</p></blockquote>

<h2>The Forces Driving Change</h2>
<h3>Driver 1: [Technology/Market Shift]</h3>
<p>How this is reshaping expectations and practices...</p>
<h3>Driver 2: [Consumer/Industry Evolution]</h3>
<p>The behavioral changes fueling this trend...</p>
<h3>Driver 3: [Regulatory/Competitive Pressure]</h3>
<p>External forces accelerating adoption...</p>

<h2>What the Future Holds</h2>
<h3>Near-Term (6-12 Months)</h3>
<p>Changes to expect and prepare for...</p>
<h3>Medium-Term (1-2 Years)</h3>
<p>Emerging patterns to watch...</p>
<h3>Long-Term Vision</h3>
<p>Where this ultimately leads...</p>

<h2>Winners and Losers</h2>
<ul>
<li><strong>Who Will Thrive:</strong> Characteristics of future success</li>
<li><strong>Who Will Struggle:</strong> Warning signs and pitfalls</li>
<li><strong>The Opportunity:</strong> Where the smart money is going</li>
</ul>

<h2>How to Position Yourself</h2>
<ol>
<li>Immediate action to gain first-mover advantage</li>
<li>Strategic investment to make now</li>
<li>Skills and capabilities to develop</li>
</ol>

<h2>The Bottom Line</h2>
<p>Key predictions and call to proactive action...</p>`
  },
  'quick-tips': {
    name: 'Actionable Quick Tips',
    description: 'Scannable, immediately actionable advice with clear takeaways',
    tone: 'energetic and practical',
    structure: `
<h2>[Number] [Topic] Tips That Actually Move the Needle</h2>
<p>Skip the fluff - here's what top performers actually do...</p>

<h2>Tip 1: [Powerful First Tip]</h2>
<p>Why it works and how to implement immediately...</p>
<p><strong>Quick Win:</strong> Do this today for instant improvement</p>

<h2>Tip 2: [Second Actionable Tip]</h2>
<p>The reasoning behind this approach...</p>
<p><strong>Quick Win:</strong> Simple action you can take in 5 minutes</p>

<h2>Tip 3: [Third Tip]</h2>
<p>How this connects to better results...</p>
<p><strong>Quick Win:</strong> Immediate implementation step</p>

<h2>Tip 4: [Fourth Tip]</h2>
<p>The overlooked tactic that makes a difference...</p>
<p><strong>Quick Win:</strong> Add this to your workflow now</p>

<h2>Tip 5: [Fifth Tip]</h2>
<p>What separates good from great...</p>
<p><strong>Quick Win:</strong> Test this in your next campaign</p>

<h2>Tip 6: [Sixth Tip]</h2>
<p>Advanced insight for maximum impact...</p>
<p><strong>Quick Win:</strong> Schedule this for implementation</p>

<h2>Tip 7: [Seventh Tip]</h2>
<p>The multiplier effect of getting this right...</p>
<p><strong>Quick Win:</strong> Bookmark and reference regularly</p>

<h2>Bonus: The One Thing Most People Miss</h2>
<p>The counterintuitive insight that changes everything...</p>

<h2>Your Action Plan</h2>
<ul>
<li><strong>This Week:</strong> Tips to implement immediately</li>
<li><strong>This Month:</strong> Deeper integrations to work on</li>
<li><strong>Ongoing:</strong> Habits to develop</li>
</ul>`
  },
  'myth-busters': {
    name: 'Myth Busters',
    description: 'Debunking misconceptions with evidence-based corrections',
    tone: 'direct and enlightening',
    structure: `
<h2>The Myths About [Topic] That Are Hurting Your Results</h2>
<p>Time to separate fact from fiction and stop making these costly mistakes...</p>

<h2>Myth 1: "[Common Misconception]"</h2>
<h3>The Reality</h3>
<p>What the data actually shows and why this belief persists...</p>
<blockquote><p><strong>The Truth:</strong> [Evidence-based correction with stat]</p></blockquote>
<p><strong>What to Do Instead:</strong> Correct approach with reasoning</p>

<h2>Myth 2: "[Second Misconception]"</h2>
<h3>The Reality</h3>
<p>Where this myth came from and why it's wrong...</p>
<blockquote><p><strong>The Truth:</strong> [Factual correction]</p></blockquote>
<p><strong>What to Do Instead:</strong> Better practice to adopt</p>

<h2>Myth 3: "[Third Misconception]"</h2>
<h3>The Reality</h3>
<p>The nuance that most people miss...</p>
<blockquote><p><strong>The Truth:</strong> [Accurate understanding]</p></blockquote>
<p><strong>What to Do Instead:</strong> Recommended approach</p>

<h2>Myth 4: "[Fourth Misconception]"</h2>
<h3>The Reality</h3>
<p>Why experts disagree with popular opinion...</p>
<blockquote><p><strong>The Truth:</strong> [Research-backed insight]</p></blockquote>
<p><strong>What to Do Instead:</strong> Evidence-based practice</p>

<h2>Myth 5: "[Fifth Misconception]"</h2>
<h3>The Reality</h3>
<p>The most dangerous myth of all...</p>
<blockquote><p><strong>The Truth:</strong> [Critical correction]</p></blockquote>
<p><strong>What to Do Instead:</strong> The right way forward</p>

<h2>Why These Myths Persist</h2>
<p>Understanding the psychology and history behind misinformation...</p>

<h2>Building a Fact-Based Strategy</h2>
<ul>
<li>How to evaluate claims critically</li>
<li>Trusted sources to rely on</li>
<li>Testing methods to validate approaches</li>
</ul>

<h2>The Truth Sets You Free</h2>
<p>Embrace evidence-based practices for real results...</p>`
  }
};

// Select article format based on topic analysis or rotation
const selectArticleFormat = (topic: string, existingFormats?: string[]): string => {
  const formats = Object.keys(ARTICLE_FORMATS);
  const topicLower = topic.toLowerCase();
  
  // Smart format selection based on topic keywords
  if (topicLower.includes('vs') || topicLower.includes('versus') || topicLower.includes('compare') || topicLower.includes('difference')) {
    return 'comparison';
  }
  if (topicLower.includes('myth') || topicLower.includes('wrong') || topicLower.includes('mistake') || topicLower.includes('truth')) {
    return 'myth-busters';
  }
  if (topicLower.includes('tip') || topicLower.includes('hack') || topicLower.includes('quick') || topicLower.includes('fast')) {
    return 'quick-tips';
  }
  if (topicLower.includes('future') || topicLower.includes('trend') || topicLower.includes('2025') || topicLower.includes('2026') || topicLower.includes('prediction')) {
    return 'trend-analysis';
  }
  if (topicLower.includes('fix') || topicLower.includes('solve') || topicLower.includes('problem') || topicLower.includes('issue') || topicLower.includes('improve')) {
    return 'problem-solution';
  }
  if (topicLower.includes('case') || topicLower.includes('example') || topicLower.includes('story') || topicLower.includes('how we') || topicLower.includes('success')) {
    return 'case-study';
  }
  if (topicLower.includes('guide') || topicLower.includes('complete') || topicLower.includes('ultimate') || topicLower.includes('everything')) {
    return 'deep-dive';
  }
  
  // Rotate through formats to ensure variety
  if (existingFormats && existingFormats.length > 0) {
    const formatCounts = formats.reduce((acc, f) => {
      acc[f] = existingFormats.filter(ef => ef === f).length;
      return acc;
    }, {} as Record<string, number>);
    
    // Select least used format
    const minCount = Math.min(...Object.values(formatCounts));
    const leastUsed = formats.filter(f => formatCounts[f] === minCount);
    return leastUsed[Math.floor(Math.random() * leastUsed.length)];
  }
  
  // Random selection if no context
  return formats[Math.floor(Math.random() * formats.length)];
};

export interface ArticleGenerationOptions {
  topic: string;
  existingArticles?: Array<{ title: string; slug: string; }>;
  existingFormats?: string[];
  forcedFormat?: string;
}

export const generateFullArticle = async (topicOrOptions: string | ArticleGenerationOptions): Promise<GeneratedArticle> => {
  try {
    // Handle both string and options object for backward compatibility
    const options: ArticleGenerationOptions = typeof topicOrOptions === 'string' 
      ? { topic: topicOrOptions }
      : topicOrOptions;
    
    const { topic, existingArticles = [], existingFormats = [], forcedFormat } = options;
    
    // Select format for variety
    const selectedFormat = forcedFormat || selectArticleFormat(topic, existingFormats);
    const format = ARTICLE_FORMATS[selectedFormat as keyof typeof ARTICLE_FORMATS] || ARTICLE_FORMATS['deep-dive'];
    
    // Build internal linking context
    let internalLinkingContext = '';
    if (existingArticles.length > 0) {
      internalLinkingContext = `
INTERNAL LINKING REQUIREMENT:
You MUST include 2-4 internal links to these existing articles where contextually relevant. Use anchor text that flows naturally in the content.
Available articles to link to:
${existingArticles.map(a => `- "${a.title}" (link: /resources/${a.slug})`).join('\n')}

When linking, use natural anchor text like: <a href="/resources/slug-here">descriptive text</a>
Only link where it genuinely adds value to the reader.`;
    }

    const prompt = `Create a UNIQUE, heavily SEO-optimized blog article about the following topic for an email marketing and deliverability platform.

**Topic:** ${topic}

**Required Article Format:** ${format.name}
${format.description}

**Writing Tone:** ${format.tone}

CRITICAL: Create a COMPLETELY UNIQUE article. Do NOT follow generic templates. Find a FRESH ANGLE that hasn't been covered before.

Generate with these MANDATORY SEO requirements:
1. Title: Keyword-rich, compelling, 50-60 characters, include primary keyword near the start
2. Slug: URL-friendly, contains primary keyword
3. Excerpt: 2-3 sentences, include primary keyword, under 200 characters, compelling hook
4. Primary Keyword: The main search term this article targets
5. Secondary Keywords: 4-6 LSI (related) keywords naturally woven throughout
6. Content: Minimum 1500 words, heavy keyword density (1-2%), proper H2/H3 hierarchy
7. Featured Snippet Optimization: Include at least one definition paragraph and one list that could be featured
8. Meta Title: Under 60 characters, primary keyword first
9. Meta Description: 150-160 characters, includes primary keyword, has call-to-action
10. Tags: 5-7 highly relevant, searchable tags
${internalLinkingContext}`;

    const systemInstruction = `You are an elite SEO content strategist and expert copywriter for Acceptafy, an email deliverability optimization platform. Your mission is to create UNIQUE, highly engaging, and SEO-dominant articles.

UNIQUENESS MANDATE:
- Find an angle or perspective NOT commonly covered
- Use unexpected hooks, surprising data, or contrarian viewpoints
- Create original frameworks, acronyms, or methodologies
- Tell stories and use specific scenarios
- Avoid generic introductions like "In today's digital world..."

SEO OPTIMIZATION REQUIREMENTS:
- Primary keyword appears in: title, first 100 words, at least 2 H2s, meta title, meta description, conclusion
- Secondary/LSI keywords distributed naturally throughout (aim for 1-2% keyword density)
- Headers follow proper hierarchy (H2 → H3, never skip levels)
- Include one "featured snippet optimized" paragraph: a clear 40-60 word definition or answer
- Include schema-ready FAQ section with 2-3 questions
- Use power words in title: ultimate, proven, essential, complete, master, secret, etc.

CONTENT STRUCTURE - Use this specific format for ${format.name}:
${format.structure}

CRITICAL RULES:
- Never use the word "AI" anywhere in the content
- Never use "In today's" or similar cliche openings
- Every paragraph must provide genuine value
- Use specific numbers, percentages, and data points
- Write minimum 1500 words, maximum 2000 words
- Be actionable - readers should be able to implement immediately
- For featuredImageKeywords: provide 2-3 descriptive words for stock photo search
- Return ONLY valid JSON, no markdown code blocks

Return response as JSON with these exact fields: title, slug, excerpt, content, featuredImageKeywords, tags, metaTitle, metaDescription, primaryKeyword, secondaryKeywords, articleFormat`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: fullArticleSchema
      }
    });

    const article = JSON.parse(res.text || '{}') as GeneratedArticle;
    article.articleFormat = selectedFormat;
    
    return article;
  } catch (error) {
    console.error("Error generating full article:", error);
    throw new Error("Failed to generate article.");
  }
};

export const generateArticleImage = async (
  topic: string,
  keywords: string
): Promise<{ imageData: Buffer; mimeType: string } | null> => {
  try {
    const prompt = `Create a professional, visually appealing featured image for a blog article about: "${topic}".

The image should:
- Be clean and modern with a professional business aesthetic
- Use a color palette that includes teal, blue, or purple tones
- Feature abstract or conceptual representation of email marketing/communication
- NOT contain any text, logos, or watermarks
- Be suitable as a blog header image (landscape orientation)
- Feel inspiring and professional

Keywords for visual inspiration: ${keywords}`;

    // Use gemini-2.5-flash-image (Nano Banana) for image generation
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['image', 'text'],
      }
    });

    // Extract image data from response
    if (res.candidates && res.candidates[0]?.content?.parts) {
      for (const part of res.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
          return {
            imageData: imageBuffer,
            mimeType: part.inlineData.mimeType || 'image/png'
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error generating article image:", error);
    return null;
  }
};

// Campaign Risk Score schema for Gemini
const campaignRiskSchema = {
  type: Type.OBJECT,
  properties: {
    overallRisk: { type: Type.STRING },
    riskScore: { type: Type.NUMBER },
    riskFactors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING },
          severity: { type: Type.STRING },
          impact: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        }
      }
    },
    predictedOpenRate: { type: Type.NUMBER },
    predictedBounceRate: { type: Type.NUMBER },
    predictedComplaintRate: { type: Type.NUMBER },
    spamTriggerWords: { type: Type.ARRAY, items: { type: Type.STRING } },
    positiveFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ['overallRisk', 'riskScore', 'riskFactors', 'summary', 'recommendations']
};

// Zod schema for validating Gemini response
const campaignRiskZodSchema = z.object({
  overallRisk: z.enum(['low', 'medium', 'high']).default('medium'),
  riskScore: z.number().min(0).max(100).default(50),
  riskFactors: z.array(z.object({
    factor: z.string().default('Unknown factor'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    impact: z.string().default('Potential impact on deliverability'),
    recommendation: z.string().default('Review this aspect of your campaign')
  })).default([]),
  predictedOpenRate: z.number().min(0).max(100).default(20),
  predictedBounceRate: z.number().min(0).max(100).default(1),
  predictedComplaintRate: z.number().min(0).max(100).default(0.05),
  spamTriggerWords: z.array(z.string()).default([]),
  positiveFactors: z.array(z.string()).default([]),
  summary: z.string().default('Analysis completed. Review the risk factors and recommendations.'),
  recommendations: z.array(z.string()).default(['Review your email content for potential issues'])
});

export interface CampaignRiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high';
  riskScore: number;
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: string;
    recommendation: string;
  }>;
  predictedOpenRate: number;
  predictedBounceRate: number;
  predictedComplaintRate: number;
  spamTriggerWords: string[];
  positiveFactors: string[];
  summary: string;
  recommendations: string[];
}

export const analyzeCampaignRisk = async (
  subject: string,
  content: string,
  estimatedVolume?: number,
  listAge?: string
): Promise<CampaignRiskAnalysis> => {
  try {
    const prompt = `Analyze this email campaign for potential sender reputation risks before sending.

**Subject Line:** ${subject}

**Email Content:**
${content.slice(0, 5000)}

**Estimated Send Volume:** ${estimatedVolume ? `${estimatedVolume.toLocaleString()} recipients` : 'Not specified'}

**List Age/Quality:** ${listAge || 'Not specified'}

Evaluate the campaign's potential impact on sender reputation and deliverability. Consider:
1. Spam trigger words and phrases
2. Link density and quality concerns
3. Image-to-text ratio issues
4. Unsubscribe link presence
5. Subject line quality
6. Overall content quality and professionalism
7. Potential for high bounce or complaint rates`;

    const systemInstruction = `You are an email deliverability expert analyzing campaigns BEFORE they are sent. Your goal is to predict reputation impact and prevent deliverability issues.

SCORING GUIDELINES:
- riskScore: 0-100 where 100 = safest (low risk), 0 = extremely risky
- overallRisk: "low" (80-100), "medium" (50-79), "high" (0-49)

RISK FACTORS TO CHECK:
1. SPAM TRIGGER WORDS: "FREE", "ACT NOW", "LIMITED TIME", "GUARANTEED", excessive caps, excessive punctuation
2. LINK ISSUES: Too many links (>5), URL shorteners, suspicious domains
3. IMAGE RATIO: All-image emails with no text, missing alt text
4. COMPLIANCE: Missing unsubscribe link, no physical address
5. CONTENT QUALITY: Grammar issues, aggressive language, deceptive subject lines
6. VOLUME: Large sends without warm-up history
7. TECHNICAL: Missing authentication references, generic sender info

SEVERITY LEVELS:
- "critical": Will likely cause immediate reputation damage or blocking
- "high": Strong negative impact on deliverability
- "medium": May affect inbox placement over time
- "low": Minor issue, easy to fix

PREDICTIONS (as percentages):
- predictedOpenRate: Based on subject line quality and relevance (typical range 15-35%)
- predictedBounceRate: Based on content and list quality indicators (target under 2%)
- predictedComplaintRate: Based on content quality and spam signals (target under 0.1%)

POSITIVE FACTORS TO IDENTIFY:
- Personalization tokens
- Clear value proposition
- Professional formatting
- Good text-to-link ratio
- Clear call-to-action
- Unsubscribe link present

Provide actionable recommendations to improve the campaign before sending.

Return your response as a JSON object.`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: campaignRiskSchema
      }
    });

    // Parse JSON response with proper error handling
    let rawResult: unknown;
    const responseText = res.text || '';
    
    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from analysis service');
    }
    
    try {
      rawResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", responseText.slice(0, 500));
      throw new Error('Invalid response format from analysis service');
    }
    
    // Validate with Zod schema - will apply defaults for missing fields
    const parseResult = campaignRiskZodSchema.safeParse(rawResult);
    
    if (!parseResult.success) {
      console.error("Zod validation failed:", parseResult.error.flatten());
      throw new Error('Invalid response structure from analysis service');
    }
    
    const result = parseResult.data;
    
    // Normalize overallRisk based on score for consistency
    if (result.riskScore >= 80) {
      result.overallRisk = 'low';
    } else if (result.riskScore >= 50) {
      result.overallRisk = 'medium';
    } else {
      result.overallRisk = 'high';
    }
    
    return result;
  } catch (error) {
    console.error("Error analyzing campaign risk:", error);
    // Re-throw to let the API handler return a proper 500 error
    throw error;
  }
};

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

// Spell and Grammar Check Types
export interface SpellGrammarIssue {
  type: 'spelling' | 'grammar' | 'punctuation' | 'style';
  original: string;
  suggestion: string;
  explanation: string;
  position: number;
  length: number;
}

export interface SpellGrammarResult {
  issues: SpellGrammarIssue[];
  correctedText: string;
  issueCount: number;
}

const spellGrammarSchema = {
  type: Type.OBJECT,
  properties: {
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          original: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          explanation: { type: Type.STRING },
          position: { type: Type.NUMBER },
          length: { type: Type.NUMBER }
        }
      }
    },
    correctedText: { type: Type.STRING },
    issueCount: { type: Type.NUMBER }
  }
};

export const checkSpellGrammar = async (text: string): Promise<SpellGrammarResult> => {
  try {
    if (!text || text.trim().length < 3) {
      return { issues: [], correctedText: text, issueCount: 0 };
    }

    const prompt = `Check the following email text for spelling errors, grammar issues, punctuation problems, and style improvements:

"""
${text}
"""

IMPORTANT RULES:
1. Only flag actual errors, not personal style choices
2. Preserve email marketing conventions (e.g., "Hi [Name]" placeholders are valid)
3. Do NOT flag personalization tokens like [Name], {{firstName}}, etc.
4. For each issue, provide the exact position (character index starting from 0) where it appears
5. Keep suggestions professional and appropriate for email marketing
6. Focus on: typos, subject-verb agreement, punctuation, capitalization, and sentence structure
7. The position should be the exact character index where the "original" text starts in the input

Return a JSON object with:
- issues: Array of problems found
- correctedText: The fully corrected version of the text
- issueCount: Total number of issues found`;

    const systemInstruction = `You are a professional proofreader specializing in email marketing content. Check for spelling, grammar, punctuation, and style issues. Be helpful but not overly pedantic. Focus on errors that would make the sender look unprofessional.

Do NOT flag:
- Personalization placeholders like [Name], {{first_name}}, etc.
- Intentional informal language common in marketing emails
- Brand-specific capitalizations
- Stylistic choices that are subjective

DO flag:
- Spelling mistakes
- Grammar errors (subject-verb agreement, tense issues)
- Missing or incorrect punctuation
- Run-on sentences
- Capitalization errors`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: spellGrammarSchema
      }
    });

    const result = JSON.parse(res.text || '{}') as SpellGrammarResult;
    return {
      issues: result.issues || [],
      correctedText: result.correctedText || text,
      issueCount: result.issueCount || result.issues?.length || 0
    };
  } catch (error) {
    console.error("Error checking spell/grammar:", error);
    return { issues: [], correctedText: text, issueCount: 0 };
  }
};

// Content Generator - AI-powered content generation
const contentGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING, description: "A compelling subject line for the content (for emails)" },
    previewText: { type: Type.STRING, description: "Preview/pre-header text (for emails)" },
    body: { type: Type.STRING, description: "The main generated content body" },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 suggestions for improving or customizing the content"
    }
  },
  required: ["body", "suggestions"]
};

export interface GenerateContentParams {
  contentType: 'email' | 'social' | 'blog' | 'ad';
  prompt: string;
  tone?: string;
  industry?: string;
  targetAudience?: string;
  length?: 'short' | 'medium' | 'long';
}

export const generateContent = async (params: GenerateContentParams): Promise<{
  subject?: string;
  previewText?: string;
  body: string;
  suggestions: string[];
}> => {
  const { contentType, prompt, tone = 'professional', industry, targetAudience, length = 'medium' } = params;
  
  const lengthGuide = {
    short: '50-100 words',
    medium: '150-300 words',
    long: '400-600 words'
  };

  const contentTypeInstructions: Record<string, string> = {
    email: `Generate a complete marketing email with a compelling subject line and preview text. The email should be engaging, have a clear call-to-action, and follow email marketing best practices for deliverability.`,
    social: `Generate a social media post optimized for engagement. Include hashtag suggestions. Keep it concise but impactful. No subject or preview text needed.`,
    blog: `Generate a blog post intro and outline with key points. Make it SEO-friendly with clear structure. No subject or preview text needed.`,
    ad: `Generate ad copy that is attention-grabbing and conversion-focused. Include a headline and supporting copy. Keep it concise and action-oriented. No subject or preview text needed.`
  };

  const systemInstruction = `You are an expert content creator specializing in ${contentType} marketing content. 
Generate high-quality, engaging content based on the user's requirements.

Content Guidelines:
- Tone: ${tone}
${industry ? `- Industry: ${industry}` : ''}
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}
- Length: ${lengthGuide[length]}

${contentTypeInstructions[contentType]}

Be creative but authentic. Avoid spam trigger words and overly promotional language.
For emails, ensure deliverability by avoiding ALL CAPS, excessive punctuation, and spam words.`;

  const userPrompt = `Create ${contentType} content based on this brief:

${prompt}

Requirements:
- ${tone} tone
- Target length: ${lengthGuide[length]}
${industry ? `- Industry context: ${industry}` : ''}
${targetAudience ? `- Target audience: ${targetAudience}` : ''}

Generate the content now.`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: contentGenerationSchema
      }
    });

    return JSON.parse(res.text || '{}');
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to generate content. Please try again.");
  }
};
