import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, SpellCheck, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SpellGrammarIssue {
  type: 'spelling' | 'grammar' | 'punctuation' | 'style';
  original: string;
  suggestion: string;
  explanation: string;
  position: number;
  length: number;
}

interface SpellGrammarResult {
  issues: SpellGrammarIssue[];
  correctedText: string;
  issueCount: number;
}

interface SpellGrammarCheckerProps {
  text: string;
  onApplyCorrection?: (correctedText: string) => void;
  debounceMs?: number;
  minTextLength?: number;
}

const getIssueTypeStyles = (type: SpellGrammarIssue['type']) => {
  switch (type) {
    case 'spelling':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700';
    case 'grammar':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700';
    case 'punctuation':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
    case 'style':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getIssueTypeLabel = (type: SpellGrammarIssue['type']) => {
  switch (type) {
    case 'spelling': return 'Spelling';
    case 'grammar': return 'Grammar';
    case 'punctuation': return 'Punctuation';
    case 'style': return 'Style';
    default: return 'Issue';
  }
};

export const SpellGrammarChecker: React.FC<SpellGrammarCheckerProps> = ({
  text,
  onApplyCorrection,
  debounceMs = 1500,
  minTextLength = 20,
}) => {
  const [result, setResult] = useState<SpellGrammarResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheckedText, setLastCheckedText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const checkSpellGrammar = useCallback(async (textToCheck: string) => {
    if (textToCheck.trim().length < minTextLength) {
      setResult(null);
      return;
    }

    if (textToCheck === lastCheckedText) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/spell-grammar/check', { text: textToCheck });
      const data = await response.json() as SpellGrammarResult;
      setResult(data);
      setLastCheckedText(textToCheck);
    } catch (error) {
      console.error('Spell/grammar check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lastCheckedText, minTextLength]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length >= minTextLength && text !== lastCheckedText) {
      debounceRef.current = setTimeout(() => {
        checkSpellGrammar(text);
      }, debounceMs);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [text, checkSpellGrammar, debounceMs, lastCheckedText, minTextLength]);

  const handleApplyAll = () => {
    if (result?.correctedText && onApplyCorrection) {
      onApplyCorrection(result.correctedText);
      toast({
        title: 'Corrections Applied',
        description: `Fixed ${result.issueCount} issue${result.issueCount !== 1 ? 's' : ''}`,
      });
      setResult(null);
      setLastCheckedText('');
    }
  };

  const handleCheckNow = () => {
    if (text.trim().length >= minTextLength) {
      checkSpellGrammar(text);
    }
  };

  if (!text || text.trim().length < minTextLength) {
    return null;
  }

  const hasIssues = result && result.issueCount > 0;
  const isClean = result && result.issueCount === 0;

  return (
    <Card className="border-border/50 bg-white dark:bg-card shadow-sm" data-testid="spell-grammar-checker">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${hasIssues ? 'bg-orange-100 dark:bg-orange-900/30' : isClean ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
              <SpellCheck className={`w-4 h-4 ${hasIssues ? 'text-orange-600 dark:text-orange-400' : isClean ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                Spelling & Grammar
              </CardTitle>
              <CardDescription className="text-xs">
                {isLoading ? 'Checking...' : hasIssues ? `${result.issueCount} issue${result.issueCount !== 1 ? 's' : ''} found` : isClean ? 'No issues found' : 'Real-time proofreading'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {isClean && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            {hasIssues && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleApplyAll}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  data-testid="button-apply-corrections"
                >
                  <Wand2 className="w-3 h-3 mr-1" />
                  Fix All
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  data-testid="button-toggle-spell-details"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </>
            )}
            {!isLoading && !hasIssues && !isClean && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCheckNow}
                data-testid="button-check-spelling"
              >
                <SpellCheck className="w-3 h-3 mr-1" />
                Check Now
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {hasIssues && isExpanded && (
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {result.issues.map((issue, index) => (
              <div 
                key={index} 
                className="p-3 rounded-lg border border-border/50 bg-muted/30 space-y-2"
                data-testid={`issue-item-${index}`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className={`${getIssueTypeStyles(issue.type)} text-xs`}
                  >
                    {getIssueTypeLabel(issue.type)}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-red-600 dark:text-red-400 line-through">{issue.original}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">{issue.suggestion}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-muted-foreground">{issue.explanation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
