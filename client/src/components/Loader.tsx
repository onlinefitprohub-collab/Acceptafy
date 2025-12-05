import { useState, useEffect } from 'react';
import { Mail, Shield, Search, Sparkles, Target, Zap, CheckCircle, TrendingUp, Lightbulb, BookOpen, Award, Brain } from 'lucide-react';

const loaderSteps = [
  { message: "Scanning for spam triggers...", icon: Shield, color: "text-red-400" },
  { message: "Analyzing subject line impact...", icon: Target, color: "text-purple-400" },
  { message: "Evaluating call-to-action clarity...", icon: Zap, color: "text-yellow-400" },
  { message: "Checking personalization elements...", icon: Sparkles, color: "text-pink-400" },
  { message: "Running deliverability simulations...", icon: TrendingUp, color: "text-blue-400" },
  { message: "Reviewing link reputation...", icon: Search, color: "text-cyan-400" },
  { message: "Calculating inbox placement score...", icon: Mail, color: "text-green-400" },
  { message: "Polishing your results...", icon: CheckCircle, color: "text-emerald-400" },
];

const emailFacts = [
  {
    type: 'fact',
    icon: Brain,
    title: "Did you know?",
    content: "The average person receives 121 emails per day. Make yours stand out!",
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30"
  },
  {
    type: 'tip',
    icon: Lightbulb,
    title: "Pro Tip",
    content: "Subject lines with 6-10 words have the highest open rates.",
    color: "from-yellow-500/20 to-orange-500/20",
    borderColor: "border-yellow-500/30"
  },
  {
    type: 'fact',
    icon: Brain,
    title: "Did you know?",
    content: "47% of recipients open emails based on subject line alone.",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30"
  },
  {
    type: 'tip',
    icon: Lightbulb,
    title: "Pro Tip",
    content: "Personalized subject lines boost open rates by 26%.",
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30"
  },
  {
    type: 'fact',
    icon: BookOpen,
    title: "Email History",
    content: "The first email was sent in 1971 by Ray Tomlinson to himself!",
    color: "from-indigo-500/20 to-purple-500/20",
    borderColor: "border-indigo-500/30"
  },
  {
    type: 'tip',
    icon: Award,
    title: "Best Practice",
    content: "Tuesday and Thursday mornings see the highest email engagement.",
    color: "from-pink-500/20 to-rose-500/20",
    borderColor: "border-pink-500/30"
  },
  {
    type: 'fact',
    icon: Brain,
    title: "Did you know?",
    content: "Emails with a single CTA increase clicks by 371%!",
    color: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30"
  },
  {
    type: 'tip',
    icon: Lightbulb,
    title: "Pro Tip",
    content: "Using the recipient's first name in the subject line increases opens.",
    color: "from-amber-500/20 to-yellow-500/20",
    borderColor: "border-amber-500/30"
  },
  {
    type: 'fact',
    icon: BookOpen,
    title: "Fun Fact",
    content: "Over 300 billion emails are sent worldwide every single day!",
    color: "from-rose-500/20 to-pink-500/20",
    borderColor: "border-rose-500/30"
  },
  {
    type: 'tip',
    icon: Award,
    title: "Best Practice",
    content: "Preview text is your second chance to grab attention. Use it wisely!",
    color: "from-teal-500/20 to-green-500/20",
    borderColor: "border-teal-500/30"
  }
];

const encouragingMessages = [
  "Your email is getting the VIP treatment!",
  "Our AI is working its magic...",
  "Almost there! Great emails take time.",
  "Crunching the numbers for you...",
  "Making sure every word counts!",
];

interface LoaderProps {
  messages?: { message: string; icon: React.ComponentType<{ className?: string }>; color: string }[];
}

export const Loader: React.FC<LoaderProps> = ({ messages = loaderSteps }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [encourageIndex, setEncourageIndex] = useState(0);
  const [showFact, setShowFact] = useState(false);

  useEffect(() => {
    setCurrentStep(0);
    setProgress(0);
    setCurrentFact(Math.floor(Math.random() * emailFacts.length));
    setEncourageIndex(Math.floor(Math.random() * encouragingMessages.length));
    
    const timer = setTimeout(() => setShowFact(true), 500);
    
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % messages.length);
    }, 2000);

    const factInterval = setInterval(() => {
      setShowFact(false);
      setTimeout(() => {
        setCurrentFact((prev) => (prev + 1) % emailFacts.length);
        setShowFact(true);
      }, 300);
    }, 4000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 2.5;
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      clearInterval(stepInterval);
      clearInterval(factInterval);
      clearInterval(progressInterval);
    };
  }, [messages.length]);

  const CurrentIcon = messages[currentStep].icon;
  const currentColor = messages[currentStep].color;
  const fact = emailFacts[currentFact];
  const FactIcon = fact.icon;

  return (
    <div className="mt-8 flex flex-col items-center justify-center space-y-8 animate-fade-in px-4" data-testid="loader">
      <div className="relative">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted/30"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.83} 283`}
              className="transition-all duration-300"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl animate-pulse scale-150" />
              <div className={`relative p-4 rounded-full bg-card/90 backdrop-blur-sm border-2 border-border shadow-lg ${currentColor} transition-all duration-500`}>
                <CurrentIcon className="w-8 h-8 animate-bounce" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
          {Math.round(progress)}%
        </div>
      </div>

      <div className="text-center space-y-3 max-w-sm">
        <p className={`text-xl font-semibold ${currentColor} transition-colors duration-300`}>
          {messages[currentStep].message}
        </p>
        
        <div className="flex items-center justify-center gap-1.5">
          {messages.map((_, i) => (
            <div 
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentStep 
                  ? 'w-6 bg-gradient-to-r from-purple-500 to-pink-500' 
                  : i < currentStep 
                    ? 'w-3 bg-purple-500/50' 
                    : 'w-2 bg-muted/50'
              }`}
            />
          ))}
        </div>

        <p className="text-sm text-muted-foreground italic">
          {encouragingMessages[encourageIndex]}
        </p>
      </div>

      <div 
        className={`w-full max-w-md transition-all duration-500 ${showFact ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className={`relative overflow-hidden rounded-xl border ${fact.borderColor} bg-gradient-to-br ${fact.color} p-4`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
              <FactIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">
                {fact.title}
              </p>
              <p className="text-sm text-white font-medium leading-relaxed">
                {fact.content}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
          </div>
          <span className="text-muted-foreground">AI Engine Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" style={{ animationDelay: '0.5s' }} />
          </div>
          <span className="text-muted-foreground">Deep Analysis Mode</span>
        </div>
      </div>

      <div className="flex items-center gap-3 animate-bounce-slow">
        <Mail className="w-4 h-4 text-purple-400" />
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '200ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
        <Sparkles className="w-4 h-4 text-pink-400" />
      </div>
    </div>
  );
};
