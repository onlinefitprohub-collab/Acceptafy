import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mail, 
  Zap, 
  ShieldCheck, 
  GraduationCap, 
  CheckCircle2,
  ArrowRight,
  Target,
  BarChart3,
  Users,
  TrendingUp,
  Star,
  Sparkles,
  Play,
  AlertCircle,
  Clock,
  Award
} from "lucide-react";
import { SUBSCRIPTION_LIMITS, PRICING } from "@shared/schema";

const DEMO_GRADES = [
  { label: "Subject Line", score: 72, feedback: "Add urgency or personalization" },
  { label: "Preview Text", score: 45, feedback: "Too generic, misses opportunity" },
  { label: "Body Copy", score: 88, feedback: "Clear CTA, good readability" },
  { label: "Spam Score", score: 94, feedback: "Low risk, clean copy" },
];

const TESTIMONIALS = [
  {
    quote: "We increased our open rates by 23% in the first month. The spam detection alone saved us from a major deliverability issue.",
    author: "Sarah Chen",
    role: "Email Marketing Manager",
    company: "GrowthStack",
    metric: "+23% opens"
  },
  {
    quote: "Finally, a tool that tells me WHY my emails underperform before I hit send. Game changer for our weekly newsletters.",
    author: "Marcus Johnson",
    role: "Content Lead",
    company: "Newsletter Pro",
    metric: "2x CTR"
  },
  {
    quote: "The AI rewrites save me hours every week. I paste in my draft, get suggestions, and ship better emails faster.",
    author: "Emily Rodriguez",
    role: "Founder",
    company: "SoloCraft",
    metric: "5hrs saved/week"
  }
];

function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
}

function LiveDemoPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % DEMO_GRADES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5 overflow-hidden" data-testid="card-demo-preview">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <Badge variant="outline" className="text-xs" data-testid="badge-live-preview">
            <Sparkles className="w-3 h-3 mr-1" />
            Live Preview
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded" data-testid="text-demo-subject">
          Subject: "Don't miss our biggest sale ever!!!"
        </div>
        
        <div className="space-y-2">
          {DEMO_GRADES.map((item, index) => (
            <div 
              key={item.label}
              className={`transition-all duration-300 ${index === activeIndex ? 'scale-[1.02]' : 'opacity-70'}`}
              onMouseEnter={() => { setIsAnimating(false); setActiveIndex(index); }}
              onMouseLeave={() => setIsAnimating(true)}
              data-testid={`demo-grade-${index}`}
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium" data-testid={`text-grade-label-${index}`}>{item.label}</span>
                <span className={`font-bold ${item.score >= 80 ? 'text-green-500' : item.score >= 60 ? 'text-yellow-500' : 'text-orange-500'}`} data-testid={`text-grade-score-${index}`}>
                  {item.score}/100
                </span>
              </div>
              <Progress 
                value={item.score} 
                className={`h-2 ${index === activeIndex ? '[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500' : ''}`}
                data-testid={`progress-grade-${index}`}
              />
              {index === activeIndex && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1" data-testid={`text-grade-feedback-${index}`}>
                  <AlertCircle className="w-3 h-3" />
                  {item.feedback}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="pt-2 border-t flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent" data-testid="text-overall-grade">B+</p>
            <p className="text-xs text-muted-foreground">Overall Grade</p>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500" data-testid="button-demo-improve">
            <Zap className="w-3 h-3 mr-1" />
            Auto-Improve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Landing() {
  const plans = [
    {
      key: "starter",
      name: PRICING.starter.name,
      tagline: PRICING.starter.tagline,
      price: PRICING.starter.monthly,
      limits: SUBSCRIPTION_LIMITS.starter,
      features: [
        `${SUBSCRIPTION_LIMITS.starter.gradesPerMonth} email grades/month`,
        `${SUBSCRIPTION_LIMITS.starter.rewritesPerMonth} AI rewrites`,
        "Spam & deliverability checks",
        "Email Academy access",
        "No credit card required",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      key: "pro",
      name: PRICING.pro.name,
      tagline: PRICING.pro.tagline,
      price: PRICING.pro.monthly,
      limits: SUBSCRIPTION_LIMITS.pro,
      features: [
        `${SUBSCRIPTION_LIMITS.pro.gradesPerMonth} email grades/month`,
        `${SUBSCRIPTION_LIMITS.pro.rewritesPerMonth} AI rewrites`,
        "Advanced spam analysis",
        "Subject line A/B testing",
        `${SUBSCRIPTION_LIMITS.pro.teamSeats} team seats`,
        "Priority support",
      ],
      cta: "Start 14-Day Trial",
      popular: true,
    },
    {
      key: "scale",
      name: PRICING.scale.name,
      tagline: PRICING.scale.tagline,
      price: PRICING.scale.monthly,
      limits: SUBSCRIPTION_LIMITS.scale,
      features: [
        `${SUBSCRIPTION_LIMITS.scale.gradesPerMonth} email grades/month`,
        `${SUBSCRIPTION_LIMITS.scale.rewritesPerMonth} AI rewrites`,
        `${SUBSCRIPTION_LIMITS.scale.teamSeats} team seats`,
        "API access",
        "White-label reports",
        "Dedicated support",
      ],
      cta: "Start 14-Day Trial",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2" data-testid="link-brand-logo">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Acceptafy</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">
              Pricing
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-how-it-works">
              How It Works
            </a>
            <Button variant="ghost" asChild data-testid="button-login">
              <a href="/api/login">Log in</a>
            </Button>
            <Button asChild data-testid="button-get-started-header">
              <a href="/api/login">Get Started Free</a>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative py-12 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Send Emails That{" "}
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Actually Get Opened
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                Stop guessing why your emails underperform. Grade your copy, catch spam triggers, and get AI-powered rewrites—all before you hit send.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm" data-testid="benefit-grading">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Instant email grading</span>
                </div>
                <div className="flex items-center gap-2 text-sm" data-testid="benefit-spam">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Spam detection</span>
                </div>
                <div className="flex items-center gap-2 text-sm" data-testid="benefit-rewrites">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>1-click AI rewrites</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8" asChild data-testid="button-start-free">
                  <a href="/api/login">
                    Grade Your First Email Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-lg" asChild data-testid="button-see-demo">
                  <a href="#how-it-works">
                    <Play className="w-4 h-4 mr-2" />
                    See How It Works
                  </a>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                No credit card required. {SUBSCRIPTION_LIMITS.starter.gradesPerMonth} free grades included.
              </p>
            </div>

            <div className="lg:pl-8">
              <LiveDemoPreview />
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="text-center" data-testid="stat-emails-graded">
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                <AnimatedCounter end={47892} suffix="+" />
              </p>
              <p className="text-sm text-muted-foreground">Emails graded this month</p>
            </div>
            <div className="text-center" data-testid="stat-avg-improvement">
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                +18%
              </p>
              <p className="text-sm text-muted-foreground">Avg. open rate lift</p>
            </div>
            <div className="text-center" data-testid="stat-spam-caught">
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                <AnimatedCounter end={12340} suffix="+" />
              </p>
              <p className="text-sm text-muted-foreground">Spam issues caught</p>
            </div>
            <div className="text-center" data-testid="stat-time-saved">
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                3.2hrs
              </p>
              <p className="text-sm text-muted-foreground">Saved per week avg.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Star className="w-3 h-3 mr-1" />
              Trusted by Email Marketers
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Real Results from Real Marketers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-testimonial-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4" data-testid={`stars-testimonial-${index}`}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-testimonial-quote-${index}`}>"{testimonial.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm" data-testid={`text-testimonial-author-${index}`}>{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-testimonial-role-${index}`}>{testimonial.role}, {testimonial.company}</p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30" data-testid={`badge-testimonial-metric-${index}`}>
                      {testimonial.metric}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Grade, Improve, Send—In Minutes</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps to emails that get more opens, clicks, and replies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { 
                icon: Mail, 
                step: "1", 
                title: "Paste Your Email", 
                description: "Drop in your subject, preview text, and body. Takes 10 seconds.",
                color: "from-purple-500 to-purple-600"
              },
              { 
                icon: BarChart3, 
                step: "2", 
                title: "Get Instant Analysis", 
                description: "AI grades every element: spam triggers, readability, CTA strength, and more.",
                color: "from-pink-500 to-pink-600"
              },
              { 
                icon: Zap, 
                step: "3", 
                title: "Improve & Send", 
                description: "Apply 1-click fixes, use AI rewrites, then ship with confidence.",
                color: "from-purple-500 to-pink-500"
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="text-center" data-testid={`step-${index}`}>
                  <div className="relative inline-flex mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Everything You Need to Write Better Emails</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Target, title: "Email Grading", description: "Detailed scores for subject, preview, body, and CTAs" },
              { icon: ShieldCheck, title: "SPF/DKIM/DMARC Setup", description: "Generate and validate DNS records for email authentication" },
              { icon: Zap, title: "Auto-Improve", description: "1-click AI rewrites that fix issues and boost engagement" },
              { icon: BarChart3, title: "Domain Health Checks", description: "Monitor sender reputation and fix deliverability issues" },
              { icon: AlertCircle, title: "Spam Detection", description: "Catch trigger words and risky phrases before you send" },
              { icon: TrendingUp, title: "BIMI Support", description: "Set up brand logos in email clients for better recognition" },
              { icon: GraduationCap, title: "Email Academy", description: "Learn best practices with our educational resources" },
              { icon: Users, title: "Team Collaboration", description: "Share templates and maintain brand consistency" },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="hover-elevate" data-testid={`feature-${index}`}>
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20" data-testid="card-roi">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <Badge variant="outline" className="mb-4" data-testid="badge-roi">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Return on Investment
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">The Math Makes Sense</h2>
                  <p className="text-muted-foreground">A single successful email campaign pays for months of Acceptafy</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div data-testid="roi-stat-1">
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">$2,400+</p>
                    <p className="text-sm text-muted-foreground mt-1">Avg. value of 1% open rate increase<br/>(10k list × $24 avg. subscriber value)</p>
                  </div>
                  <div data-testid="roi-stat-2">
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">18%</p>
                    <p className="text-sm text-muted-foreground mt-1">Avg. open rate improvement<br/>reported by our users</p>
                  </div>
                  <div data-testid="roi-stat-3">
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">40x</p>
                    <p className="text-sm text-muted-foreground mt-1">Potential ROI on Pro plan<br/>($59/mo vs. $2,400+ value created)</p>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Plus: Avoid spam folders, protect sender reputation, and save 3+ hours per week on email copy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Simple Pricing, No Surprises</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start free, upgrade when you need more. All plans include core grading and spam detection.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.key} 
                className={`relative flex flex-col ${plan.popular ? 'border-purple-500 shadow-xl scale-105' : ''}`}
                data-testid={`pricing-card-${plan.key}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg px-4 py-1">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.tagline}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/mo</span>
                    )}
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    asChild
                    data-testid={`button-subscribe-${plan.key}`}
                  >
                    <a href="/api/login">{plan.cta}</a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground" data-testid="text-overage-pricing">
              Need more? Add extra grades anytime: <span className="font-medium text-foreground">$5 per 100 grades</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Enterprise needs? <a href="mailto:hello@acceptafy.com" className="text-foreground underline" data-testid="link-enterprise-contact">Contact us</a> for custom plans.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16" data-testid="section-final-cta">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20" data-testid="card-final-cta">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4" data-testid="text-final-cta-heading">Ready to Send Better Emails?</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto" data-testid="text-final-cta-description">
                Join thousands of marketers who grade their emails before sending. Start with {SUBSCRIPTION_LIMITS.starter.gradesPerMonth} free grades—no credit card needed.
              </p>
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8" asChild data-testid="button-final-cta">
                <a href="/api/login">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t py-8" data-testid="footer">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-2" data-testid="link-footer-brand">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Acceptafy</span>
            </a>
            <p className="text-sm text-muted-foreground" data-testid="text-footer-tagline">
              Email optimization for marketers who care about results
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
