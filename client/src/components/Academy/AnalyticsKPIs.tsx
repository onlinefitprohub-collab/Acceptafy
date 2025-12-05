import { AnalyticsIcon } from '../icons/CategoryIcons';
import { ModuleHeader, SectionWrapper, InfoBox, KnowledgeCheck } from './ModuleComponents';

interface ModuleProps {
    onBack: () => void;
}

export const AnalyticsKPIs: React.FC<ModuleProps> = ({ onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <ModuleHeader
                onBack={onBack}
                title="Analytics & KPIs"
                subtitle="Learn to measure what matters. This module covers the key performance indicators (KPIs) that tell you whether your email campaigns are successful."
            />
            
            <SectionWrapper
                title="The Four Core Metrics"
                subtitle="The KPIs You Should Track for Every Campaign"
            >
                <p>While there are many data points available, these four metrics provide the clearest picture of your email campaign's performance.</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong className="text-gray-200">Open Rate:</strong> The percentage of recipients who opened your email. This is a primary indicator of your subject line's effectiveness and your overall sender reputation.</li>
                    <li><strong className="text-gray-200">Click-Through Rate (CTR):</strong> The percentage of recipients who clicked on at least one link in your email. This measures how compelling your email's content and call to action were.</li>
                    <li><strong className="text-gray-200">Conversion Rate:</strong> The percentage of recipients who completed a desired action (e.g., made a purchase, filled out a form) after clicking. This is the ultimate measure of your email's effectiveness at driving business goals.</li>
                    <li><strong className="text-gray-200">Bounce Rate:</strong> The percentage of emails that could not be delivered. A high bounce rate (especially "hard bounces" from invalid addresses) can severely damage your sender reputation.</li>
                </ul>
            </SectionWrapper>

            <SectionWrapper
                title="Secondary Health Metrics"
                subtitle="Indicators of List Health and Engagement"
            >
                <p>These metrics provide valuable context about the long-term health and engagement of your email list.</p>
                 <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong className="text-gray-200">Unsubscribe Rate:</strong> The percentage of recipients who opt out of your list. A small number is normal, but a spike can indicate issues with frequency, content relevance, or targeting.</li>
                    <li><strong className="text-gray-200">List Growth Rate:</strong> Measures how quickly your list is growing. A healthy list should always be attracting new, interested subscribers.</li>
                    <li><strong className="text-gray-200">Spam Complaint Rate:</strong> The percentage of recipients who mark your email as spam. This number should be as close to zero as possible, as even a few complaints can harm your deliverability.</li>
                </ul>
            </SectionWrapper>

            <InfoBox icon={<AnalyticsIcon />}>
                <div>
                    <h4 className="font-bold text-white">Connect Analysis to Analytics</h4>
                    <p className="text-purple-200 text-sm">Use Acceptafy's analysis to directly influence your KPIs. A better <strong className="font-semibold">Inbox Placement Score</strong> leads to a higher Open Rate. A better <strong className="font-semibold">Call to Action</strong> grade leads to a higher CTR and Conversion Rate.</p>
                </div>
            </InfoBox>

             <KnowledgeCheck
                question="Which metric is the best indicator of a successful subject line?"
                options={[
                    { text: "Conversion Rate", isCorrect: false },
                    { text: "Click-Through Rate", isCorrect: false },
                    { text: "Bounce Rate", isCorrect: false },
                    { text: "Open Rate", isCorrect: true },
                ]}
                explanation="A high Open Rate means your subject line and preview text successfully intrigued the recipient enough to open the email and see what's inside."
            />
        </div>
    );
};
