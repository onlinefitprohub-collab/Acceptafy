import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, TrendingUp, AlertTriangle, Sparkles, Sun, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SendTimeResult {
  bestTimes: Array<{
    day: string;
    hour: string;
    score: number;
    reason: string;
  }>;
  worstTimes: Array<{
    day: string;
    hour: string;
    score: number;
    reason: string;
  }>;
  timezone: string;
  industryInsight: string;
  summary: string;
}

const INDUSTRIES = [
  { value: 'ecommerce', label: 'E-Commerce / Retail' },
  { value: 'saas', label: 'SaaS / Technology' },
  { value: 'finance', label: 'Finance / Banking' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'travel', label: 'Travel / Hospitality' },
  { value: 'media', label: 'Media / Entertainment' },
  { value: 'nonprofit', label: 'Non-Profit' },
  { value: 'realestate', label: 'Real Estate' },
  { value: 'other', label: 'Other / General' },
];

const AUDIENCE_TYPES = [
  { value: 'b2b', label: 'B2B (Business)' },
  { value: 'b2c', label: 'B2C (Consumer)' },
  { value: 'mixed', label: 'Mixed Audience' },
];

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${ampm}`;
});

export const SendTimeOptimizer: React.FC = () => {
  const { toast } = useToast();
  const [emailContent, setEmailContent] = useState('');
  const [industry, setIndustry] = useState('');
  const [audienceType, setAudienceType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SendTimeResult | null>(null);

  const handleOptimize = async () => {
    if (!emailContent.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email content to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/insights/send-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailContent: emailContent.trim(),
          industry: industry || undefined,
          audienceType: audienceType || undefined
        })
      });
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        toast({
          title: "Analysis Failed",
          description: "Could not analyze send times. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to optimize send time:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the analysis service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const generateHeatmapData = () => {
    if (!result) return null;
    
    const heatmap: Record<string, Record<string, { score: number; isBest: boolean; isWorst: boolean }>> = {};
    
    DAYS_ORDER.forEach(day => {
      heatmap[day] = {};
      HOURS.forEach(hour => {
        heatmap[day][hour] = { score: 50, isBest: false, isWorst: false };
      });
    });

    result.bestTimes.forEach(time => {
      const day = time.day;
      if (heatmap[day]) {
        Object.keys(heatmap[day]).forEach(hour => {
          if (hour.toLowerCase().includes(time.hour.toLowerCase().replace(':00', ''))) {
            heatmap[day][hour] = { score: time.score, isBest: true, isWorst: false };
          }
        });
      }
    });

    result.worstTimes.forEach(time => {
      const day = time.day;
      if (heatmap[day]) {
        Object.keys(heatmap[day]).forEach(hour => {
          if (hour.toLowerCase().includes(time.hour.toLowerCase().replace(':00', ''))) {
            heatmap[day][hour] = { score: time.score, isBest: false, isWorst: true };
          }
        });
      }
    });

    return heatmap;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="card-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Send Time Optimizer</CardTitle>
              <CardDescription>AI-powered recommendations for the best times to send your emails</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email Content *</label>
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Paste your email content here (subject line and body)..."
                rows={6}
                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
                data-testid="input-sendtime-content"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Industry (optional)</label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger data-testid="select-sendtime-industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Audience Type (optional)</label>
                <Select value={audienceType} onValueChange={setAudienceType}>
                  <SelectTrigger data-testid="select-sendtime-audience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_TYPES.map(aud => (
                      <SelectItem key={aud.value} value={aud.value}>{aud.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            onClick={handleOptimize}
            disabled={isLoading || !emailContent.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            data-testid="button-optimize-sendtime"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Send Times...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Optimize Send Time
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card className="card-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Best Times to Send</CardTitle>
                  <CardDescription>Optimal send windows for maximum engagement</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.bestTimes.map((time, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20"
                    data-testid={`best-time-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{time.day}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {time.hour.includes('AM') && parseInt(time.hour) < 12 ? (
                          <Sun className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <Moon className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-muted-foreground">{time.hour}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="bg-green-500">
                        {time.score}% match
                      </Badge>
                    </div>
                  </div>
                ))}
                {result.bestTimes.map((time, index) => (
                  <p key={`reason-${index}`} className="text-sm text-muted-foreground pl-4 border-l-2 border-green-500/30">
                    {time.reason}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Times to Avoid</CardTitle>
                  <CardDescription>These times typically have lower engagement</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.worstTimes.map((time, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20"
                    data-testid={`worst-time-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-500" />
                        <span className="font-medium">{time.day}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{time.hour}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">
                        {time.score}% match
                      </Badge>
                    </div>
                  </div>
                ))}
                {result.worstTimes.map((time, index) => (
                  <p key={`reason-${index}`} className="text-sm text-muted-foreground pl-4 border-l-2 border-red-500/30">
                    {time.reason}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-lift">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Industry Insights</CardTitle>
                  <CardDescription>Tailored recommendations for your audience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-foreground">{result.industryInsight}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  Summary
                </h4>
                <p className="text-muted-foreground">{result.summary}</p>
              </div>

              {result.timezone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Timezone: {result.timezone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
