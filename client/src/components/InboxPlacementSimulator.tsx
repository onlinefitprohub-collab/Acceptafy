import type { InboxPlacementPrediction } from '../types';
import { GmailIcon, OutlookIcon, AppleMailIcon, InboxIcon, TagIcon, SpamIcon } from './icons/CategoryIcons';

interface InboxPlacementSimulatorProps {
  prediction: InboxPlacementPrediction;
}

const getPlacementIcon = (placement: string) => {
    placement = placement.toLowerCase();
    if (placement.includes('primary') || placement.includes('focused') || placement.includes('inbox')) {
        return <InboxIcon className="w-5 h-5 text-green-600 dark:text-green-400" />;
    }
    if (placement.includes('promotions') || placement.includes('other')) {
        return <TagIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    }
    return <SpamIcon className="w-5 h-5 text-red-600 dark:text-red-400" />;
};

const ProviderCard: React.FC<{ 
    providerName: string, 
    providerIcon: React.ReactNode, 
    placement: string, 
    reason: string 
}> = ({ providerName, providerIcon, placement, reason }) => {
    
    const getPlacementStyles = (p: string): { text: string, bg: string, border: string } => {
        p = p.toLowerCase();
        if (p.includes('primary') || p.includes('focused') || p.includes('inbox')) {
            return { text: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-500/10', border: 'border-green-300 dark:border-green-500/30' };
        }
        if (p.includes('promotions') || p.includes('other')) {
            return { text: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-500/10', border: 'border-yellow-300 dark:border-yellow-500/30' };
        }
        return { text: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-500/10', border: 'border-red-300 dark:border-red-500/30' };
    };
    
    const styles = getPlacementStyles(placement);

    return (
        <div className={`p-4 rounded-lg border ${styles.border} ${styles.bg}`} data-testid={`provider-card-${providerName.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex items-center gap-3 mb-3">
                {providerIcon}
                <h4 className="text-lg font-bold text-foreground">{providerName}</h4>
            </div>
            <div className="flex items-center gap-2 mb-2">
                {getPlacementIcon(placement)}
                <span className={`font-bold text-xl ${styles.text}`}>{placement}</span>
            </div>
            <p className="text-sm text-muted-foreground italic">"{reason}"</p>
        </div>
    );
};


export const InboxPlacementSimulator: React.FC<InboxPlacementSimulatorProps> = ({ prediction }) => {
  if (!prediction || !prediction.gmail || !prediction.outlook || !prediction.appleMail) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-lg animate-fade-in" data-testid="inbox-placement-simulator">
      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Inbox Placement Prediction</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProviderCard 
            providerName="Gmail"
            providerIcon={<GmailIcon className="w-6 h-6 text-[#db4437]" />}
            placement={prediction.gmail.placement}
            reason={prediction.gmail.reason}
        />
        <ProviderCard 
            providerName="Outlook"
            providerIcon={<OutlookIcon className="w-6 h-6 text-[#0078d4]" />}
            placement={prediction.outlook.placement}
            reason={prediction.outlook.reason}
        />
        <ProviderCard 
            providerName="Apple Mail"
            providerIcon={<AppleMailIcon className="w-6 h-6 text-gray-300" />}
            placement={prediction.appleMail.placement}
            reason={prediction.appleMail.reason}
        />
      </div>
    </div>
  );
};
