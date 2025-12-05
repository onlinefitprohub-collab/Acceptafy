import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Smile, Meh, Frown, TrendingUp, Lightbulb, Sparkles, Copy, Check, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SentimentAnalysisResult } from '../types';

export const SentimentAnalyzer: React.FC = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SentimentAnalysisResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!body.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: body.trim(),
          subject: subject.trim() || undefined,
          previewText: previewText.trim() || undefined
        })
      });
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        toast({
          title: "Analysis Failed",
          description: "Could not analyze email sentiment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to analyze sentiment:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the analysis service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return <Smile className="w-6 h-6 text-green-500" />;
      case 'Negative': return <Frown className="w-6 h-6 text-red-500" />;
      case 'Mixed': return <Meh className="w-6 h-6 text-yellow-500" />;
      default: return <Meh className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return 'text-green-500';
      case 'Negative': return 'text-red-500';
      case 'Mixed': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 50) return 'text-green-500';
    if (score >= 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      'excitement': 'bg-orange-500/20 text-orange-400',
      'trust': 'bg-blue-500/20 text-blue-400',
      'curiosity': 'bg-purple-500/20 text-purple-400',
      'urgency': 'bg-red-500/20 text-red-400',
      'fear': 'bg-red-600/20 text-red-500',
      'joy': 'bg-green-500/20 text-green-400',
      'anticipation': 'bg-yellow-500/20 text-yellow-400',
      'confidence': 'bg-indigo-500/20 text-indigo-400',
      'warmth': 'bg-pink-500/20 text-pink-400',
      'professionalism': 'bg-slate-500/20 text-slate-400'
    };
    return colors[emotion.toLowerCase()] || 'bg-primary/20 text-primary';
  };

  const overallSentiment = result?.overallSentiment || 'Neutral';
  const sentimentScore = typeof result?.sentimentScore === 'number' ? result.sentimentScore : 0;
  const normalizedScore = (sentimentScore + 100) / 2;
  const emotionBreakdown = Array.isArray(result?.emotionBreakdown) ? result.emotionBreakdown : [];
  const toneDescription = result?.toneDescription || '';
  const engagementPrediction = typeof result?.engagementPrediction === 'number' ? result.engagementPrediction : 50;
  const emotionalTriggers = Array.isArray(result?.emotionalTriggers) ? result.emotionalTriggers : [];
  const improvements = Array.isArray(result?.improvements) ? result.improvements : [];
  const summary = result?.summary || '';

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="card-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Sentiment Analyzer</CardTitle>
              <CardDescription>Analyze emotional tone and get suggestions for better engagement</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Subject Line (optional)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your email subject"
                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                data-testid="input-sentiment-subject"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Preview Text (optional)</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Preview text shown in inbox"
                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                data-testid="input-sentiment-preview"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email Body *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste your email content here..."
                rows={8}
                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
                data-testid="input-sentiment-body"
              />
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !body.trim()}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            data-testid="button-analyze-sentiment"
          >
            {isLoading ? 'Analyzing Sentiment...' : 'Analyze Sentiment'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4 animate-fade-in">
          <Card className={`border-2 ${
            overallSentiment === 'Positive' ? 'border-green-500/30' : 
            overallSentiment === 'Negative' ? 'border-red-500/30' : 
            overallSentiment === 'Mixed' ? 'border-yellow-500/30' : 'border-border'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {getSentimentIcon(overallSentiment)}
                  <div>
                    <h3 className={`font-bold text-lg ${getSentimentColor(overallSentiment)}`}>
                      {overallSentiment} Sentiment
                    </h3>
                    <p className="text-sm text-muted-foreground">{toneDescription}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getScoreColor(sentimentScore)}`}>
                    {sentimentScore > 0 ? '+' : ''}{sentimentScore}
                  </p>
                  <p className="text-xs text-muted-foreground">Sentiment Score</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sentiment Range</span>
                    <span className="font-medium text-foreground">-100 to +100</span>
                  </div>
                  <div className="relative h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 overflow-hidden">
                    <div 
                      className="absolute top-0 h-full w-1 bg-white shadow-lg"
                      style={{ left: `${normalizedScore}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Engagement Prediction</p>
                      <p className={`font-bold ${engagementPrediction >= 70 ? 'text-green-500' : engagementPrediction >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {engagementPrediction}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Emotional Triggers</p>
                      <p className="font-bold text-foreground">{emotionalTriggers.length} found</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {emotionBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Emotion Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {emotionBreakdown.map((emotion, i) => {
                  const emotionName = emotion.emotion || 'Unknown';
                  const percentage = typeof emotion.percentage === 'number' ? emotion.percentage : 0;
                  const description = emotion.description || '';
                  
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Badge className={`${getEmotionColor(emotionName)} text-xs font-medium`}>
                          {emotionName}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2 [&>div]:bg-primary" />
                      {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {emotionalTriggers.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Emotional Trigger Words
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {emotionalTriggers.map((trigger, i) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {improvements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Suggested Improvements
                </CardTitle>
                <CardDescription>Enhance your email's emotional impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {improvements.map((improvement, i) => {
                  const section = improvement.section || 'General';
                  const currentTone = improvement.currentTone || 'Current';
                  const suggestedTone = improvement.suggestedTone || 'Suggested';
                  const originalText = improvement.originalText || '';
                  const improvedText = improvement.improvedText || '';
                  const reason = improvement.reason || '';
                  
                  return (
                    <div key={i} className="p-4 rounded-lg bg-muted/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{section}</Badge>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{currentTone}</span>
                          <ArrowRight className="w-3 h-3 text-primary" />
                          <span className="text-primary font-medium">{suggestedTone}</span>
                        </div>
                      </div>
                      
                      {originalText && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Original:</p>
                          <p className="text-sm text-foreground/70 line-through">{originalText}</p>
                        </div>
                      )}
                      
                      {improvedText && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-green-500">Improved:</p>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-foreground flex-1">{improvedText}</p>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 flex-shrink-0"
                              onClick={() => copyToClipboard(improvedText, i)}
                              data-testid={`button-copy-improvement-${i}`}
                            >
                              {copiedIndex === i ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {reason && (
                        <p className="text-xs text-muted-foreground italic">{reason}</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {summary && (
            <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Summary</h4>
                    <p className="text-sm text-muted-foreground">{summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
