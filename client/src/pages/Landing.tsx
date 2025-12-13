import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { LoginDialog } from "@/components/LoginDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  Award,
  Inbox,
  MessageSquare,
  FileText,
  History,
  ListChecks,
  Upload,
  FolderOpen,
  DollarSign,
  Info,
  Calculator,
  Link2,
  Send,
  Activity,
  Brain,
  Gift,
  Trophy,
  Flame,
  Palette,
  Timer,
  FlaskConical,
  Layout,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SUBSCRIPTION_LIMITS, PRICING } from "@shared/schema";

const DEMO_GRADES = [
  { label: "Subject Line", score: 72, feedback: "Add urgency or personalization" },
  { label: "Preview Text", score: 45, feedback: "Too generic, misses opportunity" },
  { label: "Body Copy", score: 88, feedback: "Clear CTA, good readability" },
  { label: "Spam Score", score: 94, feedback: "Low risk, clean copy" },
];

const TESTIMONIALS = [
  {
    quote: "Connecting our Klaviyo account was a game-changer. Now we grade emails and see real campaign stats with AI insights—all in one dashboard. Open rates up 27%.",
    author: "Sarah Chen",
    role: "Email Marketing Manager",
    company: "GrowthStack",
    metric: "+27% opens"
  },
  {
    quote: "The ESP stats dashboard gives us AI-powered analysis of our campaigns. We finally understand what's working and why. No more guessing.",
    author: "Marcus Johnson",
    role: "Content Lead",
    company: "Newsletter Pro",
    metric: "2x CTR"
  },
  {
    quote: "Grade, rewrite, send—all through SendGrid without leaving Acceptafy. The workflow saves us 5+ hours a week and our emails perform better.",
    author: "Emily Rodriguez",
    role: "Founder",
    company: "SoloCraft",
    metric: "5hrs saved/week"
  }
];

