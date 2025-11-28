import type { InboxPlacementPrediction } from '../types';
import { GmailIcon, OutlookIcon, AppleMailIcon } from './icons/CategoryIcons';

interface InboxPlacementSimulatorProps {
  prediction: InboxPlacementPrediction;
}

const getPlacementColor = (placement: string) => {
  const good = ['Primary', 'Focused', 'Inbox'];
  const bad = ['Spam', 'Junk'];
  if (good.includes(placement)) return 'text-green-400 bg-green-500/10 border-green-500/30';
  if (bad.includes(placement)) return 'text-red-400 bg-red-500/10 border-red-500/30';
  return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
};

export const InboxPlacementSimulator: React.FC<InboxPlacementSimulatorProps> = ({ prediction }) => {
  if (!prediction || !prediction.gmail || !prediction.outlook || !prediction.appleMail) {
    return null;
  }

  return (
    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Inbox Placement Prediction
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border ${getPlacementColor(prediction.gmail.placement)}`}>
          <div className="flex items-center gap-2 mb-3">
            <GmailIcon className="w-6 h-6" />
            <span className="font-semibold text-white">Gmail</span>
          </div>
          <div className="text-2xl font-bold mb-2">{prediction.gmail.placement}</div>
          <p className="text-sm text-gray-400">{prediction.gmail.reason}</p>
        </div>

        <div className={`p-4 rounded-lg border ${getPlacementColor(prediction.outlook.placement)}`}>
          <div className="flex items-center gap-2 mb-3">
            <OutlookIcon className="w-6 h-6" />
            <span className="font-semibold text-white">Outlook</span>
          </div>
          <div className="text-2xl font-bold mb-2">{prediction.outlook.placement}</div>
          <p className="text-sm text-gray-400">{prediction.outlook.reason}</p>
        </div>

        <div className={`p-4 rounded-lg border ${getPlacementColor(prediction.appleMail.placement)}`}>
          <div className="flex items-center gap-2 mb-3">
            <AppleMailIcon className="w-6 h-6" />
            <span className="font-semibold text-white">Apple Mail</span>
          </div>
          <div className="text-2xl font-bold mb-2">{prediction.appleMail.placement}</div>
          <p className="text-sm text-gray-400">{prediction.appleMail.reason}</p>
        </div>
      </div>
    </div>
  );
};
