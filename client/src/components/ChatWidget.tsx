import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'chat' | 'system';
  clientId: string;
  name: string;
  message: string;
  timestamp: string;
  isSupport?: boolean;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'system') {
          setClientId(data.clientId);
          setMessages(prev => [...prev, {
            id: `msg_${Date.now()}`,
            type: 'system',
            clientId: 'system',
            name: 'System',
            message: data.message,
            timestamp: data.timestamp
          }]);
        } else if (data.type === 'chat') {
          // Don't duplicate own messages
          if (data.clientId !== clientId || data.isSupport) {
            setMessages(prev => [...prev, {
              id: `msg_${Date.now()}_${Math.random()}`,
              type: 'chat',
              clientId: data.clientId,
              name: data.name,
              message: data.message,
              timestamp: data.timestamp,
              isSupport: data.isSupport
            }]);
          }
          if (data.isSupport) {
            setIsTyping(false);
          }
        } else if (data.type === 'typing') {
          if (data.isTyping) {
            setIsTyping(true);
          } else {
            setIsTyping(false);
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (isOpen) {
          connectWebSocket();
        }
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    wsRef.current = socket;
  }, [isOpen, clientId]);

  useEffect(() => {
    if (isOpen && !wsRef.current) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen, connectWebSocket]);

  const sendMessage = () => {
    if (!inputValue.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const messageContent = inputValue.trim();
    
    // Add own message immediately
    setMessages(prev => [...prev, {
      id: `msg_${Date.now()}`,
      type: 'chat',
      clientId: clientId || 'self',
      name: 'You',
      message: messageContent,
      timestamp: new Date().toISOString()
    }]);

    wsRef.current.send(JSON.stringify({
      type: 'chat',
      content: messageContent
    }));

    setInputValue('');
    
    // Show typing indicator after sending
    setTimeout(() => setIsTyping(true), 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    // Send typing indicator
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping: true
      }));
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'typing',
            isTyping: false
          }));
        }
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
          data-testid="button-open-chat"
          aria-label="Open chat support"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Chat
        </Button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          size="lg"
          className="rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
          data-testid="button-expand-chat"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          <span>Chat Support</span>
          {messages.filter(m => m.isSupport).length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {messages.filter(m => m.isSupport).length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] flex flex-col shadow-2xl z-50 overflow-hidden" data-testid="chat-widget">
      <div className="flex items-center justify-between p-4 bg-purple-600 text-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-sm">Chat Support</h3>
            <p className="text-xs text-purple-200">
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="text-white hover:bg-purple-500"
            data-testid="button-minimize-chat"
            aria-label="Minimize chat"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
              }
            }}
            className="text-white hover:bg-purple-500"
            data-testid="button-close-chat"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.type === 'system' 
                  ? 'items-center' 
                  : msg.isSupport 
                    ? 'items-start' 
                    : 'items-end'
              }`}
            >
              {msg.type === 'system' ? (
                <div className="bg-muted text-muted-foreground text-xs px-3 py-2 rounded-full max-w-[90%] text-center">
                  {msg.message}
                </div>
              ) : (
                <div className={`max-w-[85%] ${msg.isSupport ? 'order-1' : 'order-1'}`}>
                  {msg.isSupport && (
                    <span className="text-xs text-muted-foreground mb-1 block">{msg.name}</span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      msg.isSupport
                        ? 'bg-muted text-foreground rounded-tl-none'
                        : 'bg-purple-600 text-white rounded-tr-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start">
              <div className="bg-muted rounded-lg px-4 py-2 rounded-tl-none">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={!isConnected}
            data-testid="input-chat-message"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || !isConnected}
            size="icon"
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-send-message"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
