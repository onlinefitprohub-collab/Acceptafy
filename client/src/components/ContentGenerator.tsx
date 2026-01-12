import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Sparkles, 
  Undo2, 
  Redo2, 
  Save, 
  FileText, 
  Mail, 
  Share2, 
  BookOpen, 
  Megaphone,
  Trash2,
  Copy,
  Loader2,
  Lightbulb,
  FolderOpen
} from "lucide-react";
import type { ContentDraft } from "@shared/schema";

type ContentType = 'email' | 'social' | 'blog' | 'ad';
type ToneType = 'professional' | 'casual' | 'friendly' | 'urgent' | 'persuasive' | 'informative';
type LengthType = 'short' | 'medium' | 'long';

interface HistoryState {
  content: string;
  timestamp: number;
}

interface GeneratedResult {
  subject?: string;
  previewText?: string;
  body: string;
  suggestions: string[];
}

const CONTENT_TYPES: { value: ContentType; label: string; icon: typeof Mail }[] = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'social', label: 'Social Post', icon: Share2 },
  { value: 'blog', label: 'Blog Post', icon: BookOpen },
  { value: 'ad', label: 'Ad Copy', icon: Megaphone },
];

const TONES: { value: ToneType; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'informative', label: 'Informative' },
];

const LENGTHS: { value: LengthType; label: string }[] = [
  { value: 'short', label: 'Short (50-100 words)' },
  { value: 'medium', label: 'Medium (150-300 words)' },
  { value: 'long', label: 'Long (400-600 words)' },
];

const MAX_HISTORY = 50;

