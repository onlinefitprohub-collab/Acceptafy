import { AutomationIcon } from '../icons/CategoryIcons';
import { ModuleHeader, SectionWrapper, InfoBox, KnowledgeCheck } from './ModuleComponents';

interface ModuleProps {
    onBack: () => void;
}

export const AdvancedAutomation: React.FC<ModuleProps> = ({ onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <ModuleHeader
                onBack={onBack}
                title="Advanced Automation & Dynamic Content"
                subtitle="Go beyond basic sequences. Learn to use behavioral triggers and dynamic content to create 1:1 email experiences at scale."
            />
            
            <SectionWrapper
                title="Behavioral Triggers: Emails That React to Your Users"
                subtitle="Sending the Right Message at the Perfect Moment"
            >
                <p>Behavioral triggers allow you to launch automated email campaigns based on specific actions a user takes (or doesn't take) on your website or in your app. This makes your communication incredibly timely and relevant.</p>
                <p><strong className="text-gray-200">Powerful Examples of Behavioral Triggers:</strong></p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong className="text-gray-200">Cart Abandonment:</strong> The most famous example. A user adds an item to their cart but doesn't complete the purchase.</li>
                    <li><strong className="text-gray-200">Page Visit Trigger:</strong> A user visits your pricing page multiple times in a week but doesn't sign up. Trigger an email from a "sales consultant" offering to answer any questions.</li>
                    <li><strong className="text-gray-200">In-App Behavior:</strong> A user has used Feature X but hasn't tried the related Feature Y. Trigger an email explaining the benefits of Feature Y and how to use it.</li>
                </ul>
            </SectionWrapper>

            <SectionWrapper
                title="Dynamic Content: The 1:1 Email at Scale"
                subtitle="Making Each Email Unique to the Recipient"
            >
                <p>Dynamic content allows you to change specific parts of your email content based on the data you have about each subscriber. Instead of creating dozens of separate emails for each segment, you create one email with dynamic blocks.</p>
                <p><strong className="text-gray-200">How It Works in Practice:</strong></p>
                <p>Imagine an e-commerce store sending a weekly newsletter. Using dynamic content, they can show:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>A block of "Recommended Products" based on the recipient's past purchase history.</li>
                    <li>A special banner for users who are part of their VIP loyalty program.</li>
                    <li>Different hero images based on the recipient's geographic location (e.g., showing winter coats to users in Canada and swimsuits to users in Australia).</li>
                </ul>
                 <p>This ensures that even a mass broadcast email feels highly personalized and relevant to each individual, dramatically boosting engagement and conversion rates.</p>
            </SectionWrapper>
            
            <InfoBox icon={<AutomationIcon />}>
                <div>
                    <h4 className="font-bold text-white">Start with a Goal</h4>
                    <p className="text-purple-200 text-sm">Advanced automation can seem complex. The best way to start is to identify one key action you want more users to take, and then build a simple, triggered email campaign around encouraging that single action.</p>
                </div>
            </InfoBox>

            <KnowledgeCheck
                question="A user has visited your pricing page three times but hasn't signed up. What is this an example of?"
                options={[
                    { text: "A standard welcome email trigger.", isCorrect: false },
                    { text: "Dynamic content.", isCorrect: false },
                    { text: "A behavioral trigger.", isCorrect: true },
                    { text: "List segmentation.", isCorrect: false },
                ]}
                explanation="This is a classic behavioral trigger. The user's specific action (visiting the pricing page) triggers a targeted, automated response designed to address their high-intent behavior."
            />
        </div>
    );
};
