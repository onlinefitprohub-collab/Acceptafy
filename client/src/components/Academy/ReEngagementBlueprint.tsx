import { BlueprintIcon } from '../icons/CategoryIcons';
import { ModuleHeader, SectionWrapper, InfoBox, KnowledgeCheck } from './ModuleComponents';

interface ModuleProps {
    onBack: () => void;
}

export const ReEngagementBlueprint: React.FC<ModuleProps> = ({ onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <ModuleHeader
                onBack={onBack}
                title="The Re-engagement (Win-Back) Blueprint"
                subtitle="Learn to create automated campaigns that win back inactive subscribers and know when it's time to safely say goodbye to protect your deliverability."
            />
            
            <SectionWrapper
                title="Why Inactive Subscribers Hurt You"
                subtitle="The Hidden Cost of a 'Large' List"
            >
                <p>Sending emails to people who never open them does more than waste effort—it actively damages your sender reputation. Inbox providers see low engagement as a sign that your emails are unwanted, which can cause them to filter even your engaged subscribers to the spam or promotions folder.</p>
                <p><strong className="text-gray-200">A re-engagement campaign has two primary goals:</strong></p>
                <ul className="list-decimal list-inside space-y-1 mt-2">
                    <li>Reactivate the interest of subscribers who have simply forgotten about you.</li>
                    <li>Safely identify and remove subscribers who are truly no longer interested.</li>
                </ul>
            </SectionWrapper>
            
            <SectionWrapper
                title="The 3-Email Win-Back Framework"
                subtitle="A Gentle Nudge, a Strong Offer, and a Clear Goodbye"
            >
                <p>This automated sequence should be triggered for subscribers who haven't opened or clicked an email in a specific timeframe (e.g., 90 or 120 days).</p>
                <ol className="list-decimal list-inside space-y-3 mt-2">
                    <li>
                        <strong className="text-gray-200">Email 1: The Gentle Nudge (Day 1)</strong>
                        <p className="text-sm pl-4"><strong>Subject Idea:</strong> "Is our content still valuable to you?" <br/> This email should be simple and direct. Remind them of the value you provide and ask if they still want to hear from you. A simple "Yes/No" survey can work well.</p>
                    </li>
                    <li>
                        <strong className="text-gray-200">Email 2: The Compelling Offer (Day 5)</strong>
                        <p className="text-sm pl-4"><strong>Subject Idea:</strong> "A special offer to welcome you back" <br/> For those who didn't respond, make a strong value proposition. This could be your most popular resource, a steep discount, or exclusive access to new content. The goal is to provide a clear reason to re-engage.</p>
                    </li>
                    <li>
                        <strong className="text-gray-200">Email 3: The "Break-Up" Email (Day 14)</strong>
                        <p className="text-sm pl-4"><strong>Subject Idea:</strong> "We're saying goodbye (unless you say otherwise)" <br/> Be transparent. Inform them that to respect their inbox, you'll be removing them from your list unless they click a single link to confirm they want to stay. This is your final attempt and also serves as the clean-up mechanism.</p>
                    </li>
                </ol>
            </SectionWrapper>
            
            <InfoBox icon={<BlueprintIcon />}>
                <div>
                    <h4 className="font-bold text-white">The Golden Rule</h4>
                    <p className="text-purple-200 text-sm">You MUST be willing to remove subscribers who do not respond to this campaign. A smaller, more engaged list will always outperform a larger, inactive one in the long run. List hygiene is the secret of top-tier email marketers.</p>
                </div>
            </InfoBox>

            <KnowledgeCheck
                question="What is the primary purpose of a re-engagement (win-back) campaign?"
                options={[
                    { text: "To sell as much product as possible to your entire list.", isCorrect: false },
                    { text: "To identify and remove unengaged subscribers to improve sender reputation.", isCorrect: true },
                    { text: "To test out new, aggressive subject lines.", isCorrect: false },
                    { text: "To fulfill a legal requirement under GDPR.", isCorrect: false },
                ]}
                explanation="Exactly! While winning back some subscribers is a great outcome, the most critical function of a re-engagement campaign is to safely clean your list, which protects your sender reputation and improves deliverability for your entire audience."
            />
        </div>
    );
};