export default function ContentGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [contentType, setContentType] = useState<ContentType>('email');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<ToneType>('professional');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [length, setLength] = useState<LengthType>('medium');

  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [draftName, setDraftName] = useState('');
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'drafts'>('generate');

  const { data: drafts = [], isLoading: draftsLoading } = useQuery<ContentDraft[]>({
    queryKey: ['/api/content/drafts'],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/content/generate', {
        contentType,
        prompt,
        tone,
        industry: industry || undefined,
        targetAudience: targetAudience || undefined,
        length,
      });
      return res.json();
    },
    onSuccess: (data: GeneratedResult) => {
      setGeneratedResult(data);
      setEditedContent(data.body);
      addToHistory(data.body);
      toast({
        title: "Content Generated",
        description: "Your AI-powered content is ready to edit!",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Unable to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: draftName || `${contentType} draft - ${new Date().toLocaleDateString()}`,
        contentType,
        prompt,
        generatedContent: generatedResult?.body || '',
        editedContent,
        tone,
        industry: industry || undefined,
      };
      
      if (selectedDraftId) {
        const res = await apiRequest('PUT', `/api/content/drafts/${selectedDraftId}`, data);
        return res.json();
      } else {
        const res = await apiRequest('POST', '/api/content/drafts', data);
        return res.json();
      }
    },
    onSuccess: (data) => {
      setSelectedDraftId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/content/drafts'] });
      toast({
        title: "Draft Saved",
        description: "Your content draft has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Unable to save draft. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteDraftMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/content/drafts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content/drafts'] });
      if (selectedDraftId) {
        setSelectedDraftId(null);
        setEditedContent('');
        setGeneratedResult(null);
      }
      toast({
        title: "Draft Deleted",
        description: "Draft has been removed.",
      });
    },
  });

  const addToHistory = useCallback((content: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ content, timestamp: Date.now() });
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const handleContentChange = useCallback((value: string) => {
    setEditedContent(value);
  }, []);

  const handleContentBlur = useCallback(() => {
    if (editedContent && editedContent !== history[historyIndex]?.content) {
      addToHistory(editedContent);
    }
  }, [editedContent, history, historyIndex, addToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditedContent(history[newIndex].content);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditedContent(history[newIndex].content);
    }
  }, [history, historyIndex]);

  const handleCopyContent = useCallback(() => {
    const fullContent = generatedResult?.subject 
      ? `Subject: ${generatedResult.subject}\n\n${editedContent}`
      : editedContent;
    navigator.clipboard.writeText(fullContent);
    toast({
      title: "Copied",
      description: "Content copied to clipboard.",
    });
  }, [editedContent, generatedResult, toast]);

  const loadDraft = useCallback((draft: ContentDraft) => {
    setSelectedDraftId(draft.id);
    setDraftName(draft.name);
    setContentType(draft.contentType as ContentType);
    setPrompt(draft.prompt || '');
    setTone((draft.tone as ToneType) || 'professional');
    setIndustry(draft.industry || '');
    setEditedContent(draft.editedContent || draft.generatedContent || '');
    if (draft.generatedContent) {
      setGeneratedResult({ body: draft.generatedContent, suggestions: [] });
    }
    setHistory([{ content: draft.editedContent || draft.generatedContent || '', timestamp: Date.now() }]);
    setHistoryIndex(0);
    setActiveTab('generate');
    toast({
      title: "Draft Loaded",
      description: `Loaded: ${draft.name}`,
    });
  }, [toast]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Acceptafy Content Generator</h2>
        <p className="text-muted-foreground">AI-powered content creation with undo/redo and draft saving</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'generate' | 'drafts')}>
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="drafts" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Drafts ({drafts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Content Settings
                </CardTitle>
                <CardDescription>Configure your content parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Content Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONTENT_TYPES.map((type) => (
                      <Button
                        key={type.value}
                        variant={contentType === type.value ? "default" : "outline"}
                        className={`justify-start gap-2 ${contentType === type.value ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                        onClick={() => setContentType(type.value)}
                        data-testid={`btn-content-type-${type.value}`}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Describe what you want to create</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A welcome email for new subscribers to our fitness newsletter..."
                    rows={4}
                    data-testid="input-content-prompt"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Tone</label>
                    <Select value={tone} onValueChange={(v) => setTone(v as ToneType)}>
                      <SelectTrigger data-testid="select-tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Length</label>
                    <Select value={length} onValueChange={(v) => setLength(v as LengthType)}>
                      <SelectTrigger data-testid="select-length">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LENGTHS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Industry (optional)</label>
                  <Input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., SaaS, E-commerce, Healthcare..."
                    data-testid="input-industry"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Target Audience (optional)</label>
                  <Input
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., Marketing managers, Small business owners..."
                    data-testid="input-audience"
                  />
                </div>

                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending || prompt.trim().length < 10}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  data-testid="btn-generate-content"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-500" />
                      Generated Content
                    </CardTitle>
                    <CardDescription>Edit and refine your content</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleUndo}
                      disabled={!canUndo}
                      title="Undo (Ctrl+Z)"
                      data-testid="btn-undo"
                    >
                      <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRedo}
                      disabled={!canRedo}
                      title="Redo (Ctrl+Y)"
                      data-testid="btn-redo"
                    >
                      <Redo2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyContent}
                      disabled={!editedContent}
                      title="Copy to clipboard"
                      data-testid="btn-copy"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {contentType === 'email' && generatedResult?.subject && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Subject Line</label>
                    <div className="p-2 rounded-md bg-muted/50 border border-border text-foreground">
                      {generatedResult.subject}
                    </div>
                  </div>
                )}

                {contentType === 'email' && generatedResult?.previewText && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Preview Text</label>
                    <div className="p-2 rounded-md bg-muted/50 border border-border text-sm text-muted-foreground">
                      {generatedResult.previewText}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Content Body
                    {history.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (History: {historyIndex + 1}/{history.length})
                      </span>
                    )}
                  </label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onBlur={handleContentBlur}
                    placeholder="Your generated content will appear here..."
                    rows={12}
                    className="font-mono text-sm"
                    data-testid="textarea-content"
                  />
                </div>

                {generatedResult?.suggestions && generatedResult.suggestions.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-foreground">AI Suggestions</span>
                    </div>
                    <ul className="space-y-1">
                      {generatedResult.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-xs text-muted-foreground mt-0.5">{i + 1}.</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Draft name..."
                    className="flex-1"
                    data-testid="input-draft-name"
                  />
                  <Button
                    onClick={() => saveDraftMutation.mutate()}
                    disabled={saveDraftMutation.isPending || !editedContent}
                    data-testid="btn-save-draft"
                  >
                    {saveDraftMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {selectedDraftId ? 'Update Draft' : 'Save Draft'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Drafts</CardTitle>
              <CardDescription>Your content drafts are saved here</CardDescription>
            </CardHeader>
            <CardContent>
              {draftsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : drafts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No drafts saved yet.</p>
                  <p className="text-sm">Generate content and save it as a draft.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer hover-elevate ${
                        selectedDraftId === draft.id 
                          ? 'border-purple-500 bg-purple-500/10' 
                          : 'border-border bg-card'
                      }`}
                      onClick={() => loadDraft(draft)}
                      data-testid={`draft-${draft.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{draft.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{draft.contentType}</Badge>
                            {draft.tone && <Badge variant="outline">{draft.tone}</Badge>}
                            <span className="text-xs text-muted-foreground">
                              {draft.updatedAt && new Date(draft.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDraftMutation.mutate(draft.id);
                          }}
                          data-testid={`btn-delete-draft-${draft.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      {draft.editedContent && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {draft.editedContent}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
