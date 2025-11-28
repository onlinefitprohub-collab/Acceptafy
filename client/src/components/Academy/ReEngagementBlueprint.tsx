import { ModuleHeader, SectionWrapper, KnowledgeCheck, InfoBox } from './ModuleComponents';
import { BlueprintIcon } from '../icons/CategoryIcons';

export const ReEngagementBlueprint: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="The Re-engagement Blueprint" subtitle="Create campaigns to win back inactive subscribers and safely clean your list to protect deliverability." />
        
        <SectionWrapper title="Why Re-engagement Matters" subtitle="The Hidden Cost of Inactive Subscribers">
            <p>Inactive subscribers aren't just dead weight—they actively hurt your deliverability. Inbox providers notice when you email people who don't engage, and they use that signal to decide where your emails land.</p>
            <p className="mt-2">A smaller, engaged list will outperform a large, unengaged one every time. Re-engagement campaigns help you identify who's still interested—and who needs to go.</p>
        </SectionWrapper>

        <SectionWrapper title="Defining 'Inactive'" subtitle="When to Trigger Re-engagement">
            <p>The definition of inactive varies by your email frequency:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Daily/Weekly senders:</strong> No opens in 30-60 days</li>
                <li><strong>Bi-weekly senders:</strong> No opens in 60-90 days</li>
                <li><strong>Monthly senders:</strong> No opens in 90-120 days</li>
            </ul>
            <p className="mt-2 text-yellow-400">Note: With Apple's Mail Privacy Protection, opens alone may not be reliable. Factor in clicks, website visits, and purchases when possible.</p>
        </SectionWrapper>

        <SectionWrapper title="The Re-engagement Sequence" subtitle="A Proven 3-Email Approach">
            <div className="space-y-4">
                <div>
                    <h5 className="font-semibold text-purple-300">Email 1: The Check-In</h5>
                    <p className="text-sm mt-1">Purpose: Reconnect with value, not desperation</p>
                    <ul className="list-disc list-inside text-sm mt-1">
                        <li>Acknowledge time has passed</li>
                        <li>Offer your best content or a special perk</li>
                        <li>Make it easy to update preferences</li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-semibold text-purple-300">Email 2: The Direct Ask (5-7 days later)</h5>
                    <p className="text-sm mt-1">Purpose: Get an explicit signal of interest</p>
                    <ul className="list-disc list-inside text-sm mt-1">
                        <li>Ask directly: "Do you still want to hear from us?"</li>
                        <li>Provide one-click "Yes, keep me subscribed" option</li>
                        <li>Make the choice clear and easy</li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-semibold text-purple-300">Email 3: The Last Chance (5-7 days later)</h5>
                    <p className="text-sm mt-1">Purpose: Final opportunity before removal</p>
                    <ul className="list-disc list-inside text-sm mt-1">
                        <li>Clear subject: "We're removing you from our list"</li>
                        <li>One last chance to click and stay</li>
                        <li>Explain what they'll miss</li>
                    </ul>
                </div>
            </div>
        </SectionWrapper>

        <SectionWrapper title="After the Sequence" subtitle="Making the Tough Decisions">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Engaged (clicked any re-engagement email):</strong> Move back to regular list</li>
                <li><strong>No engagement:</strong> Remove from active sending</li>
                <li><strong>Consider a final "sunset" segment:</strong> Very occasional emails for 30 more days</li>
                <li><strong>Suppress, don't delete:</strong> Keep records for compliance, just don't email</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Prevention: Keeping Subscribers Engaged" subtitle="Stop Inactivity Before It Starts">
            <ul className="list-disc list-inside space-y-2">
                <li>Set expectations clearly in your welcome sequence</li>
                <li>Maintain consistent sending frequency</li>
                <li>Allow preference management (frequency, topics)</li>
                <li>Monitor engagement trends and intervene early</li>
                <li>Regularly provide value, not just promotions</li>
            </ul>
        </SectionWrapper>

        <InfoBox icon={<BlueprintIcon />}>
            <p className="text-purple-200 text-sm">Run re-engagement campaigns quarterly. It's better to maintain a smaller, healthy list than to carry dead weight that damages your sender reputation.</p>
        </InfoBox>

        <KnowledgeCheck
            question="What should you do with subscribers who don't respond to your re-engagement sequence?"
            options={[
                { text: "Keep emailing them—they might engage eventually", isCorrect: false },
                { text: "Remove them from active sending (suppress, don't delete)", isCorrect: true },
                { text: "Send them more frequently to increase chances of engagement", isCorrect: false }
            ]}
            explanation="Subscribers who don't respond to re-engagement should be removed from active sending. Continuing to email unengaged subscribers hurts your sender reputation and deliverability. Suppress them (keep records for compliance) but stop sending—your engaged subscribers will benefit from better inbox placement."
        />
    </div>
);
