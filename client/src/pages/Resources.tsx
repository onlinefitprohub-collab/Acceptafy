import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, Search, Eye, Loader2, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  tags: string[] | null;
  viewCount: number;
  publishedAt: string | null;
}

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ['/api/articles'],
  });

  const scrollTags = (direction: 'left' | 'right') => {
    if (tagsContainerRef.current) {
      const scrollAmount = 300;
      tagsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const allTags = articles?.flatMap(a => a.tags || []).filter((tag, index, arr) => arr.indexOf(tag) === index) || [];

  const filteredArticles = articles?.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || article.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  }) || [];

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
            <Button variant="ghost" asChild data-testid="button-back">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild data-testid="button-get-started">
              <Link href="/">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
              <BookOpen className="w-8 h-8 text-purple-500" />
            </div>
            <h1 className="text-4xl font-bold mb-4" data-testid="text-resources-heading">
              Email Marketing Resources
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Expert guides, tips, and best practices to improve your email deliverability and campaign performance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-resources"
              />
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex items-center gap-2 mb-8" role="group" aria-label="Filter articles by tag">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollTags('left')}
                data-testid="button-scroll-tags-left"
                aria-label="Scroll tags left"
                className="flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div 
                ref={tagsContainerRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide py-2 flex-1"
              >
                <Button
                  variant={selectedTag === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(null)}
                  data-testid="tag-all"
                  aria-pressed={selectedTag === null}
                  className="flex-shrink-0"
                >
                  All
                </Button>
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    data-testid={`tag-${tag}`}
                    aria-pressed={selectedTag === tag}
                    className="flex-shrink-0 whitespace-nowrap"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollTags('right')}
                data-testid="button-scroll-tags-right"
                aria-label="Scroll tags right"
                className="flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold mb-2">No articles found</h2>
              <p className="text-muted-foreground">
                {searchQuery || selectedTag ? 'Try adjusting your search or filter' : 'Check back soon for new content'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredArticles.map((article) => (
                <Link key={article.id} href={`/resources/${article.slug}`}>
                  <Card 
                    className="group hover-elevate cursor-pointer transition-all duration-200"
                    data-testid={`card-article-${article.id}`}
                  >
                    <div className="flex flex-col md:flex-row">
                      {article.featuredImage && (
                        <div className="md:w-64 h-48 md:h-auto flex-shrink-0">
                          <img
                            src={article.featuredImage}
                            alt={article.title}
                            className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {article.tags?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <h2 className="text-xl font-semibold mb-2 group-hover:text-purple-500 transition-colors">
                          {article.title}
                        </h2>
                        {article.excerpt && (
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {article.viewCount} views
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-purple-500 text-sm font-medium group-hover:gap-2 transition-all">
                            Read more <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Acceptafy</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
