import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from '@/components/RichTextEditor';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Search,
  Copy,
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  tags: string[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
  published: boolean;
  authorId: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function ResourcesSection() {
  const { toast } = useToast();
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [tags, setTags] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [published, setPublished] = useState(false);

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ['/api/admin/articles'],
  });

  const templateArticle = articles?.find(a => a.slug === 'seo-template-email-marketing-guide');

  const handleCopyFromTemplate = () => {
    if (templateArticle) {
      setTitle('');
      setSlug('');
      setExcerpt(templateArticle.excerpt || '');
      setContent(templateArticle.content);
      setFeaturedImage(templateArticle.featuredImage || '');
      setTags(templateArticle.tags?.join(', ') || '');
      setMetaTitle('');
      setMetaDescription('');
      setPublished(false);
      toast({ title: 'Template loaded', description: 'Article structure copied from template. Update the title and content with your own.' });
    } else {
      toast({ title: 'Template not found', description: 'The SEO template article is not available.', variant: 'destructive' });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/admin/articles', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
      toast({ title: 'Success', description: 'Article created successfully' });
      resetForm();
      setShowEditor(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create article', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest('PATCH', `/api/admin/articles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
      toast({ title: 'Success', description: 'Article updated successfully' });
      resetForm();
      setShowEditor(false);
      setEditingArticle(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update article', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
      toast({ title: 'Success', description: 'Article deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete article', variant: 'destructive' });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/articles/${id}`, { published });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update article', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setFeaturedImage('');
    setTags('');
    setMetaTitle('');
    setMetaDescription('');
    setPublished(false);
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setSlug(article.slug);
    setExcerpt(article.excerpt || '');
    setContent(article.content);
    setFeaturedImage(article.featuredImage || '');
    setTags(article.tags?.join(', ') || '');
    setMetaTitle(article.metaTitle || '');
    setMetaDescription(article.metaDescription || '');
    setPublished(article.published);
    setShowEditor(true);
  };

  const handleSubmit = () => {
    const data = {
      title,
      slug: slug || generateSlug(title),
      excerpt: excerpt || null,
      content,
      featuredImage: featuredImage || null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || null,
      published,
    };

    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredArticles = articles?.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.slug.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
          <FileText className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Resources</h2>
          <p className="text-sm text-muted-foreground">Create and manage SEO-optimized articles</p>
        </div>
      </div>

      <Card className="mb-6" data-testid="resources-management-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Article Management
              </CardTitle>
              <CardDescription>
                {articles?.length || 0} articles total, {articles?.filter(a => a.published).length || 0} published
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                resetForm();
                setEditingArticle(null);
                setShowEditor(true);
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              data-testid="button-new-article"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-articles"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No articles found</p>
              <p className="text-sm">Create your first article to improve SEO rankings</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article.id} data-testid={`row-article-${article.id}`}>
                      <TableCell>
                        <div className="font-medium">{article.title}</div>
                        <div className="text-sm text-muted-foreground">/resources/{article.slug}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={article.published}
                            onCheckedChange={(checked) => togglePublishMutation.mutate({ id: article.id, published: checked })}
                            data-testid={`switch-publish-${article.id}`}
                          />
                          <Badge variant={article.published ? 'default' : 'secondary'}>
                            {article.published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{article.viewCount}</TableCell>
                      <TableCell>
                        {format(new Date(article.updatedAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {article.published && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              data-testid={`button-view-${article.id}`}
                            >
                              <a href={`/resources/${article.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(article)}
                            data-testid={`button-edit-${article.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this article?')) {
                                deleteMutation.mutate(article.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${article.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</DialogTitle>
              {!editingArticle && templateArticle && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyFromTemplate}
                  className="gap-2"
                  data-testid="button-copy-template"
                >
                  <Copy className="h-4 w-4" />
                  Copy from Template
                </Button>
              )}
            </div>
            <DialogDescription>
              {editingArticle ? 'Update the article content and settings' : 'Create a new SEO-optimized article for your resources section'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Article title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingArticle && !slug) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                  data-testid="input-article-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  placeholder="article-url-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  data-testid="input-article-slug"
                />
                <p className="text-xs text-muted-foreground">/resources/{slug || 'your-slug'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (Short Summary)</Label>
              <Textarea
                id="excerpt"
                placeholder="Brief description for listings and SEO..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                data-testid="input-article-excerpt"
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your article content..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  placeholder="https://example.com/image.jpg"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  data-testid="input-article-image"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="email marketing, deliverability, tips"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  data-testid="input-article-tags"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">SEO Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    placeholder="SEO title (defaults to article title)"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    data-testid="input-article-meta-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Input
                    id="metaDescription"
                    placeholder="SEO description (defaults to excerpt)"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    data-testid="input-article-meta-description"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Switch
                id="published"
                checked={published}
                onCheckedChange={setPublished}
                data-testid="switch-article-published"
              />
              <div>
                <Label htmlFor="published" className="font-medium">
                  {published ? 'Published' : 'Save as Draft'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {published ? 'Article is visible to the public' : 'Only visible to admins'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)} data-testid="button-cancel-article">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!title || !content || createMutation.isPending || updateMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              data-testid="button-save-article"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingArticle ? 'Update Article' : 'Create Article'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
