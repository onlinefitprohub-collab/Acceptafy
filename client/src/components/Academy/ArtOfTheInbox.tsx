import { ModuleHeader, SectionWrapper, KnowledgeCheck } from './ModuleComponents';

export const ArtOfTheInbox: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="Anatomy of a Great Email" subtitle="Master the core components of an email that gets opened and read." />
        <SectionWrapper title="Winning the Open" subtitle="Subject Lines & Preview Text">
            <p>Your subject line and preview text work together to capture attention in a crowded inbox. Clarity often beats cleverness—the reader should immediately understand the value of opening your email.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Keep subject lines under 50 characters for mobile</li>
                <li>Use preview text to expand on the subject, not repeat it</li>
                <li>Create curiosity without being misleading</li>
                <li>Personalization can boost open rates significantly</li>
            </ul>
        </SectionWrapper>
        <SectionWrapper title="The Body: Building Trust" subtitle="Writing Copy That Connects">
            <p>The body of your email should deliver on the promise made in your subject line. Start with the most important information and use short paragraphs.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Lead with value—what's in it for the reader?</li>
                <li>Use "you" more than "we" or "I"</li>
                <li>Break up text with subheadings and bullet points</li>
                <li>Keep sentences short and scannable</li>
            </ul>
        </SectionWrapper>
        <SectionWrapper title="Driving the Action" subtitle="The Call to Action (CTA)">
            <p>Focus on the value the user gets, not just the action. "Get Your Free Guide" is better than "Download." Your CTA should be the natural next step after reading your email.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Use action verbs that imply benefit</li>
                <li>Make your button or link visually prominent</li>
                <li>Limit to one primary CTA per email</li>
                <li>Create urgency when appropriate (but don't fake it)</li>
            </ul>
        </SectionWrapper>
        <KnowledgeCheck
            question="When writing a Call to Action, what is the most effective approach?"
            options={[
                { text: "Focus on the action (e.g., 'Click Here', 'Download')", isCorrect: false },
                { text: "Focus on the value/benefit (e.g., 'Get Your Free Guide')", isCorrect: true }
            ]}
            explanation="Exactly! People are motivated by what they'll gain. Benefit-focused CTAs consistently outperform action-only CTAs because they remind the reader why they should take action."
        />
    </div>
);
