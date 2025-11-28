import { ModuleHeader, SectionWrapper, KnowledgeCheck, InfoBox } from './ModuleComponents';
import { AutomationIcon } from '../icons/CategoryIcons';

export const AutomationWorkflows: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="Automation Fundamentals" subtitle="Build powerful welcome and nurture sequences that convert subscribers 24/7." />
        
        <SectionWrapper title="The Power of Automation" subtitle="Work Smarter, Not Harder">
            <p>Email automation is like having a tireless sales team working 24/7. Once set up, automated sequences nurture leads, welcome new subscribers, and recover abandoned carts—all without manual intervention.</p>
            <p className="mt-2">The best part? Automated emails typically see 70% higher open rates and 152% higher click-through rates than standard bulk emails.</p>
        </SectionWrapper>

        <SectionWrapper title="The Welcome Sequence" subtitle="First Impressions Count">
            <p>Your welcome sequence is the most important automation you'll build. Here's a proven 5-email framework:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Email 1 (Immediate):</strong> Deliver the promised value, set expectations</li>
                <li><strong>Email 2 (Day 1):</strong> Share your story, build connection</li>
                <li><strong>Email 3 (Day 3):</strong> Provide valuable content, establish authority</li>
                <li><strong>Email 4 (Day 5):</strong> Social proof, testimonials, case studies</li>
                <li><strong>Email 5 (Day 7):</strong> Soft pitch, invitation to take next step</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Trigger-Based Automations" subtitle="Right Message, Right Time">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Page Visit Triggers:</strong> Send relevant content when they view key pages</li>
                <li><strong>Inactivity Triggers:</strong> Re-engage subscribers who've gone quiet</li>
                <li><strong>Purchase Triggers:</strong> Post-purchase follow-ups, cross-sells, reviews</li>
                <li><strong>Date Triggers:</strong> Birthdays, anniversaries, renewal reminders</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Nurture Sequences" subtitle="Building Trust Over Time">
            <p>Nurture sequences educate and build trust with prospects who aren't ready to buy. The key principles:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Lead with value, not sales pitches</li>
                <li>Mix content types: articles, videos, case studies</li>
                <li>Include engagement triggers (clicks, replies) to identify hot leads</li>
                <li>Gradually increase commitment asks over time</li>
            </ul>
        </SectionWrapper>

        <InfoBox icon={<AutomationIcon />}>
            <p className="text-purple-200 text-sm">Start with one automation—your welcome sequence. Perfect it before adding more complexity. A great welcome sequence alone can transform your email ROI.</p>
        </InfoBox>

        <KnowledgeCheck
            question="What is the primary purpose of a welcome email sequence?"
            options={[
                { text: "To immediately sell products to new subscribers", isCorrect: false },
                { text: "To deliver value, set expectations, and build trust before pitching", isCorrect: true },
                { text: "To gather as much data about the subscriber as possible", isCorrect: false }
            ]}
            explanation="The welcome sequence's primary job is to deliver on your sign-up promise, set expectations for future emails, and begin building trust. Selling too early in the relationship typically backfires—earn the right to pitch first."
        />
    </div>
);
