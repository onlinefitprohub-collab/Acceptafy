import { ModuleHeader, SectionWrapper, KnowledgeCheck, InfoBox } from './ModuleComponents';
import { BlueprintIcon } from '../icons/CategoryIcons';

export const EcommerceBlueprint: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="The E-commerce Blueprint" subtitle="Master the 'money-making' automations: abandoned carts, post-purchase, and win-back campaigns." />
        
        <SectionWrapper title="The E-commerce Email Stack" subtitle="Essential Automations for Revenue">
            <p>E-commerce businesses can generate 20-30% of total revenue from email alone. These five automations form the foundation of a profitable email program:</p>
            <ol className="list-decimal list-inside space-y-2 mt-2">
                <li>Abandoned Cart Recovery</li>
                <li>Welcome Series</li>
                <li>Post-Purchase Sequence</li>
                <li>Browse Abandonment</li>
                <li>Win-Back Campaign</li>
            </ol>
        </SectionWrapper>

        <SectionWrapper title="Abandoned Cart Recovery" subtitle="The Highest-ROI Automation">
            <p>Abandoned cart emails recover 5-15% of lost sales. The key is timing and sequencing:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Email 1 (1 hour):</strong> Simple reminder with cart contents</li>
                <li><strong>Email 2 (24 hours):</strong> Address objections, add social proof</li>
                <li><strong>Email 3 (48-72 hours):</strong> Create urgency, consider incentive</li>
            </ul>
            <p className="mt-2 text-yellow-400">Pro tip: Don't train customers to wait for discounts. Only offer incentives on the final email, and not to repeat abandoners.</p>
        </SectionWrapper>

        <SectionWrapper title="Post-Purchase Sequence" subtitle="Turn Buyers into Repeat Customers">
            <p>The post-purchase period is when customers are most engaged. Use it wisely:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Order Confirmation:</strong> Set expectations, build excitement</li>
                <li><strong>Shipping Notification:</strong> Keep them informed</li>
                <li><strong>Delivery Follow-Up (3 days later):</strong> Check in, offer support</li>
                <li><strong>Review Request (7-14 days):</strong> Social proof for future buyers</li>
                <li><strong>Cross-Sell (21 days):</strong> Complementary products</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Browse Abandonment" subtitle="Capture Interest Before the Cart">
            <p>Not everyone adds to cart. Browse abandonment targets people who viewed products but didn't add them:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Trigger after 2+ product views without add-to-cart</li>
                <li>Showcase the viewed products</li>
                <li>Include similar products they might like</li>
                <li>Keep it subtle—one email is often enough</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Win-Back Campaigns" subtitle="Re-engage Lapsed Customers">
            <p>It's 5-7x more expensive to acquire a new customer than to retain one. Win-back campaigns target customers who haven't purchased in 60-90+ days:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Acknowledge the absence: "We miss you"</li>
                <li>Remind them why they bought originally</li>
                <li>Offer an exclusive "come back" incentive</li>
                <li>Create urgency with a time-limited offer</li>
            </ul>
        </SectionWrapper>

        <InfoBox icon={<BlueprintIcon />}>
            <p className="text-purple-200 text-sm">Start with abandoned cart recovery—it has the highest ROI and clearest intent signal. Perfect this automation before moving to others.</p>
        </InfoBox>

        <KnowledgeCheck
            question="When should you send the first abandoned cart email?"
            options={[
                { text: "Immediately (within minutes)", isCorrect: false },
                { text: "About 1 hour after abandonment", isCorrect: true },
                { text: "24 hours after abandonment", isCorrect: false }
            ]}
            explanation="The first abandoned cart email should go out about 1 hour after abandonment. This gives the customer time to potentially return on their own, but catches them while the purchase intent is still fresh. Too fast feels pushy; too slow and they've moved on."
        />
    </div>
);
