import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Trash2, Download, Loader2, Edit2, Sparkles, FolderOpen } from 'lucide-react';
import { EmailTemplateLibrary, type EmailTemplateData } from './EmailTemplateLibrary';
import type { EmailTemplate } from '@shared/schema';

interface EmailTemplatesProps {
  currentSubject: string;
  currentPreviewText: string;
  currentBody: string;
  onLoadTemplate: (subject: string, previewText: string, body: string) => void;
}

export function EmailTemplates({ 
  currentSubject, 
  currentPreviewText, 
  currentBody, 
  onLoadTemplate 
}: EmailTemplatesProps) {
  const { toast } = useToast();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/templates'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; subject: string; previewText: string; body: string }) => {
      return apiRequest('/api/templates', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setSaveDialogOpen(false);
      setTemplateName('');
      toast({ title: 'Template saved', description: 'Your email template has been saved.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save template.', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; subject?: string; previewText?: string; body?: string } }) => {
      return apiRequest(`/api/templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setEditingTemplate(null);
      toast({ title: 'Template updated', description: 'Your template has been updated.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update template.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/templates/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: 'Template deleted', description: 'Your template has been removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete template.', variant: 'destructive' });
    },
  });

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({ title: 'Name required', description: 'Please enter a name for your template.', variant: 'destructive' });
      return;
    }
    if (!currentBody.trim()) {
      toast({ title: 'Email required', description: 'Write some email content before saving.', variant: 'destructive' });
      return;
    }
    createMutation.mutate({
      name: templateName.trim(),
      subject: currentSubject,
      previewText: currentPreviewText,
      body: currentBody,
    });
  };

  const handleLoadTemplate = (template: EmailTemplate) => {
    onLoadTemplate(template.subject || '', template.previewText || '', template.body || '');
    toast({ title: 'Template loaded', description: `"${template.name}" has been loaded into the editor.` });
  };

  const handleUpdateTemplate = (template: EmailTemplate) => {
    if (!currentBody.trim()) {
      toast({ title: 'Email required', description: 'Write some email content before updating.', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({
      id: template.id,
      data: {
        subject: currentSubject,
        previewText: currentPreviewText,
        body: currentBody,
      },
    });
  };

  const handleDeleteTemplate = (template: EmailTemplate) => {
    deleteMutation.mutate(template.id);
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'bg-muted text-muted-foreground';
    const gradeUpper = grade.toUpperCase();
    if (gradeUpper === 'A+' || gradeUpper === 'A') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (gradeUpper === 'B+' || gradeUpper === 'B') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (gradeUpper === 'C+' || gradeUpper === 'C') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const handleSelectPreDesigned = (template: EmailTemplateData) => {
    onLoadTemplate(template.subject, template.previewText, template.body);
    toast({ title: 'Template loaded', description: `"${template.name}" has been loaded into the editor.` });
  };

  return (
    <Card className="h-full flex flex-col" data-testid="card-email-templates">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Email Templates</CardTitle>
              <CardDescription>Pre-designed and custom templates</CardDescription>
            </div>
          </div>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-save-template">
                <Plus className="w-4 h-4 mr-1" />
                Save Current
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save as Template</DialogTitle>
                <DialogDescription>
                  Save your current email as a reusable template.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Template name (e.g., Welcome Email)"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  data-testid="input-template-name"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)} data-testid="button-cancel-save">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveTemplate} 
                  disabled={createMutation.isPending}
                  data-testid="button-confirm-save"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="predesigned" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="predesigned" className="flex-1 gap-1" data-testid="tab-predesigned">
                <Sparkles className="h-4 w-4" />
                Pre-designed
              </TabsTrigger>
              <TabsTrigger value="my-templates" className="flex-1 gap-1" data-testid="tab-my-templates">
                <FolderOpen className="h-4 w-4" />
                My Templates
                {templates.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{templates.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="predesigned" className="flex-1 overflow-hidden mt-0 p-4">
            <EmailTemplateLibrary onSelectTemplate={handleSelectPreDesigned} />
          </TabsContent>

          <TabsContent value="my-templates" className="flex-1 overflow-hidden mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-6" data-testid="text-templates-empty">
                <FileText className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-2">No saved templates yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Write an email and click "Save Current" to create your first template.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="group p-4 rounded-lg border border-border/50 hover-elevate transition-all"
                      data-testid={`template-item-${template.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium truncate" data-testid={`text-template-name-${template.id}`}>{template.name}</h4>
                            {template.lastGrade && (
                              <Badge variant="outline" className={`text-xs ${getGradeColor(template.lastGrade)}`} data-testid={`badge-template-grade-${template.id}`}>
                                {template.lastGrade}
                              </Badge>
                            )}
                            {template.lastScore !== null && template.lastScore !== undefined && (
                              <Badge variant="secondary" className="text-xs" data-testid={`badge-template-score-${template.id}`}>
                                Score: {template.lastScore}
                              </Badge>
                            )}
                          </div>
                          {template.subject && (
                            <p className="text-sm text-muted-foreground mt-1 truncate" data-testid={`text-template-subject-${template.id}`}>
                              Subject: {template.subject}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2" data-testid={`text-template-body-${template.id}`}>
                            {template.body?.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleLoadTemplate(template)}
                            title="Load template"
                            data-testid={`button-load-template-${template.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleUpdateTemplate(template)}
                            disabled={updateMutation.isPending}
                            title="Update with current email"
                            data-testid={`button-update-template-${template.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteTemplate(template)}
                            disabled={deleteMutation.isPending}
                            title="Delete template"
                            className="text-red-500 hover:text-red-600"
                            data-testid={`button-delete-template-${template.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
