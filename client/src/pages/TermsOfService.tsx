import { Link } from "wouter";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function TermsOfService() {
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
            <h1 className="text-3xl font-bold mb-2" data-testid="text-terms-heading">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using Acceptafy ("the Service"), operated by Acceptafy ("we," "us," or "our"), 
                  located at Whiterock Place, Brighton, BN42 4AG, United Kingdom, you agree to be bound by these 
                  Terms of Service. If you do not agree to these terms, please do not use our Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Acceptafy provides email marketing optimization tools including AI-powered email grading, 
                  deliverability analysis, spam detection, and educational resources. Our Service helps users 
                  improve their email campaigns through analysis and recommendations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  To access certain features, you must create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Subscription and Payments</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We offer free and paid subscription tiers. For paid subscriptions:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Payments are processed securely through Stripe</li>
                  <li>Subscriptions renew automatically unless cancelled</li>
                  <li>You may cancel at any time; access continues until the end of the billing period</li>
                  <li>Refunds are provided at our discretion for unused portions of service</li>
                  <li>Usage limits reset at the start of each billing cycle and do not roll over</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Acceptable Use</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Send spam, phishing emails, or malicious content</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon intellectual property rights</li>
                  <li>Attempt to reverse engineer or exploit the Service</li>
                  <li>Share account access with unauthorized users</li>
                  <li>Use the Service for any illegal or harmful purpose</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Service, including its content, features, and functionality, is owned by Acceptafy and 
                  protected by copyright, trademark, and other intellectual property laws. You retain ownership 
                  of content you submit but grant us a license to process it for providing the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. AI-Generated Content</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our Service uses artificial intelligence to provide email analysis, suggestions, and rewrites. 
                  While we strive for accuracy, AI-generated content is provided "as is" and should be reviewed 
                  before use. We do not guarantee specific results from using our recommendations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by law, Acceptafy shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, including loss of profits, data, 
                  or business opportunities arising from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Service is provided "as is" without warranties of any kind, either express or implied. 
                  We do not guarantee that the Service will be uninterrupted, secure, or error-free.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may suspend or terminate your access to the Service at any time for violations of these 
                  Terms or for any other reason at our discretion. Upon termination, your right to use the 
                  Service will immediately cease.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of significant 
                  changes via email or through the Service. Continued use after changes constitutes acceptance 
                  of the new Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms are governed by the laws of England and Wales. Any disputes shall be resolved 
                  in the courts of England and Wales, without prejudice to your rights under applicable 
                  consumer protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">13. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms, please contact us at:
                </p>
                <div className="mt-3 p-4 bg-muted/50 rounded-lg">
                  <p className="text-foreground font-medium">Acceptafy</p>
                  <p className="text-muted-foreground">Whiterock Place, Brighton, BN42 4AG</p>
                  <p className="text-muted-foreground">United Kingdom</p>
                  <p className="text-muted-foreground mt-2">
                    Email: <a href="mailto:hello@acceptafy.com" className="text-purple-500 hover:underline">hello@acceptafy.com</a>
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
