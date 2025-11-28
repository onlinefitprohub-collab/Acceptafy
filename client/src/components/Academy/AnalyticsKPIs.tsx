import { ModuleHeader, SectionWrapper, KnowledgeCheck, InfoBox } from './ModuleComponents';
import { AnalyticsIcon } from '../icons/CategoryIcons';

export const AnalyticsKPIs: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="Analytics & KPIs That Matter" subtitle="Learn which metrics actually matter and how to use them to fuel your growth." />
        
        <SectionWrapper title="The Metrics Hierarchy" subtitle="Not All Numbers Are Equal">
            <p>With dozens of metrics available, it's easy to get lost in vanity metrics that don't drive business results. Focus on these tiers:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Tier 1 (Revenue):</strong> Revenue per email, conversion rate, ROI</li>
                <li><strong>Tier 2 (Engagement):</strong> Click-through rate, reply rate</li>
                <li><strong>Tier 3 (Reach):</strong> Open rate, deliverability, list growth</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Understanding Open Rates" subtitle="The First Hurdle">
            <p>Open rate measures how many recipients opened your email. While impacted by Apple's Mail Privacy Protection, it's still useful for relative comparisons.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Benchmark:</strong> 20-25% for most industries</li>
                <li><strong>What it tells you:</strong> Subject line effectiveness, sender reputation, list quality</li>
                <li><strong>How to improve:</strong> Better subject lines, optimal send times, list cleaning</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Click-Through Rate (CTR)" subtitle="The Action Metric">
            <p>CTR measures engagement with your content—it shows that people not only opened but found your message compelling enough to act.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Benchmark:</strong> 2-5% for most industries</li>
                <li><strong>What it tells you:</strong> Content relevance, CTA effectiveness, offer appeal</li>
                <li><strong>How to improve:</strong> Clearer CTAs, better segmentation, more relevant content</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Conversion & Revenue Metrics" subtitle="The Bottom Line">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Conversion Rate:</strong> Percentage who completed the desired action</li>
                <li><strong>Revenue Per Email (RPE):</strong> Total revenue ÷ emails sent</li>
                <li><strong>Customer Lifetime Value:</strong> How much email-acquired customers are worth</li>
                <li><strong>Email Marketing ROI:</strong> (Revenue - Cost) ÷ Cost × 100</li>
            </ul>
        </SectionWrapper>

        <InfoBox icon={<AnalyticsIcon />}>
            <p className="text-purple-200 text-sm">Track trends, not just snapshots. A 15% open rate might seem low, but if it's up from 10% last month, you're making progress. Context matters.</p>
        </InfoBox>

        <KnowledgeCheck
            question="Which metric is the most meaningful indicator of email marketing success?"
            options={[
                { text: "Open rate - it shows people are reading", isCorrect: false },
                { text: "List size - bigger is always better", isCorrect: false },
                { text: "Revenue per email - it ties directly to business results", isCorrect: true }
            ]}
            explanation="Revenue per email (RPE) is the ultimate measure of email marketing success because it directly ties your email efforts to business outcomes. A small, engaged list with high RPE beats a large list with poor engagement every time."
        />
    </div>
);
