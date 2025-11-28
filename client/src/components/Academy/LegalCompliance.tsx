import { ModuleHeader, SectionWrapper, KnowledgeCheck, InfoBox } from './ModuleComponents';
import { LegalIcon } from '../icons/CategoryIcons';

export const LegalCompliance: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="Legal Compliance" subtitle="Master the rules of CAN-SPAM and GDPR to protect your business and reputation." />
        
        <SectionWrapper title="CAN-SPAM Act (United States)" subtitle="The Basics of US Email Law">
            <p>The CAN-SPAM Act sets rules for commercial email in the United States. Violations can result in penalties up to $46,517 per email.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Don't use false or misleading header information</strong></li>
                <li><strong>Don't use deceptive subject lines</strong></li>
                <li><strong>Identify the message as an ad</strong> (if applicable)</li>
                <li><strong>Include your physical postal address</strong></li>
                <li><strong>Tell recipients how to opt out</strong></li>
                <li><strong>Honor opt-out requests within 10 business days</strong></li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="GDPR (European Union)" subtitle="Stricter Standards for Privacy">
            <p>GDPR applies if you have any subscribers in the EU. It's more stringent than CAN-SPAM and focuses on consent and data rights.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Explicit Consent:</strong> You must have clear, affirmative consent to email</li>
                <li><strong>Purpose Limitation:</strong> Only use data for stated purposes</li>
                <li><strong>Right to Access:</strong> Subscribers can request their data</li>
                <li><strong>Right to Erasure:</strong> The "right to be forgotten"</li>
                <li><strong>Data Portability:</strong> Subscribers can take their data elsewhere</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="Best Practices for Compliance" subtitle="Staying Safe">
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Use double opt-in:</strong> Confirms intent and protects against spam complaints</li>
                <li><strong>Keep consent records:</strong> Document when and how people subscribed</li>
                <li><strong>Make unsubscribing easy:</strong> One-click if possible</li>
                <li><strong>Segment by region:</strong> Apply GDPR rules to EU subscribers</li>
                <li><strong>Regular list cleaning:</strong> Remove bounces and unengaged subscribers</li>
            </ul>
        </SectionWrapper>

        <SectionWrapper title="CASL (Canada)" subtitle="Canadian Anti-Spam Legislation">
            <p>CASL is one of the strictest email laws in the world. If you email Canadians, you need:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Express or implied consent before sending</li>
                <li>Clear identification of who is sending the email</li>
                <li>A valid mailing address and contact information</li>
                <li>A working unsubscribe mechanism</li>
            </ul>
        </SectionWrapper>

        <InfoBox icon={<LegalIcon />}>
            <p className="text-purple-200 text-sm">When in doubt, apply the strictest standard (usually GDPR) to all your subscribers. It's easier to maintain one high standard than different rules for different regions.</p>
        </InfoBox>

        <KnowledgeCheck
            question="Which regulation requires explicit, affirmative consent before sending marketing emails?"
            options={[
                { text: "CAN-SPAM (US)", isCorrect: false },
                { text: "GDPR (EU)", isCorrect: true },
                { text: "Both require explicit consent", isCorrect: false }
            ]}
            explanation="GDPR requires explicit, affirmative consent (opt-in) before sending marketing emails. CAN-SPAM technically allows an opt-out model where you can email until someone unsubscribes. However, best practice is to always use opt-in regardless of region."
        />
    </div>
);