function ROICalculator() {
  const [listSize, setListSize] = useState(10000);
  const [subscriberValue, setSubscriberValue] = useState(25);
  const [openRateImprovement, setOpenRateImprovement] = useState(5);

  const potentialValue = Math.round(listSize * (openRateImprovement / 100) * subscriberValue);
  const monthlyROI = potentialValue > 0 ? Math.round(potentialValue / 59) : 0;

  return (
    <div className="space-y-6" data-testid="roi-calculator">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Email List Size
          </label>
          <Input
            type="number"
            value={listSize}
            onChange={(e) => setListSize(Math.max(0, parseInt(e.target.value) || 0))}
            className="text-center"
            data-testid="input-list-size"
          />
          <p className="text-xs text-muted-foreground text-center">Total subscribers</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            Subscriber Value
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              value={subscriberValue}
              onChange={(e) => setSubscriberValue(Math.max(0, parseInt(e.target.value) || 0))}
              className="text-center pl-7"
              data-testid="input-subscriber-value"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">Avg. lifetime value per subscriber</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Expected Improvement
          </label>
          <div className="relative">
            <Input
              type="number"
              value={openRateImprovement}
              onChange={(e) => setOpenRateImprovement(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
              className="text-center pr-7"
              data-testid="input-improvement"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">Open rate improvement goal</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">Your Potential Monthly Value</p>
        <p className="text-5xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent" data-testid="text-roi-result">
          ${potentialValue.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          That's <span className="font-bold text-green-600">{monthlyROI}x</span> the cost of the Pro plan ($59/mo)
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-center text-sm">
        <div className="p-4 bg-card rounded-xl border border-border flex flex-col justify-between min-h-[110px] shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Subscribers reached</p>
          <p className="font-bold text-3xl text-foreground">{Math.round(listSize * (openRateImprovement / 100)).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">additional opens</p>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border flex flex-col justify-between min-h-[110px] shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Formula</p>
          <p className="text-lg font-bold text-foreground">{listSize.toLocaleString()} × {openRateImprovement}% × ${subscriberValue}</p>
          <p className="text-xs text-muted-foreground">list × improvement × value</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/20 rounded-xl border-2 border-green-500/30 flex flex-col justify-between min-h-[110px] shadow-lg ring-2 ring-green-500/10">
          <p className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wide font-semibold">Annual potential</p>
          <p className="font-bold text-4xl bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">${(potentialValue * 12).toLocaleString()}</p>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">if maintained monthly</p>
        </div>
      </div>
    </div>
  );
}

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
        "Advanced spam analysis (ISP-specific)",
        "Sender Score Estimator",
        "Domain health & warmup tools",
        "Subject line A/B testing",
        `${SUBSCRIPTION_LIMITS.pro.historyLimit.toLocaleString()} saved analyses`,
      ],
      cta: "Get Pro",
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
        "Advanced spam analysis (ISP-specific)",
        "Sender Score Estimator",
        "Full deliverability suite",
        "Subject line A/B testing",
        "White-label PDF reports",
        `${SUBSCRIPTION_LIMITS.scale.historyLimit.toLocaleString()} saved analyses`,
      ],
      cta: "Get Scale",
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
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground/60 cursor-not-allowed flex items-center gap-1" data-testid="link-affiliate">
                  <Gift className="w-3.5 h-3.5" />
                  Affiliate
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming Soon</p>
              </TooltipContent>
            </Tooltip>
            <LoginDialog>
              <Button variant="ghost" data-testid="button-login">Log in</Button>
            </LoginDialog>
            <LoginDialog>
              <Button data-testid="button-get-started-header">Get Started Free</Button>
            </LoginDialog>
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
              <Badge variant="outline" className="mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30" data-testid="badge-new-feature">
                <Sparkles className="w-3 h-3 mr-1" />
                Trusted by 5,000+ Email Marketers
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Send Emails That{" "}
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Get Opened
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                Stop guessing why your emails underperform. Get instant AI-powered grades, fix issues with one click, and watch your open rates climb. Turn every send into revenue.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm" data-testid="benefit-opens">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>+21% avg. open rate lift</span>
                </div>
                <div className="flex items-center gap-2 text-sm" data-testid="benefit-grading">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Instant AI grading</span>
                </div>
                <div className="flex items-center gap-2 text-sm" data-testid="benefit-rewrites">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>1-click AI rewrites</span>
                </div>
                <div className="flex items-center gap-2 text-sm" data-testid="benefit-spam">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Avoid spam folders</span>
                </div>
                <div className="flex items-center gap-2 text-sm" data-testid="benefit-revenue">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>More clicks, more sales</span>
                </div>
                <div className="flex items-center gap-2 text-sm" data-testid="benefit-time">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Save hours per campaign</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <LoginDialog>
                  <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg" data-testid="button-start-free">
                    <span className="flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Button>
                </LoginDialog>
                <Button size="lg" variant="outline" asChild data-testid="button-see-demo">
                  <a href="#how-it-works" className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    See How It Works
                  </a>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                No credit card required. {SUBSCRIPTION_LIMITS.starter.gradesPerMonth} free grades included.
              </p>

              <div className="mt-8 flex items-center gap-4" data-testid="social-proof-bar">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold"
                      data-testid={`avatar-${i}`}
                    >
                      {['SC', 'MJ', 'ER', 'DP', 'RT'][i-1]}
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                    <span className="text-sm font-semibold ml-1">4.9</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-semibold">Join 5,000+ email marketers</span>
                    <span className="text-muted-foreground"> who improved their open rates</span>
                  </p>
                </div>
              </div>
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
            <div className="text-center" data-testid="stat-esp-connections">
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                12+
              </p>
              <p className="text-sm text-muted-foreground">ESP integrations</p>
            </div>
            <div className="text-center" data-testid="stat-avg-improvement">
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                +21%
              </p>
              <p className="text-sm text-muted-foreground">Avg. open rate lift</p>
            </div>
            <div className="text-center" data-testid="stat-ai-analyses">
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                <AnimatedCounter end={8750} suffix="+" />
              </p>
              <p className="text-sm text-muted-foreground">AI campaign analyses</p>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground" data-testid="disclaimer-results">
            <span className="font-medium">*Results may vary.</span> Individual outcomes depend on email quality, list health, and industry factors.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Star className="w-3 h-3 mr-1" />
              Trusted by Email Marketers
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Real Results from Real Marketers</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">*Individual results vary.</span> These are examples from actual users; your outcomes may differ.
            </p>
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
            <Badge variant="outline" className="mb-4">
              <Inbox className="w-3 h-3 mr-1" />
              Complete Email Toolkit
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Everything You Need to Land in the Inbox & Make More Money</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From copy optimization to technical deliverability—we've got every angle covered so your emails actually reach your subscribers.
            </p>
          </div>

          <div className="space-y-12 max-w-6xl mx-auto">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Inbox className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">Inbox Delivery</h3>
                <span className="text-sm text-muted-foreground">— Make sure your emails actually arrive</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: ShieldCheck, title: "SPF/DKIM/DMARC Generator", description: "Generate perfect DNS records in seconds—no technical expertise needed" },
                  { icon: BarChart3, title: "Domain Health Monitor", description: "Track sender reputation, blacklist status, and fix issues before they hurt you" },
                  { icon: AlertCircle, title: "Spam Trigger Detection", description: "Catch 200+ spam trigger words and risky phrases that get you filtered" },
                  { icon: TrendingUp, title: "BIMI Record Setup", description: "Display your brand logo in email clients for instant recognition and trust" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Card key={index} className="hover-elevate border-green-500/10" data-testid={`feature-inbox-${index}`}>
                      <CardContent className="p-4">
                        <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                          <Icon className="w-4 h-4 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg">Revenue Optimization</h3>
                <span className="text-sm text-muted-foreground">— Write emails that convert</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Target, title: "Email Grading Engine", description: "Get detailed scores across 8 dimensions: subject, preview, body, CTAs, personalization & more" },
                  { icon: Zap, title: "1-Click Auto-Improve", description: "Instantly rewrite your email with AI that fixes every issue we detected" },
                  { icon: MessageSquare, title: "Follow-Up Generator", description: "Create perfectly-timed follow-up sequences that boost reply rates" },
                  { icon: FileText, title: "Email Sequence Builder", description: "Plan multi-email campaigns with AI-suggested timing and content flow" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Card key={index} className="hover-elevate border-purple-500/10" data-testid={`feature-revenue-${index}`}>
                      <CardContent className="p-4">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                          <Icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">Workflow & Learning</h3>
                <span className="text-sm text-muted-foreground">— Work smarter, not harder</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: History, title: "Analysis History", description: "Access all your past grades and rewrites—learn from what works" },
                  { icon: GraduationCap, title: "Email Academy", description: "Master deliverability and copywriting with our expert-curated lessons" },
                  { icon: FolderOpen, title: "Saved Templates", description: "Save your best-performing emails as reusable templates for consistent results" },
                  { icon: Upload, title: ".EML Import", description: "Drag and drop .eml files to instantly analyze emails from any email client" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Card key={index} className="hover-elevate border-blue-500/10" data-testid={`feature-workflow-${index}`}>
                      <CardContent className="p-4">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                          <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="font-semibold text-lg">Competitive Intelligence</h3>
                <span className="text-sm text-muted-foreground">— Learn from the best in your industry</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Users, title: "Competitor Analysis", description: "Paste competitor emails and get side-by-side comparisons with actionable insights" },
                  { icon: Target, title: "Benchmark Scoring", description: "See how your emails stack up against industry leaders and top performers" },
                  { icon: TrendingUp, title: "Gap Analysis", description: "Identify what makes competitor emails work and apply those techniques" },
                  { icon: ListChecks, title: "Best Practice Extraction", description: "Auto-extract winning patterns from competitor emails to improve yours" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Card key={index} className="hover-elevate border-violet-500/10" data-testid={`feature-competitive-${index}`}>
                      <CardContent className="p-4">
                        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3">
                          <Icon className="w-4 h-4 text-violet-600" />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-semibold text-lg">ESP Integrations</h3>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">New</Badge>
                <span className="text-sm text-muted-foreground">— Connect your email service provider</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Link2, title: "12+ ESP Connections", description: "Connect SendGrid, Mailchimp, Klaviyo, HubSpot, ActiveCampaign, ConvertKit, and more" },
                  { icon: Activity, title: "Campaign Stats Dashboard", description: "View opens, clicks, bounces, and engagement metrics from your connected ESPs" },
                  { icon: Brain, title: "AI Stats Analysis", description: "Get AI-powered insights and recommendations based on your real campaign performance" },
                  { icon: Send, title: "Send via ESP", description: "Grade, rewrite, and send emails directly through your ESP—all from one place" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Card key={index} className="hover-elevate border-orange-500/10" data-testid={`feature-esp-${index}`}>
                      <CardContent className="p-4">
                        <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3">
                          <Icon className="w-4 h-4 text-orange-600" />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="font-medium">Supported ESPs:</span>
                <span>SendGrid</span>
                <span className="text-muted-foreground/50">|</span>
                <span>Mailchimp</span>
                <span className="text-muted-foreground/50">|</span>
                <span>Klaviyo</span>
                <span className="text-muted-foreground/50">|</span>
                <span>HubSpot</span>
                <span className="text-muted-foreground/50">|</span>
                <span>ActiveCampaign</span>
                <span className="text-muted-foreground/50">|</span>
                <span>ConvertKit</span>
                <span className="text-muted-foreground/50">|</span>
                <span>Constant Contact</span>
                <span className="text-muted-foreground/50">|</span>
                <span>+5 more</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                </div>
                <h3 className="font-semibold text-lg">Coming Soon</h3>
                <Badge variant="outline" className="bg-teal-500/10 text-teal-600 border-teal-500/30">Beta</Badge>
                <span className="text-sm text-muted-foreground">— Powerful features in development</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                  { icon: Layout, title: "Email Builder", description: "Drag-and-drop visual editor to build beautiful emails without coding", color: "teal" },
                  { icon: Trophy, title: "Gamification", description: "Earn XP, unlock achievements, and track streaks to stay motivated", color: "teal" },
                  { icon: Timer, title: "Send Time Optimizer", description: "AI predicts the best time to send based on your audience behavior", color: "teal" },
                  { icon: Palette, title: "Tone Profiles", description: "Save and apply brand voice profiles to maintain consistency", color: "teal" },
                  { icon: FlaskConical, title: "A/B Subject Lab", description: "Test multiple subject lines with AI predictions before sending", color: "teal" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Card key={index} className="hover-elevate border-teal-500/10 opacity-80" data-testid={`feature-coming-${index}`}>
                      <CardContent className="p-4">
                        <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center mb-3">
                          <Icon className="w-4 h-4 text-teal-600" />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
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
                    <Calculator className="w-3 h-3 mr-1" />
                    ROI Calculator
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Calculate Your Potential ROI</h2>
                  <p className="text-muted-foreground">Enter your numbers to see what better email deliverability could mean for your business</p>
                </div>
                
                <ROICalculator />

                <p className="text-center text-xs text-muted-foreground mt-6" data-testid="disclaimer-roi">
                  <span className="font-medium">*Disclaimer:</span> ROI projections are estimates based on your inputs. Actual results vary based on industry, email strategy, and list quality. Past performance does not guarantee future results.
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
                  <LoginDialog>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                      data-testid={`button-subscribe-${plan.key}`}
                    >
                      {plan.cta}
                    </Button>
                  </LoginDialog>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Enterprise needs? <a href="mailto:hello@acceptafy.com" className="text-foreground underline" data-testid="link-enterprise-contact">Contact us</a> for custom plans.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Award className="w-3 h-3 mr-1" />
              Success Stories
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">More Happy Customers</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              See how email marketers across industries are improving their results with Acceptafy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "The AI campaign analysis changed everything. We connected Mailchimp and got instant insights on what's working. Bounce rates down 40% in weeks.",
                author: "David Park",
                role: "Technical Lead",
                company: "MailFlow Agency",
                metric: "-40% bounces"
              },
              {
                quote: "Being able to see stats from all our ESP campaigns in one dashboard with AI recommendations is incredible. Click rates nearly doubled.",
                author: "Rachel Thompson",
                role: "Growth Marketer",
                company: "ScaleUp.io",
                metric: "1.9x clicks"
              },
              {
                quote: "I connected ActiveCampaign and now grade, rewrite, and send without switching tools. As a solo founder, the time savings are massive.",
                author: "James Liu",
                role: "Indie Maker",
                company: "BuildFast",
                metric: "30min saved/email"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-testimonial-extra-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4" data-testid={`stars-testimonial-extra-${index}`}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-testimonial-extra-quote-${index}`}>"{testimonial.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm" data-testid={`text-testimonial-extra-author-${index}`}>{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-testimonial-extra-role-${index}`}>{testimonial.role}, {testimonial.company}</p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30" data-testid={`badge-testimonial-extra-metric-${index}`}>
                      {testimonial.metric}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30" data-testid="section-faq">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-4">
                <HelpCircle className="w-3 h-3 mr-1" />
                FAQ
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Everything you need to know about Acceptafy</p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="esp" data-testid="faq-esp">
                <AccordionTrigger className="text-left">
                  How does Acceptafy work with my ESP?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Acceptafy connects to your email service provider (ESP) through secure OAuth or API keys. Once connected, you can grade emails, view campaign stats with AI insights, and even send emails directly through your ESP—all from one dashboard. We support 12+ ESPs including SendGrid, Mailchimp, Klaviyo, HubSpot, and more.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="trial" data-testid="faq-trial">
                <AccordionTrigger className="text-left">
                  Can I try it before paying?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Absolutely! Our Starter plan is completely free and includes {SUBSCRIPTION_LIMITS.starter.gradesPerMonth} email grades per month. No credit card required. You can upgrade to Pro or Scale anytime when you need more features or higher limits.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="accuracy" data-testid="faq-accuracy">
                <AccordionTrigger className="text-left">
                  How accurate is the AI grading?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Our AI grading is powered by advanced language models trained on millions of email campaigns. It analyzes subject lines, preview text, body copy, spam triggers, and more. While no AI is perfect, users typically see 15-25% improvements in open rates after implementing our recommendations. We're constantly improving our models based on real-world performance data.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cancel" data-testid="faq-cancel">
                <AccordionTrigger className="text-left">
                  Can I cancel anytime?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! All paid plans are month-to-month with no long-term contracts. You can cancel anytime from your account settings, and you'll continue to have access until the end of your billing period. No cancellation fees, no hassle.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="different" data-testid="faq-different">
                <AccordionTrigger className="text-left">
                  What makes Acceptafy different from other tools?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Unlike standalone email checkers, Acceptafy combines AI-powered grading, 1-click rewrites, ESP integration with real campaign stats, AI analysis of your performance, and educational resources—all in one platform. We don't just tell you what's wrong; we help you fix it and track your improvement over time.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
              <LoginDialog>
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8" data-testid="button-final-cta">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </LoginDialog>
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
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-foreground transition-colors" data-testid="link-footer-terms">Terms of Service</a>
              <a href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-footer-privacy">Privacy Policy</a>
              <a href="/contact" className="hover:text-foreground transition-colors" data-testid="link-footer-contact">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
