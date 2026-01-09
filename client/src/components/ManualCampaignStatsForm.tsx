import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  BarChart3,
  Edit,
  Hash,
  Percent
} from 'lucide-react';
import type { ManualCampaignStats } from '@shared/schema';

interface MetricField {
  key: string;
  label: string;
  valueKey: keyof ManualCampaignStats;
  typeKey: keyof ManualCampaignStats;
}

const metricFields: MetricField[] = [
  { key: 'delivered', label: 'Delivered', valueKey: 'delivered', typeKey: 'deliveredType' },
  { key: 'opened', label: 'Opened', valueKey: 'opened', typeKey: 'openedType' },
  { key: 'clicked', label: 'Clicked', valueKey: 'clicked', typeKey: 'clickedType' },
  { key: 'conversion', label: 'Conversion', valueKey: 'conversion', typeKey: 'conversionType' },
  { key: 'softBounced', label: 'Soft Bounced', valueKey: 'softBounced', typeKey: 'softBouncedType' },
  { key: 'hardBounced', label: 'Hard Bounced', valueKey: 'hardBounced', typeKey: 'hardBouncedType' },
  { key: 'unsubscribed', label: 'Unsubscribed', valueKey: 'unsubscribed', typeKey: 'unsubscribedType' },
  { key: 'skipped', label: 'Skipped', valueKey: 'skipped', typeKey: 'skippedType' },
  { key: 'spam', label: 'Spam', valueKey: 'spam', typeKey: 'spamType' },
];

interface FormData {
  campaignName: string;
  totalSent: string;
  metrics: Record<string, { value: string; type: 'number' | 'percentage' }>;
}

const initialFormData: FormData = {
  campaignName: '',
  totalSent: '',
  metrics: metricFields.reduce((acc, field) => {
    acc[field.key] = { value: '', type: 'number' };
    return acc;
  }, {} as Record<string, { value: string; type: 'number' | 'percentage' }>),
};

export function ManualCampaignStatsForm() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const { data: manualStats = [], isLoading } = useQuery<ManualCampaignStats[]>({
    queryKey: ['/api/manual-campaign-stats'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/manual-campaign-stats', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manual-campaign-stats'] });
      toast({ title: 'Campaign stats added successfully' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add campaign stats', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest('PATCH', `/api/manual-campaign-stats/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manual-campaign-stats'] });
      toast({ title: 'Campaign stats updated successfully' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update campaign stats', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/manual-campaign-stats/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manual-campaign-stats'] });
      toast({ title: 'Campaign stats deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete campaign stats', description: error.message, variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const openCreateDialog = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (stats: ManualCampaignStats) => {
    setEditingId(stats.id);
    setFormData({
      campaignName: stats.campaignName,
      totalSent: stats.totalSent?.toString() || '',
      metrics: metricFields.reduce((acc, field) => {
        const value = stats[field.valueKey];
        const type = stats[field.typeKey] as 'number' | 'percentage' || 'number';
        acc[field.key] = { 
          value: value !== null && value !== undefined ? String(value) : '', 
          type 
        };
        return acc;
      }, {} as Record<string, { value: string; type: 'number' | 'percentage' }>),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.campaignName.trim()) {
      toast({ title: 'Campaign name is required', variant: 'destructive' });
      return;
    }

    const payload: any = {
      campaignName: formData.campaignName.trim(),
      totalSent: formData.totalSent ? parseInt(formData.totalSent) : null,
    };

    metricFields.forEach((field) => {
      const metric = formData.metrics[field.key];
      const value = metric.value ? parseFloat(metric.value) : null;
      payload[field.valueKey] = value !== null ? Math.round(value) : null;
      payload[field.typeKey] = metric.type;
    });

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const updateMetric = (key: string, field: 'value' | 'type', newValue: string) => {
    setFormData((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [key]: {
          ...prev.metrics[key],
          [field]: newValue,
        },
      },
    }));
  };

  const formatDisplayValue = (value: number | null, type: string | null) => {
    if (value === null || value === undefined) return '-';
    return type === 'percentage' ? `${value}%` : value.toLocaleString();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="border-dashed border-muted-foreground/30 bg-muted/5">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Manual Campaign Stats
          </CardTitle>
          <CardDescription>
            Enter your campaign metrics manually to track performance
          </CardDescription>
        </div>
        <Button onClick={openCreateDialog} size="sm" data-testid="button-add-manual-stats">
          <Plus className="w-4 h-4 mr-2" />
          Add Stats
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : manualStats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No manual stats yet</p>
            <p className="text-xs mt-1">Click "Add Stats" to enter your first campaign</p>
          </div>
        ) : (
          <div className="space-y-3">
            {manualStats.map((stats) => (
              <div
                key={stats.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50"
                data-testid={`manual-stats-${stats.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium truncate">{stats.campaignName}</span>
                    {stats.totalSent && (
                      <Badge variant="secondary" className="text-xs">
                        {stats.totalSent.toLocaleString()} sent
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {metricFields.slice(0, 5).map((field) => {
                      const value = stats[field.valueKey] as number | null;
                      const type = stats[field.typeKey] as string | null;
                      if (value === null || value === undefined) return null;
                      return (
                        <span key={field.key}>
                          {field.label}: {formatDisplayValue(value, type)}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(stats)}
                    data-testid={`button-edit-stats-${stats.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(stats.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-stats-${stats.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {editingId ? 'Edit Campaign Stats' : 'Add Campaign Stats'}
            </DialogTitle>
            <DialogDescription>
              Enter your campaign metrics as numbers or percentages
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">
                  Campaign Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Summer Sale Campaign"
                  value={formData.campaignName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, campaignName: e.target.value }))}
                  data-testid="input-campaign-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalSent">Total Sent</Label>
                <Input
                  id="totalSent"
                  type="number"
                  placeholder="e.g., 10000"
                  value={formData.totalSent}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totalSent: e.target.value }))}
                  data-testid="input-total-sent"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-medium mb-4 block">Campaign Metrics</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metricFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key} className="text-sm">
                      {field.label}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={field.key}
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={formData.metrics[field.key].value}
                        onChange={(e) => updateMetric(field.key, 'value', e.target.value)}
                        className="flex-1"
                        data-testid={`input-${field.key}`}
                      />
                      <Select
                        value={formData.metrics[field.key].type}
                        onValueChange={(value) => updateMetric(field.key, 'type', value)}
                      >
                        <SelectTrigger className="w-24" data-testid={`select-${field.key}-type`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="number">
                            <div className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              <span>#</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="percentage">
                            <div className="flex items-center gap-1">
                              <Percent className="w-3 h-3" />
                              <span>%</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={closeDialog} data-testid="button-cancel">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-stats">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Update' : 'Save'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
