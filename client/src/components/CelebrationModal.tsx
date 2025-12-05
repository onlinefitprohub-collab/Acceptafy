import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Star, 
  Flame, 
  Zap, 
  Target, 
  Shield, 
  Sparkles, 
  Mail,
  PartyPopper,
  X
} from 'lucide-react';

interface CelebrationModalProps {
  type: 'level_up' | 'achievement' | 'streak' | 'perfect_score';
  data: {
    level?: number;
    achievementTitle?: string;
    achievementDescription?: string;
    achievementIcon?: string;
    streak?: number;
    score?: number;
  };
  onClose: () => void;
}

const iconMap: Record<string, typeof Trophy> = {
  target: Target,
  star: Star,
  trophy: Trophy,
  shield: Shield,
  sparkles: Sparkles,
  flame: Flame,
  zap: Zap,
  mail: Mail,
};

function Confetti() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    delay: number;
    color: string;
    duration: number;
  }>>([]);

  useEffect(() => {
    const colors = ['#9333ea', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 1 + Math.random() * 2,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export function CelebrationModal({ type, data, onClose }: CelebrationModalProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(handleClose, 5000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  const getContent = () => {
    switch (type) {
      case 'level_up':
        return {
          icon: Star,
          gradient: 'from-purple-500 to-pink-500',
          title: `Level ${data.level}!`,
          subtitle: 'Congratulations!',
          description: 'Keep going to unlock more achievements and become an email master!',
        };
      case 'achievement':
        const AchievementIcon = iconMap[data.achievementIcon || 'trophy'] || Trophy;
        return {
          icon: AchievementIcon,
          gradient: 'from-yellow-500 to-orange-500',
          title: data.achievementTitle || 'Achievement Unlocked!',
          subtitle: 'New Badge Earned',
          description: data.achievementDescription || 'You earned a new achievement!',
        };
      case 'streak':
        return {
          icon: Flame,
          gradient: 'from-orange-500 to-red-500',
          title: `${data.streak} Day Streak!`,
          subtitle: 'On Fire!',
          description: 'Keep the momentum going! Come back tomorrow to continue your streak.',
        };
      case 'perfect_score':
        return {
          icon: Trophy,
          gradient: 'from-green-500 to-emerald-500',
          title: 'Perfect Score!',
          subtitle: `${data.score}/100`,
          description: 'Your email scored in the top tier! Great job optimizing it.',
        };
      default:
        return {
          icon: PartyPopper,
          gradient: 'from-purple-500 to-pink-500',
          title: 'Celebration!',
          subtitle: 'Great work!',
          description: 'You achieved something amazing!',
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <Confetti />
      
      <Card 
        className={`w-full max-w-sm mx-4 relative overflow-hidden transition-all duration-300 ${isVisible ? 'scale-100' : 'scale-90'}`}
        onClick={(e) => e.stopPropagation()}
        data-testid={`celebration-modal-${type}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${content.gradient} opacity-20`} />
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10"
          onClick={handleClose}
          data-testid="button-close-celebration"
        >
          <X className="w-4 h-4" />
        </Button>
        
        <CardContent className="relative p-8 text-center">
          <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${content.gradient} flex items-center justify-center mb-4 animate-bounce-slow`}>
            <Icon className="w-12 h-12 text-white" />
          </div>
          
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {content.subtitle}
          </p>
          
          <h2 className="text-3xl font-bold mb-2 gradient-text">
            {content.title}
          </h2>
          
          <p className="text-muted-foreground mb-6">
            {content.description}
          </p>
          
          <Button
            onClick={handleClose}
            className={`w-full bg-gradient-to-r ${content.gradient} hover:opacity-90`}
            data-testid="button-continue-celebration"
          >
            Continue
            <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface CelebrationEvent {
  id: string;
  type: 'level_up' | 'achievement' | 'streak' | 'perfect_score';
  data: CelebrationModalProps['data'];
}

export function useCelebration() {
  const [celebrations, setCelebrations] = useState<CelebrationEvent[]>([]);

  const celebrate = useCallback((type: CelebrationEvent['type'], data: CelebrationEvent['data']) => {
    const id = `${type}-${Date.now()}`;
    setCelebrations(prev => [...prev, { id, type, data }]);
  }, []);

  const dismissCelebration = useCallback((id: string) => {
    setCelebrations(prev => prev.filter(c => c.id !== id));
  }, []);

  return {
    celebrations,
    celebrate,
    dismissCelebration,
    CelebrationRenderer: () => (
      <>
        {celebrations.map((celebration) => (
          <CelebrationModal
            key={celebration.id}
            type={celebration.type}
            data={celebration.data}
            onClose={() => dismissCelebration(celebration.id)}
          />
        ))}
      </>
    ),
  };
}
