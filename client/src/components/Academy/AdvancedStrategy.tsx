import { FollowUpIcon, PersonalizationIcon, SubjectShowdownIcon } from '../icons/CategoryIcons';
import { ModuleHeader, SectionWrapper, InfoBox, KnowledgeCheck } from './ModuleComponents';

interface ModuleProps {
    onBack: () => void;
}

export const AdvancedStrategy: React.FC<ModuleProps> = ({ onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <ModuleHeader
                onBack={onBack}
                title="Advanced Copywriting"
                subtitle="Go beyond the basics with strategies for effective follow-ups, meaningful personalization, and data-driven A/B testing."
            />
            
            <SectionWrapper
                title="The Value-Driven Follow-Up"
                subtitle="How to Be Persistent, Not Annoying"
            >
                <p>Most conversions don't happen on the first email. A strategic follow-up sequence is essential, but it must provide value each time, not just serve as a reminder.</p>
                 <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong className="text-foreground">Offer New Value Every Time:</strong> Avoid the dreaded "just checking in" email. Each follow-up should offer a new piece of value: a relevant blog post, a different case study, a solution to a common problem, or a new benefit of your product.</li>
                    <li><strong className="text-foreground">Vary Your Angle:</strong> Approach the topic from different perspectives. Your first email might focus on saving time. The follow-up could focus on saving money. The next could feature a customer testimonial.</li>
                    <li><strong className="text-foreground">The "Break-Up" Email:</strong> A final, polite email stating you'll stop following up ("If I don't hear back, I'll assume the timing isn't right and won't bother you again") respects their inbox and often elicits a response.</li>
                </ul>
                 <InfoBox icon={<FollowUpIcon className="w-5 h-5" />}>
                    <p className="text-purple-600 dark:text-purple-200 text-sm">Use our AI <strong className="font-semibold">10-Email Sequence Generator</strong> to create a full, value-driven follow-up campaign in seconds.</p>
                </InfoBox>
            </SectionWrapper>

            <SectionWrapper
                title="Personalization Beyond `[First Name]`"
                subtitle="Making Mass Emails Feel One-to-One"
            >
                <p>True personalization goes far beyond simple mail merge tags. It's about using data to make your message deeply relevant to the recipient's context and needs.</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong className="text-foreground">Reference Their Industry or Role:</strong> An email to a software developer should use different language and address different pain points than an email to a marketing manager.</li>
                    <li><strong className="text-foreground">Leverage Behavioral Data:</strong> Use their past actions to inform your content. "I saw you downloaded our guide on [Topic X], so I thought you'd find this case study on [Topic Y] interesting..." This makes the email feel timely and relevant.</li>
                    <li><strong className="text-foreground">Adopt a Conversational Tone:</strong> Write like a human, not a corporation. Use contractions (you're, it's), ask genuine questions, and keep your language clear and direct.</li>
                </ul>
                <InfoBox icon={<PersonalizationIcon />}>
                    <p className="text-purple-600 dark:text-purple-200 text-sm">Aim to maximize the <strong className="font-semibold">Personalization & Authenticity</strong> score in our analysis. A high score indicates your email feels like a personal conversation, not a broadcast.</p>
                </InfoBox>
            </SectionWrapper>
            
            <SectionWrapper
                title="A/B Testing for Optimization"
                subtitle="The Scientific Method for Better Emails"
            >
                <p>A/B testing, or split testing, is the process of comparing two versions of an email to see which one performs better. Stop guessing what works and let your audience tell you with their actions.</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong className="text-foreground">Isolate One Variable:</strong> The cardinal rule of A/B testing. To get a clear result, only change one element at a time (e.g., the subject line OR the call-to-action button color, but not both).</li>
                    <li><strong className="text-foreground">Define Your Success Metric:</strong> Know what you're measuring before you start. For a subject line test, the key metric is Open Rate. For a CTA test, it's Click-Through Rate.</li>
                    <li><strong className="text-foreground">Trust the Data:</strong> Your assumptions will often be wrong. The "boring" subject line might outperform the "creative" one. Let the data guide your decisions for future campaigns.</li>
                </ul>
                <InfoBox icon={<SubjectShowdownIcon />}>
                    <p className="text-purple-600 dark:text-purple-200 text-sm">Our <strong className="font-semibold">Subject Line Showdown</strong> feature acts as a predictive A/B test, simulating which of your subject lines is most likely to result in a higher open rate.</p>
                </InfoBox>
            </SectionWrapper>

            <KnowledgeCheck
                question="When A/B testing an email, what is the most important rule to follow?"
                options={[
                    { text: "Always go with your gut instinct.", isCorrect: false },
                    { text: "Change multiple elements at once to save time.", isCorrect: false },
                    { text: "Only change one variable at a time.", isCorrect: true },
                    { text: "Only test with a very small number of subscribers.", isCorrect: false },
                ]}
                explanation="By only changing one variable (like the subject line OR the call-to-action), you can be certain that any change in performance is due to that specific element."
            />
        </div>
    );
};
