import { ModuleHeader, SectionWrapper, KnowledgeCheck, InfoBox } from './ModuleComponents';
import { BlueprintIcon } from '../icons/CategoryIcons';

export const ColdOutreachBlueprint: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="The Cold Outreach Blueprint" subtitle="Learn how to structure a 5-email sequence for prospecting and personalization at scale." />
        
        <SectionWrapper title="The Psychology of Cold Email" subtitle="Why Most Cold Emails Fail">
            <p>Most cold emails fail because they're all about the sender. Successful cold outreach is about the recipient—their problems, their goals, their world.</p>
            <p className="mt-2">The goal of your first cold email isn't to make a sale. It's to start a conversation. Every element should be designed to earn a reply.</p>
        </SectionWrapper>

        <SectionWrapper title="Email 1: The Pattern Interrupt" subtitle="Sent immediately after identifying prospect">
            <p>Purpose: Break through the noise with genuine relevance.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Lead with specific research about them</li>
                <li>Connect your offering to their current situation</li>
                <li>End with a low-friction question, not a request</li>
                <li>Keep it under 100 words</li>
            </ul>
            <div className="mt-3 p-3 bg-gray-900/50 rounded text-sm">
                <p className="italic">"Hi [Name], saw your recent post about [specific topic]. We helped [similar company] solve that exact challenge—reduced their [metric] by 40%. Worth a quick chat?"</p>
            </div>
        </SectionWrapper>

        <SectionWrapper title="Email 2: The Value Add" subtitle="3-4 days after Email 1">
            <p>Purpose: Provide value without asking for anything in return.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Share a relevant resource, insight, or idea</li>
                <li>Reference your first email briefly</li>
                <li>Ask if this resonates with their challenges</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Email 3: Social Proof" subtitle="5-6 days after Email 2">
            <p>Purpose: Build credibility through results.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Share a mini case study relevant to their industry</li>
                <li>Focus on outcomes, not features</li>
                <li>Make the connection to their situation explicit</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Email 4: Different Angle" subtitle="7-8 days after Email 3">
            <p>Purpose: Try a fresh approach.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Acknowledge you've reached out before</li>
                <li>Present a different benefit or use case</li>
                <li>Ask if there's someone else who might be better to speak with</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Email 5: The Breakup" subtitle="10-14 days after Email 4">
            <p>Purpose: Create closure and sometimes trigger responses.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Be respectful and professional</li>
                <li>State you won't email again (and mean it)</li>
                <li>Leave the door open for future contact</li>
            </ul>
            <div className="mt-3 p-3 bg-gray-900/50 rounded text-sm">
                <p className="italic">"Hi [Name], I'll assume the timing isn't right and won't fill your inbox further. If things change, you know where to find me. Best of luck with [their initiative]."</p>
            </div>
        </SectionWrapper>

        <InfoBox icon={<BlueprintIcon />}>
            <p className="text-purple-200 text-sm">The "breakup email" often gets the highest response rate. People respond to scarcity and closure. Just make sure you actually stop emailing if they don't reply.</p>
        </InfoBox>

        <KnowledgeCheck
            question="What should be the primary goal of your first cold email?"
            options={[
                { text: "Book a meeting or demo call", isCorrect: false },
                { text: "Start a conversation and earn a reply", isCorrect: true },
                { text: "Explain all the features of your product", isCorrect: false }
            ]}
            explanation="The first cold email should aim to start a conversation, not close a deal. Asking for too much too soon (like a meeting) creates friction. A simple reply opens the door to further dialogue and eventual opportunities."
        />
    </div>
);
