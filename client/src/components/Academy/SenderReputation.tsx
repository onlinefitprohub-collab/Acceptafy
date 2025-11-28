import { ModuleHeader, SectionWrapper, KnowledgeCheck, InfoBox } from './ModuleComponents';
import { MonitorIcon } from '../icons/CategoryIcons';

export const SenderReputation: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="Sender Reputation Management" subtitle="Learn how inbox providers 'score' you and how to stay in their good graces." />
        
        <SectionWrapper title="What is Sender Reputation?" subtitle="Your Email Credit Score">
            <p>Sender reputation is a score that inbox providers (Gmail, Outlook, Yahoo) assign to your sending domain and IP address. It determines whether your emails land in the inbox, promotions tab, or spam folder.</p>
            <p className="mt-2">Like a credit score, sender reputation is built over time through consistent positive behavior and can be damaged quickly by poor practices.</p>
        </SectionWrapper>

        <SectionWrapper title="Factors That Affect Reputation" subtitle="What Inbox Providers Measure">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Bounce Rate:</strong> High bounces signal poor list quality</li>
                <li><strong>Spam Complaints:</strong> The most damaging factor</li>
                <li><strong>Engagement:</strong> Opens, clicks, replies improve reputation</li>
                <li><strong>Spam Trap Hits:</strong> Sending to known spam traps is very harmful</li>
                <li><strong>Unsubscribe Rate:</strong> High rates suggest unwanted email</li>
                <li><strong>Sending Volume:</strong> Sudden spikes look suspicious</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Monitoring Your Reputation" subtitle="Tools and Metrics to Track">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Google Postmaster Tools:</strong> Essential for Gmail reputation data</li>
                <li><strong>Microsoft SNDS:</strong> Sender reputation for Outlook/Hotmail</li>
                <li><strong>Sender Score (Validity):</strong> Third-party reputation scoring</li>
                <li><strong>Blacklist Monitors:</strong> Check if you're on any blacklists</li>
                <li><strong>Your own metrics:</strong> Track bounces, complaints, engagement trends</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="IP Warming" subtitle="Building Reputation on New Infrastructure">
            <p>When you get a new IP address or domain, it has no reputation. You need to "warm it up" gradually:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Start small:</strong> Send to your most engaged subscribers first</li>
                <li><strong>Increase gradually:</strong> Double volume every few days</li>
                <li><strong>Monitor closely:</strong> Watch for bounce and complaint spikes</li>
                <li><strong>Be patient:</strong> Full warming takes 2-6 weeks</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Recovering from Reputation Damage" subtitle="When Things Go Wrong">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Identify the cause:</strong> Bad list? Poor content? Technical issue?</li>
                <li><strong>Pause non-essential sends:</strong> Stop the bleeding</li>
                <li><strong>Clean your list aggressively:</strong> Remove unengaged subscribers</li>
                <li><strong>Improve engagement:</strong> Only email your best subscribers</li>
                <li><strong>Rebuild slowly:</strong> Gradually increase volume as metrics improve</li>
            </ul>
        </SectionWrapper>

        <InfoBox icon={<MonitorIcon />}>
            <p className="text-purple-200 text-sm">Prevention is easier than cure. Maintain good list hygiene and engagement practices to avoid reputation problems in the first place.</p>
        </InfoBox>

        <KnowledgeCheck
            question="Which factor is most damaging to sender reputation?"
            options={[
                { text: "High unsubscribe rates", isCorrect: false },
                { text: "Spam complaints", isCorrect: true },
                { text: "Low open rates", isCorrect: false }
            ]}
            explanation="Spam complaints are the most damaging factor. Each complaint signals to the inbox provider that you're sending unwanted email. Even a complaint rate above 0.1% can cause deliverability issues. This is why having a visible, easy unsubscribe option is crucial—better they unsubscribe than mark as spam."
        />
    </div>
);
