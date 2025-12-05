import { LegalIcon } from '../icons/CategoryIcons';
import { ModuleHeader, SectionWrapper, InfoBox, KnowledgeCheck } from './ModuleComponents';

interface ModuleProps {
    onBack: () => void;
}

export const LegalCompliance: React.FC<ModuleProps> = ({ onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in">
             <ModuleHeader
                onBack={onBack}
                title="Legal & Compliance"
                subtitle="Understand the fundamental rules of email marketing to protect your business and respect your subscribers. (Disclaimer: This is for informational purposes and is not legal advice.)"
            />
            
            <SectionWrapper
                title="CAN-SPAM Act"
                subtitle="Core Requirements for Commercial Email in the U.S."
            >
                <p>The CAN-SPAM Act sets the rules for commercial email in the United States. Violations can lead to significant financial penalties.</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong className="text-gray-200">Accurate Header Information:</strong> Your "From," "To," "Reply-To," and routing information must be accurate and identify the person or business who initiated the message.</li>
                    <li><strong className="text-gray-200">Non-Deceptive Subject Lines:</strong> The subject line must accurately reflect the content of the message.</li>
                    <li><strong className="text-gray-200">Identify the Message as an Ad:</strong> You must disclose clearly and conspicuously that your message is an advertisement.</li>
                    <li><strong className="text-gray-200">Include a Physical Address:</strong> Your message must include your valid physical postal address.</li>
                    <li><strong className="text-gray-200">Provide a Clear Opt-Out:</strong> You must provide a clear and conspicuous explanation of how the recipient can opt out of getting email from you in the future. Opt-out requests must be honored promptly (within 10 business days).</li>
                </ul>
            </SectionWrapper>

            <SectionWrapper
                title="GDPR: Consent and Data Rights"
                subtitle="Key Principles for Engaging with EU Citizens"
            >
                <p>The General Data Protection Regulation (GDPR) is a comprehensive data privacy law in the European Union. If you have subscribers in the EU, you must comply with its stricter requirements, which are centered on user consent and data rights.</p>
                 <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong className="text-gray-200">Explicit & Unambiguous Consent:</strong> You must obtain clear, affirmative consent before sending marketing emails. Pre-checked boxes or consent hidden in terms and conditions are not valid.</li>
                    <li><strong className="text-gray-200">Proof of Consent:</strong> You must be able to prove when and how each individual gave you their consent.</li>
                    <li><strong className="text-gray-200">The Right to Erasure:</strong> Individuals have the right to request that all of their personal data be deleted from your systems, and you must comply.</li>
                </ul>
            </SectionWrapper>

            <InfoBox icon={<LegalIcon />}>
                <div>
                    <h4 className="font-bold text-white">The Best Practice Approach</h4>
                    <p className="text-purple-200 text-sm">To ensure compliance globally, it's best to follow the strictest regulations. Always get explicit consent (a double opt-in is a great method), make your unsubscribe process simple and immediate, and be transparent in all your communications.</p>
                </div>
            </InfoBox>

            <KnowledgeCheck
                question="Under CAN-SPAM (U.S. Law), what piece of information must you include in every commercial email?"
                options={[
                    { text: "Your company's phone number.", isCorrect: false },
                    { text: "A link to your full privacy policy.", isCorrect: false },
                    { text: "Your valid physical postal address.", isCorrect: true },
                    { text: "Your business registration ID.", isCorrect: false },
                ]}
                explanation="Correct! Including a valid physical postal address is a key requirement of the CAN-SPAM Act to ensure transparency and proper identification of the sender."
            />
        </div>
    );
};
