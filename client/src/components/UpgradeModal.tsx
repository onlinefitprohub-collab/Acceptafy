import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CloseIcon, AcademyIcon, FollowUpIcon, PreFlightIcon } from './icons/CategoryIcons';
import { Loader2 } from 'lucide-react';

interface UpgradeModalProps {
  onClose: () => void;
  targetPlan?: 'pro' | 'scale';
}

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: Price[];
}

const ProFeature: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted text-purple-500 dark:text-purple-300 flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    </div>
);

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, targetPlan = 'pro' }) => {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'scale'>(targetPlan);

  const { data: productsData } = useQuery<{ data: Product[] }>({
    queryKey: ["/api/products"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/checkout", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const getPriceId = (planKey: string): string | null => {
    const product = productsData?.data?.find(p => 
      p.name.toLowerCase().includes(planKey) || 
      p.metadata?.tier === planKey
    );
    const monthlyPrice = product?.prices?.find(p => p.recurring?.interval === 'month');
    return monthlyPrice?.id || null;
  };

  const handleUpgrade = () => {
    const priceId = getPriceId(selectedPlan);
    if (priceId) {
      checkoutMutation.mutate(priceId);
    } else {
      window.location.href = '/pricing';
    }
  };

  const isPro = selectedPlan === 'pro';
  const planName = isPro ? 'Pro' : 'Scale';
  const planPrice = isPro ? '$19' : '$49';

  return (
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      data-testid="upgrade-modal"
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 sm:p-5 border-b border-border flex-shrink-0">
          <h2 id="upgrade-modal-title" className="text-lg sm:text-xl font-bold text-foreground">
            Upgrade to Acceptafy {planName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground rounded-full hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close modal"
            data-testid="button-close-upgrade-modal"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        
        <main className="p-6 space-y-6">
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setSelectedPlan('pro')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPlan === 'pro' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                data-testid="button-select-pro"
              >
                Pro - $19/mo
              </button>
              <button
                onClick={() => setSelectedPlan('scale')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPlan === 'scale' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                data-testid="button-select-scale"
              >
                Scale - $49/mo
              </button>
            </div>

            <p className="text-center text-muted-foreground">
              {isPro 
                ? "Unlock powerful features to maximize your deliverability and supercharge your email campaigns."
                : "Get unlimited access with advanced analytics and white-label reports for your agency or team."
              }
            </p>
            
            <div className="space-y-5">
                <ProFeature 
                    icon={<FollowUpIcon />} 
                    title={isPro ? "10-Email Sequence Generator" : "Unlimited Sequences"}
                    description={isPro 
                      ? "Automatically create entire value-driven follow-up campaigns for any scenario."
                      : "Generate unlimited follow-up sequences with advanced personalization options."
                    }
                />
                 <ProFeature 
                    icon={<PreFlightIcon />} 
                    title="Pre-Flight Deliverability Checklist"
                    description="Scan your domain's health, analyze list quality, and generate critical BIMI records before you send."
                />
                 <ProFeature 
                    icon={<AcademyIcon />} 
                    title={isPro ? "Full Academy Access" : "Full Academy + White-Label Reports"}
                    description={isPro
                      ? "Unlock all advanced modules, blueprints, and the interactive scenario simulator."
                      : "Everything in Pro plus white-label PDF reports for your clients."
                    }
                />
            </div>
        </main>

        <footer className="p-5 bg-black/20 border-t border-white/10">
             <button 
                onClick={handleUpgrade}
                disabled={checkoutMutation.isPending}
                className="w-full px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] shimmer-effect disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="button-upgrade-now"
             >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Upgrade to {planName} - {planPrice}/mo</>
                )}
            </button>
            <p className="text-center text-xs text-gray-500 mt-3">Secure payment via Stripe. Cancel anytime.</p>
        </footer>

      </div>
    </div>
  );
};
