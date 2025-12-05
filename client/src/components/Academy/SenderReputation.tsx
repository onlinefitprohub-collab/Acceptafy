import { MonitorIcon } from '../icons/CategoryIcons';
import { ModuleHeader, SectionWrapper, InfoBox, KnowledgeCheck } from './ModuleComponents';

interface ModuleProps {
    onBack: () => void;
}

export const SenderReputation: React.FC<ModuleProps> = ({ onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <ModuleHeader
                onBack={onBack}
                title="Sender Reputation Management"
                subtitle="Learn about the most critical, invisible factor in deliverability: the 'credit score' that inbox providers assign to you."
            />
            
            <SectionWrapper
                title="What is Sender Reputation?"
                subtitle="Your Emailing 'Credit Score'"
            >
                <p>Sender reputation is a score that an Internet Service Provider (ISP) like Gmail, Outlook, or Yahoo assigns to your sending domain. This score determines whether they trust you enough to deliver your emails to the primary inbox, the promotions tab, or the spam folder.</p>
                <p>A high reputation score means your emails are wanted and trusted. A low score means you look like a spammer, and your emails will be heavily filtered or blocked entirely.</p>
                <p><strong className="text-gray-200">There are two main types of reputation:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong className="text-gray-200">IP Reputation:</strong> Tied to the specific mail server (IP address) sending the email. This is mostly managed by your Email Service Provider (ESP).</li>
                    <li><strong className="text-gray-200">Domain Reputation:</strong> Tied to your sending domain (e.g., yourcompany.com). This is YOUR reputation, and it follows you even if you switch ESPs. It is the more important factor for long-term success.</li>
                </ul>
            </SectionWrapper>

            <SectionWrapper
                title="How Your Reputation is Calculated"
                subtitle="Positive vs. Negative Signals"
            >
                <p>ISPs are constantly watching how recipients interact with your emails. They use these interactions as signals to adjust your reputation score up or down.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                        <h4 className="font-bold text-green-300">Positive Signals (Increase Your Score)</h4>
                        <ul className="list-disc list-inside space-y-1 mt-2 text-sm text-gray-300">
                            <li>High open rates</li>
                            <li>High click-through rates</li>
                            <li>Recipients replying to your emails</li>
                            <li>Marking your email as "Not Spam"</li>
                            <li>Moving your email from Promotions to Primary</li>
                        </ul>
                    </div>
                     <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                        <h4 className="font-bold text-red-300">Negative Signals (Decrease Your Score)</h4>
                        <ul className="list-disc list-inside space-y-1 mt-2 text-sm text-gray-300">
                            <li>High hard bounce rates (invalid addresses)</li>
                            <li>Recipients marking your email as spam</li>
                            <li>High unsubscribe rates</li>
                            <li>Recipients deleting your email without opening</li>
                            <li>Sending to known spam traps</li>
                        </ul>
                    </div>
                </div>
            </SectionWrapper>
            
            <InfoBox icon={<MonitorIcon />}>
                <div>
                    <h4 className="font-bold text-white">How to Monitor Your Reputation</h4>
                    <p className="text-purple-200 text-sm">A great free tool for this is <strong className="font-semibold">Google Postmaster Tools</strong>. Setting it up gives you direct insight into how Gmail views your domain's reputation, including data on spam complaint rates, IP reputation, and more.</p>
                </div>
            </InfoBox>

            <KnowledgeCheck
                question="Which of the following recipient actions is the STRONGEST positive signal to an ISP?"
                options={[
                    { text: "Opening the email.", isCorrect: false },
                    { text: "Clicking a link in the email.", isCorrect: false },
                    { text: "Replying to the email.", isCorrect: true },
                    { text: "Not unsubscribing from the email.", isCorrect: false },
                ]}
                explanation="A reply is a powerful signal that a genuine, two-way conversation is happening. ISPs view this as a very strong indicator that your emails are highly desired, which provides a significant boost to your sender reputation."
            />
        </div>
    );
};
