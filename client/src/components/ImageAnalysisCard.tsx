import { useState } from 'react';
import type { ImageAnalysis } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { ChevronDownIcon } from './icons/CategoryIcons';
import { Image, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

interface ImageAnalysisCardProps {
  analysis: ImageAnalysis;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

const getAltTextIcon = (quality: string) => {
  switch (quality) {
    case 'Excellent':
    case 'Good':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'Poor':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    case 'Missing':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

const getAltTextBadgeStyle = (quality: string): string => {
  switch (quality) {
    case 'Excellent':
      return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/50';
    case 'Good':
      return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50';
    case 'Poor':
      return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/50';
    case 'Missing':
      return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/50';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getRatioStatusColor = (status: string): string => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('ideal') || lowerStatus.includes('good') || lowerStatus.includes('optimal')) {
    return 'text-green-600 dark:text-green-400';
  }
  if (lowerStatus.includes('warning') || lowerStatus.includes('heavy')) {
    return 'text-yellow-600 dark:text-yellow-400';
  }
  if (lowerStatus.includes('poor') || lowerStatus.includes('too')) {
    return 'text-red-600 dark:text-red-400';
  }
  return 'text-muted-foreground';
};

export const ImageAnalysisCard: React.FC<ImageAnalysisCardProps> = ({ analysis }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasImages = analysis.images && analysis.images.length > 0;
  const { textToImageRatio } = analysis;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg" data-testid="image-analysis-card">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left p-4 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl"
        aria-expanded={isExpanded}
        data-testid="button-expand-image-analysis"
      >
        <div className="flex items-center gap-3">
          <span className="text-purple-600 dark:text-purple-400"><Image className="w-6 h-6" /></span>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">Image Analysis</h3>
          <InfoTooltip text="Analyzes images in your email for deliverability impact. Email clients often block external images by default, and too many images can trigger spam filters. The ideal text-to-image ratio is 60% text / 40% images." />
          <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
            {analysis.score}/100
          </span>
        </div>
        <ChevronDownIcon className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="border-t border-border pt-4 mt-4 space-y-6">
              <p className="text-muted-foreground">{analysis.summary}</p>

              {textToImageRatio && (
                <div className="bg-muted p-4 rounded-lg border border-border space-y-4" data-testid="text-image-ratio-section">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-semibold text-foreground">Text-to-Image Ratio</h4>
                    <span className={`text-sm font-medium ${getRatioStatusColor(textToImageRatio.status)}`}>
                      {textToImageRatio.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Text: {textToImageRatio.textPercent}%</span>
                      <span className="text-muted-foreground">Images: {textToImageRatio.imagePercent}%</span>
                    </div>
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden border border-border">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                        style={{ width: `${textToImageRatio.textPercent}%` }}
                      />
                      <div 
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-amber-500 to-amber-600 transition-all duration-500"
                        style={{ width: `${textToImageRatio.imagePercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-purple-500 font-medium">Text Content</span>
                      <span className="text-amber-500 font-medium">Image Content</span>
                    </div>
                  </div>

                  {textToImageRatio.recommendation && (
                    <p className="text-sm text-muted-foreground bg-background p-3 rounded-md border border-border">
                      <strong className="text-foreground">Recommendation:</strong> {textToImageRatio.recommendation}
                    </p>
                  )}
                </div>
              )}

              {hasImages && (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-foreground">Per-Image Breakdown ({analysis.images.length} images)</h4>
                  {analysis.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="bg-muted p-4 rounded-lg border border-border space-y-3"
                      data-testid={`image-analysis-item-${idx}`}
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-purple-600 dark:text-purple-300">Image {img.index || idx + 1}</h5>
                        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 border rounded-full ${getAltTextBadgeStyle(img.altTextQuality)}`}>
                          {getAltTextIcon(img.altTextQuality)}
                          <span>Alt: {img.altTextQuality}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {img.dimensionAnalysis && (
                          <div>
                            <span className="font-medium text-foreground">Dimensions:</span>
                            <p className="text-muted-foreground">{img.dimensionAnalysis}</p>
                          </div>
                        )}
                        {img.sizeAnalysis && (
                          <div>
                            <span className="font-medium text-foreground">File Size:</span>
                            <p className="text-muted-foreground">{img.sizeAnalysis}</p>
                          </div>
                        )}
                        {img.placementFeedback && (
                          <div>
                            <span className="font-medium text-foreground">Placement:</span>
                            <p className="text-muted-foreground">{img.placementFeedback}</p>
                          </div>
                        )}
                        {img.deliverabilityImpact && (
                          <div>
                            <span className="font-medium text-foreground">Deliverability:</span>
                            <p className="text-muted-foreground">{img.deliverabilityImpact}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {analysis.feedback && analysis.feedback.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-md font-semibold text-foreground">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {analysis.feedback.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
