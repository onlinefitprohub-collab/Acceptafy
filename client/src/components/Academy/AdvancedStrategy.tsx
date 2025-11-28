import { ModuleHeader, SectionWrapper, KnowledgeCheck } from './ModuleComponents';

export const AdvancedStrategy: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="Advanced Copywriting" subtitle="Unlock the secrets to powerful personalization, A/B testing, and effective follow-ups." />
        <SectionWrapper title="The Power of Personalization" subtitle="Beyond First Name Tokens">
            <p>True personalization goes far beyond inserting someone's first name. It's about sending the right message to the right person at the right time.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Segment by behavior, not just demographics</li>
                <li>Reference past interactions or purchases</li>
                <li>Tailor content to the subscriber's stage in your funnel</li>
                <li>Use dynamic content blocks for scalable personalization</li>
            </ul>
        </SectionWrapper>
        <SectionWrapper title="A/B Testing That Matters" subtitle="Scientific Email Optimization">
            <p>A/B testing isn't just about subject lines. Test everything systematically to continuously improve your results.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Test one variable at a time for clear insights</li>
                <li>Ensure statistical significance before declaring a winner</li>
                <li>Test send times, not just content</li>
                <li>Document learnings to build institutional knowledge</li>
            </ul>
        </SectionWrapper>
        <SectionWrapper title="The Follow-Up Formula" subtitle="Persistence Without Annoyance">
            <p>Most sales happen after the 5th touchpoint, but most marketers give up after 2. The key is following up with value, not just reminders.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Each follow-up should add new value or angle</li>
                <li>Vary your approach—try questions, social proof, urgency</li>
                <li>Respect the "soft no" and provide an easy opt-out</li>
                <li>Space follow-ups appropriately (not daily!)</li>
            </ul>
        </SectionWrapper>
        <KnowledgeCheck
            question="What is the most important principle when A/B testing emails?"
            options={[
                { text: "Test as many variables as possible to learn faster", isCorrect: false },
                { text: "Test one variable at a time for clear insights", isCorrect: true },
                { text: "Always test subject lines first", isCorrect: false }
            ]}
            explanation="Correct! Testing one variable at a time allows you to clearly attribute any difference in results to that specific change. Testing multiple variables simultaneously makes it impossible to know what actually caused the difference."
        />
    </div>
);
