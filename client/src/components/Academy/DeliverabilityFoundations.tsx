import { DnsIcon } from '../icons/CategoryIcons';
import { ModuleHeader, SectionWrapper, InfoBox, KnowledgeCheck } from './ModuleComponents';

interface ModuleProps {
    onBack: () => void;
}

export const DeliverabilityFoundations: React.FC<ModuleProps> = ({ onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <ModuleHeader
                onBack={onBack}
                title="Domain Authentication"
                subtitle="Learn about the essential technical records (SPF, DKIM, DMARC) that prove your identity and are critical for staying out of the spam folder."
            />
            
            <SectionWrapper
                title="SPF: The Approved Senders List"
                subtitle="Sender Policy Framework"
            >
                <p>Think of SPF as a public record that lists all the mail servers you've authorized to send email on behalf of your domain. When an email arrives, the recipient's mail server checks this list.</p>
                <p>If the server that sent the email isn't on your SPF list, it's a major red flag for spam filters, suggesting the email might be a forgery (a practice known as 'spoofing').</p>
                <p><strong className="text-foreground">Primary Goal:</strong> Prevent scammers from sending emails that look like they came from you, thereby protecting your domain's reputation.</p>
            </SectionWrapper>

            <SectionWrapper
                title="DKIM: The Tamper-Proof Seal"
                subtitle="DomainKeys Identified Mail"
            >
                <p>DKIM adds a unique, encrypted digital signature to every email you send. This signature is tied to your domain and is used to verify that the email's content has not been altered in transit.</p>
                <p>If an email is modified after it's sent (e.g., by a malicious actor), the DKIM signature will no longer match, telling the recipient's server not to trust the message.</p>
                <p><strong className="text-foreground">Primary Goal:</strong> Ensure the integrity of your email, proving that the message received is the exact message you sent.</p>
            </SectionWrapper>
            
            <SectionWrapper
                title="DMARC: The Enforcement Policy"
                subtitle="Domain-based Message Authentication, Reporting, and Conformance"
            >
                <p>DMARC builds on SPF and DKIM. It's a policy you publish that tells receiving mail servers what to do if an email claiming to be from you fails the SPF or DKIM checks.</p>
                <p>You can instruct them to do nothing (`p=none`), send the email to spam (`p=quarantine`), or block it completely (`p=reject`). DMARC also enables reporting, so you can see who is sending email from your domain.</p>
                <p><strong className="text-foreground">Primary Goal:</strong> Enforce your authentication rules, gain visibility into your email traffic, and protect your brand from fraudulent use.</p>
            </SectionWrapper>
            
            <InfoBox icon={<DnsIcon />}>
                <div>
                    <h4 className="font-bold text-white">Ready to set this up?</h4>
                    <p className="text-purple-200 text-sm">Use our AI-powered DNS Generator in the <strong className="font-semibold">Deliverability Toolkit</strong> on the main page to create these records for your domain instantly.</p>
                </div>
            </InfoBox>

            <KnowledgeCheck
                question="Which authentication record acts like a tamper-proof seal to verify an email's content hasn't been altered?"
                options={[
                    { text: "SPF", isCorrect: false },
                    { text: "DKIM", isCorrect: true },
                    { text: "DMARC", isCorrect: false },
                    { text: "DNS", isCorrect: false },
                ]}
                explanation="DKIM adds a digital signature to ensure your email content hasn't been altered, protecting its integrity from sender to receiver."
            />
        </div>
    );
};
