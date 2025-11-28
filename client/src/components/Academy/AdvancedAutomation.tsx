import { ModuleHeader, SectionWrapper, KnowledgeCheck, InfoBox } from './ModuleComponents';
import { AutomationIcon } from '../icons/CategoryIcons';

export const AdvancedAutomation: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="Advanced Automation & Dynamic Content" subtitle="Use behavioral triggers and dynamic content to create 1:1 email experiences at scale." />
        
        <SectionWrapper title="Beyond Basic Automation" subtitle="The Evolution of Email Personalization">
            <p>Basic automation sends the same email to everyone who triggers it. Advanced automation creates unique experiences based on who the subscriber is and what they've done.</p>
            <p className="mt-2">The goal is to make every subscriber feel like the email was written just for them—at scale.</p>
        </SectionWrapper>

        <SectionWrapper title="Behavioral Triggers" subtitle="Acting on Real-Time Actions">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Page View Triggers:</strong> Email about products/content they viewed</li>
                <li><strong>Video Watch Triggers:</strong> Follow up based on how much they watched</li>
                <li><strong>Scroll Depth:</strong> Target based on content engagement level</li>
                <li><strong>Form Field Abandonment:</strong> Re-engage when they start but don't finish</li>
                <li><strong>Feature Usage:</strong> Trigger based on product behavior (SaaS)</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Dynamic Content Blocks" subtitle="One Email, Many Versions">
            <p>Dynamic content shows different content to different subscribers within the same email:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Product Recommendations:</strong> Based on browsing/purchase history</li>
                <li><strong>Location-Based Content:</strong> Local events, weather, store locations</li>
                <li><strong>Persona-Based Messaging:</strong> Different value props for different segments</li>
                <li><strong>Countdown Timers:</strong> Personalized deadlines for each recipient</li>
                <li><strong>Loyalty Status:</strong> Different content for VIPs vs. new customers</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Conditional Logic in Flows" subtitle="If-Then Automation Branching">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Engagement Splits:</strong> Different paths for openers vs. non-openers</li>
                <li><strong>Purchase Splits:</strong> Buyers get different follow-ups than browsers</li>
                <li><strong>Score-Based Routing:</strong> Hot leads to sales, cold leads to nurture</li>
                <li><strong>Time-Based Logic:</strong> Different messages for different time zones</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Predictive Personalization" subtitle="Using AI and Machine Learning">
            <p>The frontier of email automation uses AI to predict and personalize:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Send Time Optimization:</strong> AI picks the best time for each subscriber</li>
                <li><strong>Content Optimization:</strong> Automatically select best-performing variants</li>
                <li><strong>Churn Prediction:</strong> Identify at-risk subscribers before they leave</li>
                <li><strong>Lifetime Value Prediction:</strong> Identify high-potential customers early</li>
            </ul>
        </SectionWrapper>

        <InfoBox icon={<AutomationIcon />}>
            <p className="text-purple-200 text-sm">Start with one advanced feature—like dynamic product recommendations—and measure the impact before adding more complexity. Each layer should prove its value.</p>
        </InfoBox>

        <KnowledgeCheck
            question="What is the main advantage of dynamic content blocks?"
            options={[
                { text: "They make emails load faster", isCorrect: false },
                { text: "They allow one email to display different content to different subscribers", isCorrect: true },
                { text: "They reduce the need for A/B testing", isCorrect: false }
            ]}
            explanation="Dynamic content blocks allow you to create one email template that displays different content to different subscribers based on their attributes or behavior. This creates personalized experiences at scale without having to build separate campaigns for each segment."
        />
    </div>
);
