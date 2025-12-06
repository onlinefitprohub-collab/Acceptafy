import { useState } from 'react';
import { Shield, Check, AlertTriangle, X, TrendingUp, Loader2, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { SenderScoreResult } from '@shared/schema';

const estimateSenderScore = async (input: {
  domain: string;
  hasSpf: boolean;
  hasDkim: boolean;
  hasDmarc: boolean;
  listSize: number;
  avgOpenRate: number;
  avgBounceRate: number;
  avgComplaintRate: number;
  sendingFrequency: string;
  listAgeMonths: number;
  usesDoubleOptIn: boolean;
  hasUnsubscribeLink: boolean;
  sendsFromDedicatedIp: boolean;
}): Promise<SenderScoreResult> => {
  const response = await fetch('/api/sender-score/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Failed to estimate sender score');
  }
  return response.json();
};

const getGradeColor = (grade: string) => {
  if (grade.startsWith('A')) return 'text-green-400';
  if (grade.startsWith('B')) return 'text-blue-400';
  if (grade.startsWith('C')) return 'text-yellow-400';
  if (grade.startsWith('D')) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-yellow-400';
  if (score >= 20) return 'text-orange-400';
  return 'text-red-400';
};

const getProgressColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

export const SenderScoreEstimator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SenderScoreResult | null>(null);
  
  const [formData, setFormData] = useState({
    domain: '',
    hasSpf: false,
    hasDkim: false,
    hasDmarc: false,
    listSize: 5000,
    avgOpenRate: 20,
    avgBounceRate: 2,
    avgComplaintRate: 0.1,
    sendingFrequency: 'weekly',
    listAgeMonths: 12,
    usesDoubleOptIn: false,
    hasUnsubscribeLink: true,
    sendsFromDedicatedIp: false,
  });

  const handleSubmit = async () => {
    if (!formData.domain.trim()) {
      setError('Please enter your sending domain');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await estimateSenderScore(formData);
      setResult(data);
    } catch (err) {
      setError('Failed to analyze sender score. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const CategoryCard = ({ title, score, feedback }: { title: string; score: number; feedback: string }) => (
    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-300">{title}</span>
        <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full transition-all duration-500 ${getProgressColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">{feedback}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="domain" className="text-slate-300">Sending Domain</Label>
          <Input
            id="domain"
            data-testid="input-sender-domain"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            placeholder="example.com"
            className="mt-1 bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <Label htmlFor="hasSpf" className="text-slate-300 text-sm">SPF Configured</Label>
            <Switch
              id="hasSpf"
              data-testid="switch-spf"
              checked={formData.hasSpf}
              onCheckedChange={(checked) => setFormData({ ...formData, hasSpf: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <Label htmlFor="hasDkim" className="text-slate-300 text-sm">DKIM Configured</Label>
            <Switch
              id="hasDkim"
              data-testid="switch-dkim"
              checked={formData.hasDkim}
              onCheckedChange={(checked) => setFormData({ ...formData, hasDkim: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <Label htmlFor="hasDmarc" className="text-slate-300 text-sm">DMARC Configured</Label>
            <Switch
              id="hasDmarc"
              data-testid="switch-dmarc"
              checked={formData.hasDmarc}
              onCheckedChange={(checked) => setFormData({ ...formData, hasDmarc: checked })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="listSize" className="text-slate-300 text-sm">List Size</Label>
            <Input
              id="listSize"
              data-testid="input-list-size"
              type="number"
              value={formData.listSize}
              onChange={(e) => setFormData({ ...formData, listSize: parseInt(e.target.value) || 0 })}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <Label htmlFor="avgOpenRate" className="text-slate-300 text-sm">Avg Open Rate (%)</Label>
            <Input
              id="avgOpenRate"
              data-testid="input-open-rate"
              type="number"
              value={formData.avgOpenRate}
              onChange={(e) => setFormData({ ...formData, avgOpenRate: parseFloat(e.target.value) || 0 })}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <Label htmlFor="avgBounceRate" className="text-slate-300 text-sm">Avg Bounce Rate (%)</Label>
            <Input
              id="avgBounceRate"
              data-testid="input-bounce-rate"
              type="number"
              step="0.1"
              value={formData.avgBounceRate}
              onChange={(e) => setFormData({ ...formData, avgBounceRate: parseFloat(e.target.value) || 0 })}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <Label htmlFor="avgComplaintRate" className="text-slate-300 text-sm">Avg Complaint Rate (%)</Label>
            <Input
              id="avgComplaintRate"
              data-testid="input-complaint-rate"
              type="number"
              step="0.01"
              value={formData.avgComplaintRate}
              onChange={(e) => setFormData({ ...formData, avgComplaintRate: parseFloat(e.target.value) || 0 })}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sendingFrequency" className="text-slate-300 text-sm">Sending Frequency</Label>
            <Select 
              value={formData.sendingFrequency} 
              onValueChange={(value) => setFormData({ ...formData, sendingFrequency: value })}
            >
              <SelectTrigger data-testid="select-frequency" className="mt-1 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="irregular">Irregular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="listAgeMonths" className="text-slate-300 text-sm">List Age (months)</Label>
            <Input
              id="listAgeMonths"
              data-testid="input-list-age"
              type="number"
              value={formData.listAgeMonths}
              onChange={(e) => setFormData({ ...formData, listAgeMonths: parseInt(e.target.value) || 0 })}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <Label htmlFor="usesDoubleOptIn" className="text-slate-300 text-sm">Uses Double Opt-in</Label>
            <Switch
              id="usesDoubleOptIn"
              data-testid="switch-double-optin"
              checked={formData.usesDoubleOptIn}
              onCheckedChange={(checked) => setFormData({ ...formData, usesDoubleOptIn: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <Label htmlFor="hasUnsubscribeLink" className="text-slate-300 text-sm">Has Unsubscribe Link</Label>
            <Switch
              id="hasUnsubscribeLink"
              data-testid="switch-unsubscribe"
              checked={formData.hasUnsubscribeLink}
              onCheckedChange={(checked) => setFormData({ ...formData, hasUnsubscribeLink: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <Label htmlFor="sendsFromDedicatedIp" className="text-slate-300 text-sm">Dedicated IP</Label>
            <Switch
              id="sendsFromDedicatedIp"
              data-testid="switch-dedicated-ip"
              checked={formData.sendsFromDedicatedIp}
              onCheckedChange={(checked) => setFormData({ ...formData, sendsFromDedicatedIp: checked })}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          data-testid="button-estimate-score"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Gauge className="w-4 h-4 mr-2" />
              Estimate Sender Score
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5 text-purple-400" />
                Your Sender Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8 py-6">
                <div className="text-center">
                  <div className={`text-7xl font-bold ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore}
                  </div>
                  <div className="text-slate-400 text-sm mt-1">out of 100</div>
                </div>
                <div className="text-center px-6 border-l border-slate-700">
                  <div className={`text-5xl font-bold ${getGradeColor(result.grade)}`}>
                    {result.grade}
                  </div>
                  <div className="text-slate-400 text-sm mt-1">Grade</div>
                </div>
              </div>
              <p className="text-center text-slate-400 text-sm">{result.comparisonToIndustry}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CategoryCard 
              title="Authentication" 
              score={result.categories.authentication.score} 
              feedback={result.categories.authentication.feedback} 
            />
            <CategoryCard 
              title="List Hygiene" 
              score={result.categories.listHygiene.score} 
              feedback={result.categories.listHygiene.feedback} 
            />
            <CategoryCard 
              title="Engagement" 
              score={result.categories.engagement.score} 
              feedback={result.categories.engagement.feedback} 
            />
            <CategoryCard 
              title="Infrastructure" 
              score={result.categories.infrastructure.score} 
              feedback={result.categories.infrastructure.feedback} 
            />
            <CategoryCard 
              title="Best Practices" 
              score={result.categories.bestPractices.score} 
              feedback={result.categories.bestPractices.feedback} 
            />
          </div>

          {result.topIssues.length > 0 && (
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Top Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.topIssues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300 text-sm">
                      <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.recommendations.length > 0 && (
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300 text-sm">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};