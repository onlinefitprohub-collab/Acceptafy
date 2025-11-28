import { ModuleHeader, SectionWrapper, KnowledgeCheck, InfoBox } from './ModuleComponents';
import { BlueprintIcon } from '../icons/CategoryIcons';

export const NewsletterBlueprint: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="The Newsletter Engagement Blueprint" subtitle="Discover how to plan content, maintain consistency, and keep your audience engaged long-term." />
        
        <SectionWrapper title="The Newsletter Mindset" subtitle="Building a Media Company">
            <p>The most successful newsletters don't feel like marketing—they feel like a publication subscribers look forward to. You're not just sending emails; you're building a media brand.</p>
            <p className="mt-2">Consistency, value, and voice are the three pillars of newsletter success. Master these, and your list becomes an invaluable asset.</p>
        </SectionWrapper>

        <SectionWrapper title="Finding Your Format" subtitle="Structures That Work">
            <p>Choose a format that you can sustain and that resonates with your audience:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>The Curator:</strong> Handpicked links with your commentary</li>
                <li><strong>The Teacher:</strong> One deep lesson or tutorial per issue</li>
                <li><strong>The Analyst:</strong> Industry news and your expert take</li>
                <li><strong>The Storyteller:</strong> Personal stories with business lessons</li>
                <li><strong>The Hybrid:</strong> Mix of the above with consistent sections</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="The Content Calendar" subtitle="Planning for Consistency">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Choose a realistic frequency:</strong> Weekly is ideal for most, bi-weekly is minimum</li>
                <li><strong>Pick a consistent day and time:</strong> Train readers when to expect you</li>
                <li><strong>Batch create content:</strong> Write 2-4 issues at once when inspired</li>
                <li><strong>Build a content backlog:</strong> Always have 2+ issues ready</li>
                <li><strong>Create repeatable templates:</strong> Reduce decision fatigue</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Engagement Tactics" subtitle="Keep Readers Coming Back">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Ask questions:</strong> Invite replies and create dialogue</li>
                <li><strong>Feature subscribers:</strong> Share their wins, questions, or feedback</li>
                <li><strong>Create running segments:</strong> Recurring sections readers look forward to</li>
                <li><strong>Add personality:</strong> Let your unique voice shine through</li>
                <li><strong>Include exclusive content:</strong> Give readers what they can't get elsewhere</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Growing Your Newsletter" subtitle="Sustainable List Building">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Create a compelling landing page:</strong> Explain the value proposition clearly</li>
                <li><strong>Offer a lead magnet:</strong> Give something valuable for signing up</li>
                <li><strong>Leverage social proof:</strong> Show subscriber count, testimonials</li>
                <li><strong>Cross-promote:</strong> Guest posts, podcast appearances, collaborations</li>
                <li><strong>Encourage forwards:</strong> Ask readers to share with friends</li>
            </ul>
        </SectionWrapper>

        <InfoBox icon={<BlueprintIcon />}>
            <p className="text-purple-200 text-sm">The best newsletter strategy is one you'll actually stick to. A consistent bi-weekly newsletter beats an inconsistent daily one every time.</p>
        </InfoBox>

        <KnowledgeCheck
            question="What is the most important factor for long-term newsletter success?"
            options={[
                { text: "Having the most sophisticated email design", isCorrect: false },
                { text: "Consistency in publishing schedule and quality", isCorrect: true },
                { text: "Sending as frequently as possible", isCorrect: false }
            ]}
            explanation="Consistency is king in newsletters. Subscribers develop habits around when they expect to hear from you. A consistent, quality newsletter builds trust and anticipation that keeps readers engaged long-term."
        />
    </div>
);
