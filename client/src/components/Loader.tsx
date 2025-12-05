import { useState, useEffect } from 'react';
import { Mail, Shield, Search, Sparkles, Target, Zap, CheckCircle, TrendingUp } from 'lucide-react';

const loaderSteps = [
  { message: "Scanning for spam triggers...", icon: Shield, color: "text-red-400" },
  { message: "Analyzing subject line impact...", icon: Target, color: "text-purple-400" },
  { message: "Evaluating call-to-action clarity...", icon: Zap, color: "text-yellow-400" },
  { message: "Checking personalization elements...", icon: Sparkles, color: "text-pink-400" },
  { message: "Running A/B simulations...", icon: TrendingUp, color: "text-blue-400" },
  { message: "Reviewing link reputation...", icon: Search, color: "text-cyan-400" },
  { message: "Calculating inbox placement...", icon: Mail, color: "text-green-400" },
  { message: "Polishing your results...", icon: CheckCircle, color: "text-emerald-400" },
];

interface LoaderProps {
  messages?: { message: string; icon: React.ComponentType<{ className?: string }>; color: string }[];
}

export const Loader: React.FC<LoaderProps> = ({ messages = loaderSteps }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setCurrentStep(0);
    setProgress(0);
    
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % messages.length);
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [messages.length]);

  const CurrentIcon = messages[currentStep].icon;
  const currentColor = messages[currentStep].color;

  return (
    <div className="mt-8 flex flex-col items-center justify-center space-y-6 animate-fade-in" data-testid="loader">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 animate-pulse" />
        
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 ring-rotate opacity-30" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute w-3 h-3 rounded-full bg-purple-500 orbit-dot" />
            <div className="absolute w-3 h-3 rounded-full bg-pink-500 orbit-dot" />
            <div className="absolute w-3 h-3 rounded-full bg-blue-500 orbit-dot" />
          </div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`p-3 rounded-full bg-card/80 backdrop-blur-sm border border-border ${currentColor} transition-colors duration-300`}>
            <CurrentIcon className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-2 max-w-xs">
        <p className={`text-lg font-medium ${currentColor} transition-colors duration-300`}>
          {messages[currentStep].message}
        </p>
        
        <div className="flex items-center justify-center gap-2">
          {messages.map((_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentStep 
                  ? 'bg-primary scale-125' 
                  : i < currentStep 
                    ? 'bg-primary/50' 
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="w-64 space-y-2">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Analyzing your email...
        </p>
      </div>

      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>AI Engine Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span>Deep Analysis</span>
        </div>
      </div>
    </div>
  );
};
