import { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Wand2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Target,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GradingResult, SpamTrigger, StructuralFinding, AccessibilityFinding, LinkAnalysisFinding } from '../types';

interface PriorityIssue {
  id: string;
  priority: number;
  severity: 'High' | 'Medium' | 'Low';
  category: string;
  issue: string;
  description: string;
  suggestion: string;
  actionType: 'quickfix' | 'rewrite' | 'manual';
  originalText?: string;
  replacement?: string;
}

interface PriorityIssuesProps {
  result: GradingResult;
  onApplyFix?: (issue: PriorityIssue) => void;
  onRequestRewrite?: (category: string) => void;
}

const severityConfig = {
  High: { 
    color: 'bg-red-500/10 text-red-500 border-red-500/20', 
    icon: AlertCircle,
    priority: 1 
  },
  Medium: { 
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', 
    icon: AlertTriangle,
    priority: 2 
  },
  Low: { 
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', 
    icon: Target,
    priority: 3 
  }
};

export function PriorityIssues({ result, onApplyFix, onRequestRewrite }: PriorityIssuesProps) {
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [showAll, setShowAll] = useState(false);

  const issues = useMemo(() => {
    const allIssues: PriorityIssue[] = [];
    let idCounter = 0;

    result.spamAnalysis?.forEach((spam: SpamTrigger) => {
      allIssues.push({
        id: `spam-${idCounter++}`,
        priority: spam.severity === 'High' ? 1 : spam.severity === 'Medium' ? 2 : 3,
        severity: spam.severity,
        category: 'Spam Triggers',
        issue: `Spam trigger word: "${spam.word}"`,
        description: spam.reason,
        suggestion: spam.suggestion || spam.suggestions?.[0] || 'Remove or rephrase this word',
        actionType: 'quickfix',
        originalText: spam.word,
        replacement: spam.rephraseExamples?.[0] || ''
      });
    });

    result.structuralAnalysis?.forEach((finding: StructuralFinding) => {
      allIssues.push({
        id: `structural-${idCounter++}`,
        priority: finding.severity === 'High' ? 1 : finding.severity === 'Medium' ? 2 : 3,
        severity: finding.severity,
        category: finding.type,
        issue: finding.summary,
        description: finding.feedback,
        suggestion: finding.suggestion,
        actionType: 'manual',
        originalText: finding.originalText
      });
    });

    result.accessibilityAnalysis?.forEach((finding: AccessibilityFinding) => {
      allIssues.push({
        id: `accessibility-${idCounter++}`,
        priority: finding.severity === 'High' ? 1 : finding.severity === 'Medium' ? 2 : 3,
        severity: finding.severity,
        category: `Accessibility: ${finding.type}`,
        issue: finding.summary,
        description: finding.summary,
        suggestion: finding.suggestion,
        actionType: 'manual'
      });
    });

    result.linkAnalysis?.filter((link: LinkAnalysisFinding) => link.status !== 'Good').forEach((link: LinkAnalysisFinding) => {
      allIssues.push({
        id: `link-${idCounter++}`,
        priority: link.status === 'Bad' ? 1 : 2,
        severity: link.status === 'Bad' ? 'High' : 'Medium',
        category: 'Links',
        issue: `Link issue: ${link.anchorText || link.url}`,
        description: link.reason,
        suggestion: link.suggestion,
        actionType: 'manual',
        originalText: link.url
      });
    });

    const sections = [
      { data: result.subjectLine, name: 'Subject Line' },
      { data: result.previewText, name: 'Preview Text' },
      { data: result.bodyCopy, name: 'Body Copy' },
      { data: result.callToAction, name: 'Call to Action' }
    ];

    sections.forEach(section => {
      const grade = section.data?.grade?.toUpperCase() || '';
      if (grade.startsWith('C') || grade.startsWith('D') || grade.startsWith('F')) {
        section.data?.feedback?.forEach((fb: string) => {
          allIssues.push({
            id: `section-${idCounter++}`,
            priority: grade.startsWith('F') ? 1 : grade.startsWith('D') ? 2 : 3,
            severity: grade.startsWith('F') ? 'High' : grade.startsWith('D') ? 'High' : 'Medium',
            category: section.name,
            issue: fb,
            description: fb,
            suggestion: `Consider using the AI Rewrite tool to improve your ${section.name.toLowerCase()}`,
            actionType: 'rewrite'
          });
        });
      }
    });

    return allIssues.sort((a, b) => a.priority - b.priority);
  }, [result]);

  const filteredIssues = useMemo(() => {
    if (filter === 'all') return issues;
    return issues.filter(issue => issue.severity === filter);
  }, [issues, filter]);

  const displayedIssues = showAll ? filteredIssues : filteredIssues.slice(0, 5);

  const toggleExpand = (id: string) => {
    setExpandedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const issueStats = useMemo(() => ({
    high: issues.filter(i => i.severity === 'High').length,
    medium: issues.filter(i => i.severity === 'Medium').length,
    low: issues.filter(i => i.severity === 'Low').length,
    total: issues.length
  }), [issues]);

  if (issues.length === 0) {
    return (
      <Card className="border-green-500/30 bg-green-500/5" data-testid="priority-issues-empty">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">No Critical Issues Found</h3>
              <p className="text-sm text-muted-foreground">Your email is looking good! Keep up the great work.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="priority-issues">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Priority Fixes</CardTitle>
            <Badge variant="secondary" className="ml-2">{issueStats.total} issues</Badge>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-sm">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </div>
            <Button 
              size="sm" 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              data-testid="filter-all"
            >
              All
            </Button>
            {issueStats.high > 0 && (
              <Button 
                size="sm" 
                variant={filter === 'High' ? 'default' : 'outline'}
                onClick={() => setFilter('High')}
                className={filter === 'High' ? '' : 'border-red-500/30 text-red-500'}
                data-testid="filter-high"
              >
                High ({issueStats.high})
              </Button>
            )}
            {issueStats.medium > 0 && (
              <Button 
                size="sm" 
                variant={filter === 'Medium' ? 'default' : 'outline'}
                onClick={() => setFilter('Medium')}
                className={filter === 'Medium' ? '' : 'border-yellow-500/30 text-yellow-500'}
                data-testid="filter-medium"
              >
                Medium ({issueStats.medium})
              </Button>
            )}
            {issueStats.low > 0 && (
              <Button 
                size="sm" 
                variant={filter === 'Low' ? 'default' : 'outline'}
                onClick={() => setFilter('Low')}
                className={filter === 'Low' ? '' : 'border-blue-500/30 text-blue-500'}
                data-testid="filter-low"
              >
                Low ({issueStats.low})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {displayedIssues.map((issue) => {
          const config = severityConfig[issue.severity];
          const Icon = config.icon;
          const isExpanded = expandedIssues.has(issue.id);
          
          return (
            <Collapsible 
              key={issue.id} 
              open={isExpanded} 
              onOpenChange={() => toggleExpand(issue.id)}
            >
              <div 
                className={`rounded-lg border ${config.color} p-3 transition-all`}
                data-testid={`issue-card-${issue.id}`}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 text-left">
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${config.color}`}
                          >
                            {issue.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {issue.category}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mt-1 line-clamp-2">
                          {issue.issue}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {issue.actionType === 'quickfix' && (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          <Zap className="w-3 h-3 mr-1" />
                          Quick Fix
                        </Badge>
                      )}
                      {issue.actionType === 'rewrite' && (
                        <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                          <Wand2 className="w-3 h-3 mr-1" />
                          AI Rewrite
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-3 border-t border-current/10 mt-3">
                  <div className="space-y-3">
                    {issue.description !== issue.issue && (
                      <p className="text-sm text-muted-foreground">
                        {issue.description}
                      </p>
                    )}
                    
                    {issue.originalText && (
                      <div className="p-2 rounded bg-background/50 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Original:</p>
                        <p className="text-sm font-mono text-foreground">"{issue.originalText}"</p>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{issue.suggestion}</p>
                        
                        {issue.replacement && (
                          <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs text-green-500 mb-0.5">Suggested replacement:</p>
                              <p className="text-sm font-medium text-foreground">"{issue.replacement}"</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(issue.replacement!, issue.id);
                              }}
                              data-testid={`copy-fix-${issue.id}`}
                            >
                              {copiedId === issue.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      {issue.actionType === 'quickfix' && issue.replacement && onApplyFix && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyFix(issue);
                          }}
                          className="bg-green-500 hover:bg-green-600"
                          data-testid={`apply-fix-${issue.id}`}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Apply Fix
                        </Button>
                      )}
                      {issue.actionType === 'rewrite' && onRequestRewrite && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestRewrite(issue.category);
                          }}
                          className="border-purple-500/30 text-purple-500"
                          data-testid={`rewrite-${issue.id}`}
                        >
                          <Wand2 className="w-3 h-3 mr-1" />
                          Use AI Rewrite
                        </Button>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
        
        {filteredIssues.length > 5 && (
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="w-full"
            data-testid="toggle-show-all"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show All ({filteredIssues.length - 5} more)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
