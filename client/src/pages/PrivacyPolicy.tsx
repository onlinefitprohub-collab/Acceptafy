import { Link } from "wouter";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicy() {
  const lastUpdated = "December 6, 2024";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Acceptafy</span>
          </Link>
          <Button variant="ghost" asChild data-testid="button-back">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardContent className="p-8 md:p-12">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-privacy-heading">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Acceptafy ("we," "us," or "our"), located at Whiterock Place, Brighton, BN42 4AG, United Kingdom, 
                  is committed to protecting your privacy. This Privacy Policy explains how we collect, use, 
                  disclose, and safeguard your information when you use our email optimization service. 
                  We comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Data Controller</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Acceptafy is the data controller responsible for your personal data. For any privacy-related 
                  inquiries, please contact us at{" "}
                  <a href="mailto:privacy@acceptafy.com" className="text-purple-500 hover:underline">privacy@acceptafy.com</a>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We collect the following types of information:
                </p>
                
                <h3 className="text-lg font-medium mb-2 mt-4">3.1 Information You Provide</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Account Information:</strong> Name, email address, and profile picture when you create an account</li>
                  <li><strong>Email Content:</strong> Subject lines, preview text, and email body content you submit for analysis</li>
                  <li><strong>Payment Information:</strong> Processed securely by Stripe; we do not store your full payment card details</li>
                  <li><strong>Communications:</strong> Messages you send to us via contact forms or email</li>
                </ul>

                <h3 className="text-lg font-medium mb-2 mt-4">3.2 Automatically Collected Information</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Usage Data:</strong> Pages visited, features used, and actions taken within the Service</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
                  <li><strong>Cookies:</strong> Session cookies for authentication and functionality (see Section 8)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Legal Basis for Processing</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Under UK GDPR, we process your data based on the following legal grounds:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Contract:</strong> To provide the Service you have requested</li>
                  <li><strong>Legitimate Interests:</strong> To improve our Service and communicate with you</li>
                  <li><strong>Consent:</strong> For marketing communications (where applicable)</li>
                  <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We use your information to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide, maintain, and improve our email optimization Service</li>
                  <li>Process your email content through our AI analysis tools</li>
                  <li>Process payments and manage your subscription</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Send important service-related notifications</li>
                  <li>Analyze usage patterns to improve user experience</li>
                  <li>Detect and prevent fraud or abuse</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Data Sharing and Disclosure</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We may share your information with:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Service Providers:</strong> Including Stripe (payments), cloud hosting providers, and Google (AI processing via Gemini)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  We do not sell your personal data to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. International Data Transfers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your data may be transferred to and processed in countries outside the UK, including the United States, 
                  where our service providers are located. We ensure appropriate safeguards are in place, including 
                  Standard Contractual Clauses approved by the UK Information Commissioner's Office (ICO), to protect 
                  your data in accordance with UK GDPR requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Cookies and Tracking</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We use the following types of cookies:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Essential Cookies:</strong> Required for authentication and basic functionality</li>
                  <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how you use our Service (with your consent)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  You can manage cookie preferences through our cookie consent banner or your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain your personal data only for as long as necessary to fulfill the purposes for which 
                  it was collected. Account data is retained while your account is active. Email content submitted 
                  for analysis is processed in real-time and not permanently stored beyond what is necessary for 
                  providing the Service. Payment records are retained as required by law (typically 7 years for tax purposes).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Your Rights Under UK GDPR</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You have the following rights regarding your personal data:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                  <li><strong>Right to Restriction:</strong> Request limitation of processing</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  To exercise these rights, contact us at{" "}
                  <a href="mailto:privacy@acceptafy.com" className="text-purple-500 hover:underline">privacy@acceptafy.com</a>. 
                  We will respond within 30 days.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal data, 
                  including encryption in transit (HTTPS), secure authentication, and regular security assessments. 
                  However, no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our Service is not intended for children under 16 years of age. We do not knowingly collect 
                  personal data from children. If you believe we have collected data from a child, please 
                  contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">13. Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of significant changes 
                  via email or through the Service. The "Last updated" date at the top indicates when changes were made.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">14. Complaints</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have concerns about how we handle your data, please contact us first. You also have the 
                  right to lodge a complaint with the UK Information Commissioner's Office (ICO) at{" "}
                  <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">ico.org.uk</a>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">15. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For privacy-related inquiries or to exercise your rights:
                </p>
                <div className="mt-3 p-4 bg-muted/50 rounded-lg">
                  <p className="text-foreground font-medium">Acceptafy - Data Protection</p>
                  <p className="text-muted-foreground">Whiterock Place, Brighton, BN42 4AG</p>
                  <p className="text-muted-foreground">United Kingdom</p>
                  <p className="text-muted-foreground mt-2">
                    Privacy Email: <a href="mailto:privacy@acceptafy.com" className="text-purple-500 hover:underline">privacy@acceptafy.com</a>
                  </p>
                  <p className="text-muted-foreground">
                    General Email: <a href="mailto:hello@acceptafy.com" className="text-purple-500 hover:underline">hello@acceptafy.com</a>
                  </p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Acceptafy</span>
            </a>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="/contact" className="hover:text-foreground transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
