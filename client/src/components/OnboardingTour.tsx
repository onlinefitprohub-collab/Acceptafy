import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  Zap, 
  ShieldCheck, 
  GraduationCap, 
  ChevronRight, 
  X,
  Sparkles,
  Target,
  Trophy
} from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Acceptafy!',
    description: 'Your AI-powered email marketing companion. Let me show you around in 4 quick steps.',
    icon: Sparkles,
    gradient: 'from-purple-500 to-pink-500',
    tip: 'This will only take a minute!'
  },
  {
    id: 'grader',
    title: 'Grade Your Emails',
    description: 'Paste any email and get an instant score with detailed feedback on what to improve.',
    icon: Mail,
    gradient: 'from-purple-500 to-pink-500',
    tip: 'Start here to analyze your first email'
  },
  {
    id: 'tools',
    title: 'AI-Powered Tools',
    description: 'Use AI Rewrite to improve your emails, generate follow-ups, and A/B test subject lines.',
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
    tip: 'The AI can transform your emails in seconds'
  },
  {
    id: 'deliverability',
    title: 'Deliverability Suite',
    description: 'Check your domain health, generate DNS records, and ensure your emails land in the inbox.',
    icon: ShieldCheck,
    gradient: 'from-green-500 to-emerald-500',
    tip: 'Essential for maintaining sender reputation'
  },
  {
    id: 'academy',
    title: 'Learn & Earn XP',
    description: 'Level up your skills with our Academy. Earn XP, unlock achievements, and maintain your streak!',
    icon: GraduationCap,
    gradient: 'from-yellow-500 to-orange-500',
    tip: 'Complete lessons to become an email master'
  }
];

const STORAGE_KEY = 'acceptafy_onboarding_complete';

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const Icon = step.icon;
  
  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };
  
  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    setTimeout(onSkip, 300);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className={`w-full max-w-md mx-4 relative overflow-hidden transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-10`} />
        
        <CardContent className="relative p-8">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-muted-foreground"
            onClick={handleSkip}
            data-testid="onboarding-skip"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="mb-6">
            <Progress value={progress} className="h-1" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </p>
          </div>
          
          <div className="text-center mb-6">
            <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-4 animate-scale-in`}>
              <Icon className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
            <p className="text-muted-foreground">{step.description}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50 mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm text-foreground">{step.tip}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`flex-1 bg-gradient-to-r ${step.gradient} hover:opacity-90`}
              data-testid="onboarding-next"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? (
                <>
                  Get Started
                  <Trophy className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);
  
  return {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding: () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      setShowOnboarding(false);
    },
    resetOnboarding: () => {
      localStorage.removeItem(STORAGE_KEY);
      setShowOnboarding(true);
    }
  };
}
