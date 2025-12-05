import { BlueprintIcon } from '../icons/CategoryIcons';
import { ModuleHeader, SectionWrapper, InfoBox, KnowledgeCheck } from './ModuleComponents';

interface ModuleProps {
    onBack: () => void;
}

export const EcommerceBlueprint: React.FC<ModuleProps> = ({ onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <ModuleHeader
                onBack={onBack}
                title="The E-commerce Blueprint"
                subtitle="Master the three most profitable automated email sequences that every e-commerce business needs to drive revenue on autopilot."
            />
            
            <SectionWrapper
                title="Automation #1: The Abandoned Cart Sequence"
                subtitle="Recovering Lost Sales"
            >
                <p>Nearly 70% of online shopping carts are abandoned. An automated email sequence is your most powerful tool to bring these high-intent customers back to complete their purchase.</p>
                <p><strong className="text-gray-200">A Simple 3-Part Abandoned Cart Flow:</strong></p>
                 <ul className="list-decimal list-inside space-y-1 mt-2">
                    <li><strong>Email 1 (Sent after 1-2 hours):</strong> A gentle reminder. "Did you forget something?" Show them the item they left behind and provide a clear link back to their cart.</li>
                    <li><strong>Email 2 (Sent after 24 hours):</strong> Address common concerns. Use social proof like testimonials or answer frequently asked questions about shipping or returns.</li>
                    <li><strong>Email 3 (Sent after 48-72 hours):</strong> Create urgency with an incentive. A small discount (e.g., 10% off) or free shipping can be the final push needed to convert.</li>
                </ul>
            </SectionWrapper>

            <SectionWrapper
                title="Automation #2: The Post-Purchase Follow-Up"
                subtitle="Turning Buyers Into Repeat Customers"
            >
                <p>The moment after a purchase is when a customer is most engaged with your brand. Use this opportunity to build a relationship, not just send a receipt.</p>
                <p><strong className="text-gray-200">Post-Purchase Ideas:</strong></p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong>Education:</strong> Send an email showing them how to get the most out of their new product with tips or a video tutorial.</li>
                    <li><strong>Cross-Sell:</strong> A week later, suggest a related product that complements their original purchase.</li>
                    <li><strong>Request a Review:</strong> After they've had time to use the product, ask for a review to build social proof for future customers.</li>
                </ul>
            </SectionWrapper>
            
            <SectionWrapper
                title="Automation #3: The Customer Win-Back Campaign"
                subtitle="Re-engaging Lapsed Customers"
            >
                <p>It's far cheaper to retain an existing customer than to acquire a new one. A win-back campaign automatically targets customers who haven't purchased in a while to encourage their return.</p>
                <p><strong className="text-gray-200">Example Win-Back Flow (for customers inactive for 90 days):</strong></p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                     <li><strong>Email 1: The "We Miss You" Email.</strong> A friendly check-in, perhaps highlighting what's new since their last visit.</li>
                     <li><strong>Email 2: The Exclusive Offer.</strong> A compelling, time-sensitive discount that's better than what you offer the general public, making them feel valued.</li>
                </ul>
            </SectionWrapper>
            
            <InfoBox icon={<BlueprintIcon />}>
                <div>
                    <h4 className="font-bold text-white">Craft the Perfect Automation Email</h4>
                    <p className="text-purple-200 text-sm">When writing the copy for these critical automations, use the <strong className="font-semibold">Email Grader</strong> to ensure every message is optimized for high deliverability and conversion.</p>
                </div>
            </InfoBox>

             <KnowledgeCheck
                question="Which automated campaign is typically the most profitable for an e-commerce store?"
                options={[
                    { text: "The monthly newsletter.", isCorrect: false },
                    { text: "The abandoned cart sequence.", isCorrect: true },
                    { text: "The blog update notification.", isCorrect: false },
                    { text: "The 'Happy Birthday' email.", isCorrect: false },
                ]}
                explanation="Correct! Abandoned cart emails target customers who have already shown high purchase intent, making them the lowest-hanging fruit and the most profitable automation to set up."
            />
        </div>
    );
};
