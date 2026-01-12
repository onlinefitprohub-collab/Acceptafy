import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, Loader2, AlertCircle, Lightbulb, Target, Mail, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';

interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  recommendation: string;
}

interface CampaignRiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high';
  riskScore: number;
  riskFactors: RiskFactor[];
  predictedOpenRate: number;
  predictedBounceRate: number;
  predictedComplaintRate: number;
  spamTriggerWords: string[];
  positiveFactors: string[];
  summary: string;
  recommendations: string[];
}


const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'low': return 'text-green-400';
    case 'medium': return 'text-yellow-400';
    case 'high': return 'text-red-400';
    default: return 'text-slate-400';
  }
};

const getRiskBgColor = (risk: string) => {
  switch (risk) {
    case 'low': return 'bg-green-500/20 border-green-500/30';
    case 'medium': return 'bg-yellow-500/20 border-yellow-500/30';
    case 'high': return 'bg-red-500/20 border-red-500/30';
    default: return 'bg-slate-500/20 border-slate-500/30';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
};

const getScoreProgressColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

const getRiskIcon = (risk: string) => {
  switch (risk) {
    case 'low': return <CheckCircle className="w-8 h-8 text-green-400" />;
    case 'medium': return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
    case 'high': return <XCircle className="w-8 h-8 text-red-400" />;
    default: return <Shield className="w-8 h-8 text-slate-400" />;
  }
};

export const CampaignRiskScore: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CampaignRiskAnalysis | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    estimatedVolume: '',
    listAge: '',
  });

  const handleSubmit = async () => {
    if (!formData.subject.trim()) {
      setError('Please enter a subject line');
      return;
    }
    if (!formData.content.trim()) {
      setError('Please enter email content');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setRequiresUpgrade(false);
    
    try {
      const response = await fetch('/api/campaign/risk-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject,
          content: formData.content,
          estimatedVolume: formData.estimatedVolume ? parseInt(formData.estimatedVolume, 10) : undefined,
          listAge: formData.listAge || undefined,
        }),
      });
      
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.error === 'Pro feature') {
          setRequiresUpgrade(true);
          return;
        }
      }
      
      if (!response.ok) {
        throw new Error('Failed to analyze campaign risk');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to analyze campaign risk. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFormData({
      subject: '',
      content: '',
      estimatedVolume: '',
      listAge: '',
    });
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject" className="text-muted-foreground">Subject Line *</Label>
              <Input
                id="subject"
                data-testid="input-campaign-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter your email subject line"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-muted-foreground">Email Content *</Label>
              <Textarea
                id="content"
                data-testid="input-campaign-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Paste your email content here (HTML or plain text)"
                className="mt-1 min-h-[200px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedVolume" className="text-muted-foreground">Estimated Send Volume (optional)</Label>
                <Input
                  id="estimatedVolume"
                  data-testid="input-estimated-volume"
                  type="number"
                  value={formData.estimatedVolume}
                  onChange={(e) => setFormData({ ...formData, estimatedVolume: e.target.value })}
                  placeholder="e.g., 10000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="listAge" className="text-muted-foreground">List Age/Quality (optional)</Label>
                <Select
                  value={formData.listAge}
                  onValueChange={(value) => setFormData({ ...formData, listAge: value })}
                >
                  <SelectTrigger className="mt-1" data-testid="select-list-age">
                    <SelectValue placeholder="Select list quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new-double-optin">New list (double opt-in)</SelectItem>
                    <SelectItem value="new-single-optin">New list (single opt-in)</SelectItem>
                    <SelectItem value="established-engaged">Established, engaged list</SelectItem>
                    <SelectItem value="established-mixed">Established, mixed engagement</SelectItem>
                    <SelectItem value="old-unclean">Older list, needs cleaning</SelectItem>
                    <SelectItem value="purchased">Purchased or rented list</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {requiresUpgrade && (
              <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-3 rounded-full bg-purple-500/20">
                      <Crown className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Pro Feature</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      Campaign Risk Analysis is available on Pro and Scale plans. Upgrade to predict deliverability issues before you send.
                    </p>
                  </div>
                  <Link href="/pricing">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" data-testid="button-upgrade-risk-analysis">
                      <Lock className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-analyze-risk"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Campaign Risk...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Analyze Campaign Risk
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Overall Risk Score Header */}
          <div className={`p-6 rounded-xl border ${getRiskBgColor(result.overallRisk)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getRiskIcon(result.overallRisk)}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {result.overallRisk === 'low' && 'Low Risk - Safe to Send'}
                    {result.overallRisk === 'medium' && 'Medium Risk - Review Recommended'}
                    {result.overallRisk === 'high' && 'High Risk - Changes Needed'}
                  </h3>
                  <p className="text-sm text-slate-400">{result.summary}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(result.riskScore)}`}>
                  {result.riskScore}
                </div>
                <div className="text-xs text-slate-400">Safety Score</div>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={result.riskScore} className="h-2" />
            </div>
          </div>

          {/* Predicted Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <div>
                    <div className="text-sm text-muted-foreground">Predicted Open Rate</div>
                    <div className="text-2xl font-bold text-foreground">{result.predictedOpenRate}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className={`w-5 h-5 ${result.predictedBounceRate > 2 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`} />
                  <div>
                    <div className="text-sm text-muted-foreground">Predicted Bounce Rate</div>
                    <div className={`text-2xl font-bold ${result.predictedBounceRate > 2 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                      {result.predictedBounceRate}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className={`w-5 h-5 ${result.predictedComplaintRate > 0.1 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`} />
                  <div>
                    <div className="text-sm text-muted-foreground">Predicted Complaint Rate</div>
                    <div className={`text-2xl font-bold ${result.predictedComplaintRate > 0.1 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                      {result.predictedComplaintRate}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Factors */}
          {result.riskFactors && result.riskFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                  Risk Factors Detected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.riskFactors.map((factor, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-foreground">{factor.factor}</span>
                      <Badge className={getSeverityColor(factor.severity)}>
                        {factor.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{factor.impact}</p>
                    <div className="flex items-start gap-2 p-2 rounded bg-purple-500/10 border border-purple-500/20">
                      <Lightbulb className="w-4 h-4 text-purple-500 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-purple-700 dark:text-purple-300">{factor.recommendation}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Spam Trigger Words */}
          {result.spamTriggerWords && result.spamTriggerWords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                  Spam Trigger Words Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.spamTriggerWords.map((word, index) => (
                    <Badge key={index} className="bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
                      {word}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Positive Factors */}
          {result.positiveFactors && result.positiveFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                  Positive Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.positiveFactors.map((factor, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                  Recommendations to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
              data-testid="button-analyze-another"
            >
              Analyze Another Campaign
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
