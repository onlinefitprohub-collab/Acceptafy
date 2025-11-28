import { ModuleHeader, SectionWrapper, KnowledgeCheck, InfoBox } from './ModuleComponents';
import { UserGroupIcon } from '../icons/CategoryIcons';

export const ListSegmentation: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="Mastering List Segmentation" subtitle="Discover the power of a clean, segmented list for radically better engagement." />
        
        <SectionWrapper title="Why Segmentation Matters" subtitle="The Foundation of Relevance">
            <p>Sending the same email to everyone is like shouting in a crowded room—most people will ignore you. Segmentation lets you whisper exactly what each person wants to hear.</p>
            <p className="mt-2">Segmented campaigns have been shown to generate up to 760% more revenue than non-segmented campaigns. The reason? Relevance. When your message matches the recipient's interests and needs, they're far more likely to engage.</p>
        </SectionWrapper>

        <SectionWrapper title="Demographic Segmentation" subtitle="Who Your Subscribers Are">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Age & Generation:</strong> Baby Boomers vs. Gen Z respond to very different messaging</li>
                <li><strong>Location:</strong> Time zones, local events, regional preferences</li>
                <li><strong>Job Title/Industry:</strong> Essential for B2B personalization</li>
                <li><strong>Company Size:</strong> SMB vs. Enterprise have different needs and budgets</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Behavioral Segmentation" subtitle="How Your Subscribers Act">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Purchase History:</strong> Past buyers, average order value, product categories</li>
                <li><strong>Email Engagement:</strong> Active openers vs. inactive subscribers</li>
                <li><strong>Website Activity:</strong> Pages visited, content downloaded, time on site</li>
                <li><strong>Funnel Stage:</strong> New leads vs. qualified prospects vs. customers</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Engagement-Based Segmentation" subtitle="How Recently They've Engaged">
            <p>One of the most powerful segmentation strategies is based on recency of engagement:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Hot:</strong> Engaged in last 30 days—send your best offers</li>
                <li><strong>Warm:</strong> Engaged in last 60-90 days—re-engage with value</li>
                <li><strong>Cold:</strong> No engagement in 90+ days—win-back campaigns</li>
                <li><strong>Dead:</strong> No engagement in 6+ months—consider removing</li>
            </ul>
        </SectionWrapper>

        <InfoBox icon={<UserGroupIcon />}>
            <p className="text-purple-200 text-sm">Start with just 2-3 segments based on engagement level. As you get more sophisticated, add behavioral and demographic layers.</p>
        </InfoBox>

        <KnowledgeCheck
            question="Which type of segmentation is typically most impactful for email marketing results?"
            options={[
                { text: "Demographic (age, location, job title)", isCorrect: false },
                { text: "Behavioral (actions, engagement, purchases)", isCorrect: true },
                { text: "Psychographic (interests, values, lifestyle)", isCorrect: false }
            ]}
            explanation="Behavioral segmentation is usually most impactful because it's based on what people actually do, not just who they are. Actions like opening emails, clicking links, and making purchases are strong indicators of future behavior and intent."
        />
    </div>
);
