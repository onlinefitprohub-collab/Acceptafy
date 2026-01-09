import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, Calendar, Eye, Loader2, BookOpen, Share2, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  viewCount: number;
  publishedAt: string | null;
}

export default function ResourceArticle() {
  const [, params] = useRoute("/resources/:slug");
  const slug = params?.slug;
  const { toast } = useToast();

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ['/api/articles/slug', slug],
    queryFn: async () => {
      const response = await fetch(`/api/articles/slug/${slug}`);
      if (!response.ok) {
        throw new Error('Article not found');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = article?.title || 'Check out this article';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied", description: "Article link copied to clipboard" });
  };

  useEffect(() => {
    if (!article) return;

    const pageTitle = article.metaTitle || article.title;
    const pageDescription = article.metaDescription || article.excerpt || `Read ${article.title} on Acceptafy Resources`;
    const pageImage = article.featuredImage || '';

    document.title = `${pageTitle} | Acceptafy Resources`;

    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMetaTag('description', pageDescription);
    setMetaTag('og:title', pageTitle, true);
    setMetaTag('og:description', pageDescription, true);
    setMetaTag('og:type', 'article', true);
    setMetaTag('og:url', shareUrl, true);
    if (pageImage) {
      setMetaTag('og:image', pageImage, true);
    }
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', pageTitle);
    setMetaTag('twitter:description', pageDescription);
    if (pageImage) {
      setMetaTag('twitter:image', pageImage);
    }

    return () => {
      document.title = 'Acceptafy - Email Marketing Optimization';
    };
  }, [article, shareUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2" data-testid="link-home">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Acceptafy</span>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-20 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/resources">Browse All Resources</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Acceptafy</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild data-testid="button-back-resources">
              <Link href="/resources">
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Resources
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <article className="max-w-3xl mx-auto">
          {article.featuredImage && (
            <div className="aspect-video mb-8 rounded-xl overflow-hidden">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags?.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl font-bold mb-4" data-testid="text-article-title">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">
                {article.excerpt}
              </p>
            )}

            <div className="flex items-center justify-between border-y py-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {article.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {article.viewCount} views
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="button-share">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Card>
            <CardContent className="p-8 md:p-12">
              <div 
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
                data-testid="article-content"
              />
            </CardContent>
          </Card>

          <div className="mt-12 p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to improve your email performance?</h3>
            <p className="text-muted-foreground mb-4">
              Get instant feedback on your email campaigns with our free grader.
            </p>
            <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <a href="/" data-testid="button-try-grader">Try the Email Grader Free</a>
            </Button>
          </div>
        </article>
      </main>

      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Acceptafy</span>
            </a>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="/contact" className="hover:text-foreground transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
