import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_LIMITS } from '@shared/schema';
import {
  Send,
  Paperclip,
  X,
  MessageCircleQuestion,
  Sparkles,
  Lock,
  ArrowRight,
  Bot,
  User,
  ImageIcon,
  Loader2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  imageMimeType?: string;
  isOnTopic?: boolean;
  timestamp: Date;
}

interface AskAcceptafyProps {
  onUpgrade?: () => void;
}

export function AskAcceptafy({ onUpgrade }: AskAcceptafyProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const userTier = (user?.subscriptionTier === 'scale' ? 'scale' : (user?.subscriptionTier === 'pro' ? 'pro' : 'starter')) as keyof typeof SUBSCRIPTION_LIMITS;
  const hasAccess = SUBSCRIPTION_LIMITS[userTier].askAcceptafy;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file (PNG, JPG, GIF, WebP)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be under 10MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setImagePreview(reader.result as string);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageMimeType(null);
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    if (isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedInput,
      image: imagePreview || undefined,
      imageMimeType: imageMimeType || undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const sentImage = imagePreview;
    const sentMimeType = imageMimeType;
    removeImage();
    setIsLoading(true);

    try {
      const body: Record<string, string> = { question: trimmedInput };
      if (sentImage) {
        body.image = sentImage.split(',')[1];
        body.mimeType = sentMimeType || 'image/png';
      }

      const response = await fetch('/api/ask-acceptafy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer || data.text || 'I apologize, I was unable to generate a response. Please try again.',
          isOnTopic: data.isOnTopic,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Something went wrong. Please try again.';

        if (response.status === 403) {
          toast({
            title: 'Upgrade Required',
            description: errorMessage,
            variant: 'default',
          });
        } else if (response.status === 429) {
          toast({
            title: 'Rate Limit Reached',
            description: errorMessage,
            variant: 'destructive',
          });
        } else {
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      }
    } catch {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Failed to connect to the server. Please check your connection and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-upgrade-title">
                Ask Acceptafy
              </h2>
              <p className="text-muted-foreground">
                Get instant answers to your email deliverability questions from our AI expert. Upload screenshots for analysis of DNS records, spam reports, and more.
              </p>
            </div>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <MessageCircleQuestion className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm text-foreground">Ask any email deliverability question</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <ImageIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm text-foreground">Upload screenshots for AI analysis</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm text-foreground">Expert guidance powered by AI</span>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              Pro & Scale Plans
            </Badge>
            {onUpgrade && (
              <Button
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
                data-testid="button-upgrade-acceptafy"
              >
                Upgrade to Unlock
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="ask-acceptafy-container">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/20">
          <MessageCircleQuestion className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground" data-testid="text-chat-title">Ask Acceptafy</h2>
          <p className="text-xs text-muted-foreground">Your AI email deliverability expert</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
              <Bot className="w-10 h-10 text-purple-500" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-semibold text-foreground" data-testid="text-welcome">How can I help?</h3>
              <p className="text-sm text-muted-foreground">
                Ask me anything about email deliverability, DNS authentication, spam filters, sender reputation, and more.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 max-w-lg w-full">
              {[
                'How do I set up DMARC for my domain?',
                'Why are my emails going to spam?',
                'What is a good sender reputation score?',
                'How do I warm up a new IP address?',
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  className="text-left h-auto py-3 px-4 text-sm justify-start"
                  onClick={() => {
                    setInput(suggestion);
                    textareaRef.current?.focus();
                  }}
                  data-testid={`button-suggestion-${suggestion.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <Sparkles className="w-3 h-3 mr-2 flex-shrink-0 text-purple-500" />
                  <span className="line-clamp-2">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            data-testid={`chat-message-${message.role}-${message.id}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center self-end">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                  : 'bg-muted/70 text-foreground border border-border/50'
              }`}
            >
              {message.image && (
                <div className="mb-2">
                  <img
                    src={message.image}
                    alt="Uploaded"
                    className="max-w-full max-h-48 rounded-lg object-contain"
                    data-testid={`img-upload-${message.id}`}
                  />
                </div>
              )}
              {message.content && (
                <div className="text-sm whitespace-pre-wrap break-words" data-testid={`text-message-${message.id}`}>
                  {message.content}
                </div>
              )}
              <div className={`text-[10px] mt-1.5 ${message.role === 'user' ? 'text-white/60' : 'text-muted-foreground'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center self-end">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start" data-testid="typing-indicator">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center self-end">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-muted/70 border border-border/50 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4 space-y-3">
        {imagePreview && (
          <div className="relative inline-block" data-testid="image-preview-container">
            <img
              src={imagePreview}
              alt="Upload preview"
              className="h-20 rounded-lg object-contain border border-border"
              data-testid="img-preview"
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
              onClick={removeImage}
              data-testid="button-remove-image"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            data-testid="input-image-upload"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            data-testid="button-attach-image"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about email deliverability..."
            className="resize-none min-h-[44px] max-h-32 flex-1"
            rows={1}
            disabled={isLoading}
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md shadow-purple-500/20"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
