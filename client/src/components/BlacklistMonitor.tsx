import { useState, lazy, Suspense } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  Clock, 
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Globe,
  Server,
  Settings,
  Bell,
  BellOff,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import type { BlacklistCheckResponse, BlacklistResult, MonitoredDomain, BlacklistCheckHistory } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface DelistingGuidance {
  steps: string[];
  timeframe: string;
  notes: string;
}

export function BlacklistMonitor() {
  const { toast } = useToast();
  const [target, setTarget] = useState('');
  const [checkResult, setCheckResult] = useState<BlacklistCheckResponse | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newType, setNewType] = useState<'domain' | 'ip'>('domain');
  const [selectedGuidance, setSelectedGuidance] = useState<{ zone: string; guidance: DelistingGuidance } | null>(null);

  const { data: monitoredDomains = [], isLoading: domainsLoading } = useQuery<MonitoredDomain[]>({
    queryKey: ['/api/blacklist/domains'],
  });

  const { data: history = [], isLoading: historyLoading } = useQuery<BlacklistCheckHistory[]>({
    queryKey: ['/api/blacklist/history'],
  });

  const checkMutation = useMutation({
    mutationFn: async (targetValue: string) => {
      const res = await apiRequest('POST', '/api/blacklist/check', { target: targetValue });
      return res.json();
    },
    onSuccess: (data: BlacklistCheckResponse) => {
      setCheckResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist/history'] });
      if (data.listedOn > 0) {
        toast({
          title: 'Blacklist Alert',
          description: `Found on ${data.listedOn} blacklist(s). Review results below.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'All Clear',
          description: 'Not found on any checked blacklists.',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Check Failed',
        description: error.message || 'Failed to check blacklists',
        variant: 'destructive',
      });
    },
  });

  const addDomainMutation = useMutation({
    mutationFn: async (data: { domain: string; type: string }) => {
      const res = await apiRequest('POST', '/api/blacklist/domains', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist/domains'] });
      setAddDialogOpen(false);
      setNewDomain('');
      toast({
        title: 'Domain Added',
        description: 'Added to your monitoring list.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Add',
        description: error.message || 'Could not add domain to monitoring',
        variant: 'destructive',
      });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/blacklist/domains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist/domains'] });
      toast({
        title: 'Domain Removed',
        description: 'Removed from monitoring list.',
      });
    },
  });

  const updateDomainMutation = useMutation({
    mutationFn: async ({ id, checkFrequency, alertsEnabled }: { id: string; checkFrequency?: string; alertsEnabled?: boolean }) => {
      const res = await apiRequest('PATCH', `/api/blacklist/domains/${id}`, { checkFrequency, alertsEnabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist/domains'] });
      toast({
        title: 'Settings Updated',
        description: 'Monitoring settings have been updated.',
      });
    },
  });

  const runManualCheckMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('POST', `/api/blacklist/domains/${id}/check`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist/domains'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist/history'] });
      toast({
        title: 'Check Complete',
        description: 'Domain has been checked and history updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Check Failed',
        description: 'Failed to run manual check.',
        variant: 'destructive',
      });
    },
  });

  const fetchGuidance = async (zone: string) => {
    try {
      const res = await fetch(`/api/blacklist/guidance/${encodeURIComponent(zone)}`);
      const guidance = await res.json();
      setSelectedGuidance({ zone, guidance });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load delisting guidance',
        variant: 'destructive',
      });
    }
  };

  const handleCheck = () => {
    if (target.trim()) {
      checkMutation.mutate(target.trim());
    }
  };

  const handleQuickCheck = (domain: string) => {
    setTarget(domain);
    checkMutation.mutate(domain);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-blacklist-title">Sender Reputation Monitor</h2>
          <p className="text-muted-foreground">Check if your sending domain or IP is on email blacklists</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Check Blacklist Status
          </CardTitle>
          <CardDescription>
            Enter your sending domain (e.g., mail.yourdomain.com) or IP address to check against 25+ major blacklists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter domain or IP address..."
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              className="flex-1"
              data-testid="input-blacklist-target"
            />
            <Button 
              onClick={handleCheck} 
              disabled={!target.trim() || checkMutation.isPending}
              data-testid="button-check-blacklist"
            >
              {checkMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Check Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {checkResult && (
        <Card className={checkResult.listedOn > 0 ? 'border-destructive' : 'border-green-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {checkResult.listedOn > 0 ? (
                <>
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  <span className="text-destructive">Blacklist Issues Found</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <span className="text-green-500">Clean Status</span>
                </>
              )}
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                {checkResult.type === 'ip' ? <Server className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {checkResult.domain}
                {checkResult.resolvedIP && (
                  <span className="text-muted-foreground ml-1">
                    (resolved: {checkResult.resolvedIP})
                  </span>
                )}
              </span>
              <span>Checked: {checkResult.totalBlacklists} lists</span>
              <span className="text-green-600">Clean: {checkResult.cleanOn}</span>
              {checkResult.listedOn > 0 && (
                <span className="text-destructive font-semibold">Listed: {checkResult.listedOn}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {checkResult.results.map((result, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.listed 
                        ? 'bg-destructive/10 border-destructive/30' 
                        : 'bg-muted/50 border-transparent'
                    }`}
                    data-testid={`row-blacklist-result-${idx}`}
                  >
                    <div className="flex items-center gap-3">
                      {result.listed ? (
                        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{result.name}</p>
                        <p className="text-sm text-muted-foreground">{result.blacklist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.listed ? 'destructive' : 'outline'}>
                        {result.listed ? 'Listed' : 'Clean'}
                      </Badge>
                      {result.listed && result.delistUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => fetchGuidance(result.blacklist)}
                          data-testid={`button-guidance-${idx}`}
                        >
                          <HelpCircle className="h-4 w-4 mr-1" />
                          How to Delist
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="monitored" className="w-full">
        <TabsList>
          <TabsTrigger value="monitored" data-testid="tab-monitored">
            <Shield className="h-4 w-4 mr-2" />
            Monitored Domains
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <Clock className="h-4 w-4 mr-2" />
            Check History
          </TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Reputation Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitored">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Your Monitored Domains</CardTitle>
                <CardDescription>
                  Save domains and IPs for quick checks. Limits: Starter (3), Pro (15), Scale (50)
                </CardDescription>
              </div>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-domain">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Domain
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Domain or IP to Monitor</DialogTitle>
                    <DialogDescription>
                      Enter your sending domain or IP address to track
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="domain">Domain or IP</Label>
                      <Input
                        id="domain"
                        placeholder="e.g., mail.yourdomain.com or 192.168.1.1"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        data-testid="input-new-domain"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <RadioGroup value={newType} onValueChange={(v) => setNewType(v as 'domain' | 'ip')}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="domain" id="type-domain" />
                          <Label htmlFor="type-domain" className="flex items-center gap-2 cursor-pointer">
                            <Globe className="h-4 w-4" />
                            Domain
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ip" id="type-ip" />
                          <Label htmlFor="type-ip" className="flex items-center gap-2 cursor-pointer">
                            <Server className="h-4 w-4" />
                            IP Address
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Button 
                      onClick={() => addDomainMutation.mutate({ domain: newDomain, type: newType })}
                      disabled={!newDomain.trim() || addDomainMutation.isPending}
                      className="w-full"
                      data-testid="button-save-domain"
                    >
                      {addDomainMutation.isPending ? 'Adding...' : 'Add to Monitoring'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {domainsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : monitoredDomains.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No domains monitored yet</p>
                  <p className="text-sm">Add your sending domains for quick blacklist checks</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {monitoredDomains.map((domain) => (
                    <div 
                      key={domain.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                      data-testid={`row-monitored-domain-${domain.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {domain.type === 'ip' ? (
                          <Server className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{domain.domain}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {domain.lastCheckedAt 
                                ? `Last check: ${format(new Date(domain.lastCheckedAt), 'MMM d, HH:mm')}`
                                : 'Never checked'
                              }
                            </span>
                            {domain.lastStatus && (
                              <Badge variant={domain.lastStatus === 'listed' ? 'destructive' : 'outline'} className="text-xs">
                                {domain.lastStatus === 'listed' ? `Listed (${domain.listedCount})` : 'Clean'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {domain.checkFrequency === 'daily' ? 'Daily' : domain.checkFrequency === 'weekly' ? 'Weekly' : 'Manual'}
                        </Badge>
                        {domain.alertsEnabled ? (
                          <Badge variant="outline" className="text-xs text-green-600">
                            <Bell className="h-3 w-3" />
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            <BellOff className="h-3 w-3" />
                          </Badge>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => runManualCheckMutation.mutate(domain.id)}
                          disabled={runManualCheckMutation.isPending}
                          data-testid={`button-quick-check-${domain.id}`}
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${runManualCheckMutation.isPending ? 'animate-spin' : ''}`} />
                          Check
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-settings-${domain.id}`}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Monitoring Settings</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Calendar className="h-4 w-4 mr-2" />
                                Check Frequency
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem 
                                  onClick={() => updateDomainMutation.mutate({ id: domain.id, checkFrequency: 'daily' })}
                                >
                                  {domain.checkFrequency === 'daily' && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                                  Daily
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateDomainMutation.mutate({ id: domain.id, checkFrequency: 'weekly' })}
                                >
                                  {domain.checkFrequency === 'weekly' && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                                  Weekly
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateDomainMutation.mutate({ id: domain.id, checkFrequency: 'manual' })}
                                >
                                  {domain.checkFrequency === 'manual' && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                                  Manual Only
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem 
                              onClick={() => updateDomainMutation.mutate({ id: domain.id, alertsEnabled: !domain.alertsEnabled })}
                            >
                              {domain.alertsEnabled ? (
                                <>
                                  <BellOff className="h-4 w-4 mr-2" />
                                  Disable Alerts
                                </>
                              ) : (
                                <>
                                  <Bell className="h-4 w-4 mr-2" />
                                  Enable Alerts
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteDomainMutation.mutate(domain.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Domain
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Check History</CardTitle>
              <CardDescription>
                Your past blacklist checks and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No check history yet</p>
                  <p className="text-sm">Run your first blacklist check above</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {history.map((check) => (
                      <div 
                        key={check.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                        data-testid={`row-history-${check.id}`}
                      >
                        <div className="flex items-center gap-3">
                          {(check.listedOn ?? 0) > 0 ? (
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                          ) : (
                            <ShieldCheck className="h-5 w-5 text-green-500" />
                          )}
                          <div>
                            <p className="font-medium">{check.domain}</p>
                            <p className="text-sm text-muted-foreground">
                              {check.createdAt ? format(new Date(check.createdAt), 'MMM d, yyyy h:mm a') : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{check.totalBlacklists} checked</Badge>
                          {(check.listedOn ?? 0) > 0 ? (
                            <Badge variant="destructive">{check.listedOn} listed</Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600">All clean</Badge>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleQuickCheck(check.domain)}
                            disabled={checkMutation.isPending}
                            data-testid={`button-recheck-${check.id}`}
                          >
                            <RefreshCw className={`h-4 w-4 ${checkMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reputation Trends
              </CardTitle>
              <CardDescription>
                Track your sender reputation over time based on blacklist checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : history.length < 2 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Not enough data for trends</p>
                  <p className="text-sm">Run at least 2 blacklist checks to see trends</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={history
                          .slice()
                          .reverse()
                          .slice(-30)
                          .map(check => ({
                            date: check.createdAt ? format(new Date(check.createdAt), 'MMM d') : 'N/A',
                            fullDate: check.createdAt ? format(new Date(check.createdAt), 'MMM d, yyyy h:mm a') : 'N/A',
                            listings: check.listedOn ?? 0,
                            clean: (check.totalBlacklists ?? 27) - (check.listedOn ?? 0),
                            score: Math.round(((check.totalBlacklists ?? 27) - (check.listedOn ?? 0)) / (check.totalBlacklists ?? 27) * 100),
                            domain: check.domain,
                          }))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                        <YAxis domain={[0, 100]} className="text-xs fill-muted-foreground" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{data.domain}</p>
                                  <p className="text-sm text-muted-foreground">{data.fullDate}</p>
                                  <div className="mt-2 space-y-1 text-sm">
                                    <p className="text-green-500">Reputation Score: {data.score}%</p>
                                    <p className="text-destructive">Blacklists: {data.listings}</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#22c55e" 
                          fillOpacity={1} 
                          fill="url(#colorScore)"
                          name="Reputation Score"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      const recentChecks = history.slice(0, 10);
                      const avgScore = recentChecks.length > 0 
                        ? Math.round(recentChecks.reduce((sum, check) => 
                            sum + ((check.totalBlacklists ?? 27) - (check.listedOn ?? 0)) / (check.totalBlacklists ?? 27) * 100, 0
                          ) / recentChecks.length)
                        : 0;
                      const totalListings = recentChecks.reduce((sum, check) => sum + (check.listedOn ?? 0), 0);
                      const uniqueDomains = [...new Set(recentChecks.map(c => c.domain))].length;
                      
                      return (
                        <>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-4xl font-bold text-green-500">{avgScore}%</p>
                                <p className="text-sm text-muted-foreground mt-1">Avg Reputation Score</p>
                                <p className="text-xs text-muted-foreground">(last 10 checks)</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className={`text-4xl font-bold ${totalListings > 0 ? 'text-destructive' : 'text-green-500'}`}>
                                  {totalListings}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">Total Listings Found</p>
                                <p className="text-xs text-muted-foreground">(last 10 checks)</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-4xl font-bold">{uniqueDomains}</p>
                                <p className="text-sm text-muted-foreground mt-1">Domains Checked</p>
                                <p className="text-xs text-muted-foreground">(last 10 checks)</p>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedGuidance} onOpenChange={() => setSelectedGuidance(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Delisting Guide
            </DialogTitle>
            <DialogDescription>
              {selectedGuidance?.zone}
            </DialogDescription>
          </DialogHeader>
          {selectedGuidance && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Steps to Remove Your Listing:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  {selectedGuidance.guidance.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Expected Timeframe:</span> {selectedGuidance.guidance.timeframe}
                </p>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <span className="font-semibold">Important:</span> {selectedGuidance.guidance.notes}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
