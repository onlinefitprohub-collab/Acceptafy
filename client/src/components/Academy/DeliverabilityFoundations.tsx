import { DnsIcon } from '../icons/CategoryIcons';
import { ModuleHeader, SectionWrapper, InfoBox, KnowledgeCheck } from './ModuleComponents';

export const DeliverabilityFoundations: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-8 animate-fade-in">
        <ModuleHeader onBack={onBack} title="Domain Authentication" subtitle="Learn about the essential technical records (SPF, DKIM, DMARC) that prove your identity." />
        <SectionWrapper title="SPF: The Approved Senders List" subtitle="Sender Policy Framework">
            <p>Think of SPF as a public record that lists all the mail servers you've authorized to send email on behalf of your domain. It prevents scammers from sending emails that look like they came from you.</p>
            <p className="mt-2">When an email arrives, the receiving server checks the SPF record to verify that the sending server is on the approved list. If it's not, the email may be marked as suspicious or rejected outright.</p>
        </SectionWrapper>
        <SectionWrapper title="DKIM: The Tamper-Proof Seal" subtitle="DomainKeys Identified Mail">
            <p>DKIM adds a unique, encrypted digital signature to every email you send. This signature verifies that the email's content has not been altered in transit.</p>
            <p className="mt-2">Think of it like a wax seal on a letter. If someone opens and modifies the letter, the seal would be broken, alerting the recipient to potential tampering.</p>
        </SectionWrapper>
        <SectionWrapper title="DMARC: The Enforcement Policy" subtitle="Domain-based Message Authentication">
            <p>DMARC builds on SPF and DKIM. It's a policy you publish that tells receiving mail servers what to do if an email fails the SPF or DKIM checks (e.g., send to spam, block completely, or let it through anyway).</p>
            <p className="mt-2">DMARC also provides reporting, so you can see who is trying to send email as your domain—both legitimate services and potential attackers.</p>
        </SectionWrapper>
        <InfoBox icon={<DnsIcon />}>
            <p className="text-purple-200 text-sm">Use our AI-powered DNS Generator in the main app to create these records instantly for your domain.</p>
        </InfoBox>
        <KnowledgeCheck
            question="Which authentication record acts like a tamper-proof seal, verifying that email content hasn't been altered?"
            options={[
                { text: "SPF (Sender Policy Framework)", isCorrect: false },
                { text: "DKIM (DomainKeys Identified Mail)", isCorrect: true },
                { text: "DMARC (Domain-based Message Authentication)", isCorrect: false }
            ]}
            explanation="Correct! DKIM adds a digital signature to ensure your email content hasn't been altered in transit. It's like a wax seal on a letter."
        />
    </div>
);
