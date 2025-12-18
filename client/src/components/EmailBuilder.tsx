import { useState, useCallback, type DragEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EmailTemplateLibrary, type EmailTemplateData } from './EmailTemplateLibrary';
import { 
  Type, 
  Image, 
  MousePointer, 
  Minus, 
  GripVertical, 
  Trash2, 
  Plus,
  ArrowUp,
  ArrowDown,
  Copy,
  Eye,
  Code,
  Mail,
  Columns,
  List,
  Quote,
  LayoutTemplate,
  Sparkles
} from 'lucide-react';

type BlockType = 'text' | 'heading' | 'image' | 'button' | 'divider' | 'spacer' | 'columns' | 'list' | 'quote';

interface EmailBlock {
  id: string;
  type: BlockType;
  content: Record<string, string>;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: typeof Type; description: string }[] = [
  { type: 'heading', label: 'Heading', icon: Type, description: 'Add a title or section header' },
  { type: 'text', label: 'Text', icon: Type, description: 'Add paragraph text' },
  { type: 'image', label: 'Image', icon: Image, description: 'Add an image with URL' },
  { type: 'button', label: 'Button', icon: MousePointer, description: 'Add a call-to-action button' },
  { type: 'divider', label: 'Divider', icon: Minus, description: 'Add a horizontal line' },
  { type: 'spacer', label: 'Spacer', icon: Minus, description: 'Add vertical space' },
  { type: 'columns', label: '2 Columns', icon: Columns, description: 'Add two-column layout' },
  { type: 'list', label: 'List', icon: List, description: 'Add a bullet list' },
  { type: 'quote', label: 'Quote', icon: Quote, description: 'Add a blockquote' },
];

const DEFAULT_CONTENT: Record<BlockType, Record<string, string>> = {
  heading: { text: 'Your Heading Here', size: 'h2' },
  text: { text: 'Enter your paragraph text here. You can write multiple lines of content that will be displayed in your email.' },
  image: { url: '', alt: 'Image description', width: '100%' },
  button: { text: 'Click Here', url: '#', color: '#9333ea', textColor: '#ffffff' },
  divider: { style: 'solid', color: '#e5e7eb' },
  spacer: { height: '20' },
  columns: { left: 'Left column content', right: 'Right column content' },
  list: { items: 'First item\nSecond item\nThird item' },
  quote: { text: 'Your quote here', author: 'Author Name' },
};

function generateId() {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

interface BlockEditorProps {
  block: EmailBlock;
  onUpdate: (id: string, content: Record<string, string>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, targetId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

function BlockEditor({ block, onUpdate, onDelete, onMoveUp, onMoveDown, onDuplicate, isFirst, isLast, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isDragOver }: BlockEditorProps) {
  const updateField = (field: string, value: string) => {
    onUpdate(block.id, { ...block.content, [field]: value });
  };

  const renderEditor = () => {
    switch (block.type) {
      case 'heading':
        return (
          <div className="space-y-2">
            <Input
              value={block.content.text}
              onChange={(e) => updateField('text', e.target.value)}
              placeholder="Heading text"
              className="font-semibold"
              data-testid={`input-heading-${block.id}`}
            />
            <select 
              value={block.content.size} 
              onChange={(e) => updateField('size', e.target.value)}
              className="w-full p-2 rounded-md border border-border bg-background text-sm"
            >
              <option value="h1">Large (H1)</option>
              <option value="h2">Medium (H2)</option>
              <option value="h3">Small (H3)</option>
            </select>
          </div>
        );
      case 'text':
        return (
          <Textarea
            value={block.content.text}
            onChange={(e) => updateField('text', e.target.value)}
            placeholder="Enter your text content..."
            rows={4}
            data-testid={`textarea-text-${block.id}`}
          />
        );
      case 'image':
        return (
          <div className="space-y-2">
            <Input
              value={block.content.url}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="Image URL (https://...)"
              data-testid={`input-image-url-${block.id}`}
            />
            <Input
              value={block.content.alt}
              onChange={(e) => updateField('alt', e.target.value)}
              placeholder="Alt text (for accessibility)"
            />
            <Input
              value={block.content.width}
              onChange={(e) => updateField('width', e.target.value)}
              placeholder="Width (e.g., 100%, 300px)"
            />
          </div>
        );
      case 'button':
        return (
          <div className="space-y-2">
            <Input
              value={block.content.text}
              onChange={(e) => updateField('text', e.target.value)}
              placeholder="Button text"
              data-testid={`input-button-text-${block.id}`}
            />
            <Input
              value={block.content.url}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="Button URL"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Button Color</label>
                <Input
                  type="color"
                  value={block.content.color}
                  onChange={(e) => updateField('color', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Text Color</label>
                <Input
                  type="color"
                  value={block.content.textColor}
                  onChange={(e) => updateField('textColor', e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        );
      case 'divider':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Style:</span>
            <select 
              value={block.content.style} 
              onChange={(e) => updateField('style', e.target.value)}
              className="p-2 rounded-md border border-border bg-background text-sm"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
            <Input
              type="color"
              value={block.content.color}
              onChange={(e) => updateField('color', e.target.value)}
              className="w-16 h-8"
            />
          </div>
        );
      case 'spacer':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Height:</span>
            <Input
              type="number"
              value={block.content.height}
              onChange={(e) => updateField('height', e.target.value)}
              className="w-24"
              min="5"
              max="100"
            />
            <span className="text-sm text-muted-foreground">px</span>
          </div>
        );
      case 'columns':
        return (
          <div className="grid grid-cols-2 gap-2">
            <Textarea
              value={block.content.left}
              onChange={(e) => updateField('left', e.target.value)}
              placeholder="Left column content"
              rows={3}
            />
            <Textarea
              value={block.content.right}
              onChange={(e) => updateField('right', e.target.value)}
              placeholder="Right column content"
              rows={3}
            />
          </div>
        );
      case 'list':
        return (
          <Textarea
            value={block.content.items}
            onChange={(e) => updateField('items', e.target.value)}
            placeholder="One item per line"
            rows={4}
          />
        );
      case 'quote':
        return (
          <div className="space-y-2">
            <Textarea
              value={block.content.text}
              onChange={(e) => updateField('text', e.target.value)}
              placeholder="Quote text"
              rows={2}
            />
            <Input
              value={block.content.author}
              onChange={(e) => updateField('author', e.target.value)}
              placeholder="Author (optional)"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const blockInfo = BLOCK_TYPES.find(b => b.type === block.type);
  const Icon = blockInfo?.icon || Type;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, block.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, block.id)}
      onDragEnd={onDragEnd}
      className={`transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : ''} ${isDragOver ? 'border-t-2 border-purple-500 pt-2' : ''}`}
    >
      <Card className="border-border" data-testid={`block-editor-${block.id}`}>
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
          <Icon className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">{blockInfo?.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveUp(block.id)}
            disabled={isFirst}
            aria-label="Move block up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveDown(block.id)}
            disabled={isLast}
            aria-label="Move block down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(block.id)}
            aria-label="Duplicate block"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(block.id)}
            className="text-destructive hover:text-destructive"
            aria-label="Delete block"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
        <CardContent className="p-3">
          {renderEditor()}
        </CardContent>
      </Card>
    </div>
  );
}

function EmailPreview({ blocks }: { blocks: EmailBlock[] }) {
  const renderBlock = (block: EmailBlock) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = block.content.size as 'h1' | 'h2' | 'h3';
        const headingSizes = { h1: 'text-2xl', h2: 'text-xl', h3: 'text-lg' };
        return (
          <HeadingTag className={`font-bold ${headingSizes[HeadingTag]} text-foreground`}>
            {block.content.text}
          </HeadingTag>
        );
      case 'text':
        return <p className="text-foreground whitespace-pre-wrap">{block.content.text}</p>;
      case 'image':
        return block.content.url ? (
          <img 
            src={block.content.url} 
            alt={block.content.alt} 
            style={{ width: block.content.width }}
            className="max-w-full rounded"
          />
        ) : (
          <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">
            <Image className="h-8 w-8" />
          </div>
        );
      case 'button':
        return (
          <a
            href={block.content.url}
            style={{ backgroundColor: block.content.color, color: block.content.textColor }}
            className="inline-block px-6 py-3 rounded-md font-semibold text-center"
          >
            {block.content.text}
          </a>
        );
      case 'divider':
        return (
          <hr 
            style={{ borderStyle: block.content.style, borderColor: block.content.color }}
            className="my-2"
          />
        );
      case 'spacer':
        return <div style={{ height: `${block.content.height}px` }} />;
      case 'columns':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-foreground">{block.content.left}</div>
            <div className="text-foreground">{block.content.right}</div>
          </div>
        );
      case 'list':
        return (
          <ul className="list-disc list-inside text-foreground space-y-1">
            {block.content.items.split('\n').filter(Boolean).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
      case 'quote':
        return (
          <blockquote className="border-l-4 border-purple-500 pl-4 italic text-muted-foreground">
            <p>"{block.content.text}"</p>
            {block.content.author && (
              <footer className="text-sm mt-2">— {block.content.author}</footer>
            )}
          </blockquote>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 p-6 bg-white dark:bg-slate-900 rounded-lg border border-border min-h-[400px]">
      {blocks.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Add blocks to build your email</p>
        </div>
      ) : (
        blocks.map((block) => (
          <div key={block.id}>{renderBlock(block)}</div>
        ))
      )}
    </div>
  );
}

function parseTemplateToBlocks(template: EmailTemplateData): EmailBlock[] {
  const blocks: EmailBlock[] = [];
  const body = template.body;
  const lines = body.split('\n');
  let currentText = '';
  let listItems: string[] = [];
  let inList = false;
  
  const flushText = () => {
    if (currentText.trim()) {
      blocks.push({
        id: generateId(),
        type: 'text',
        content: { text: currentText.trim() },
      });
      currentText = '';
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({
        id: generateId(),
        type: 'list',
        content: { items: listItems.join('\n') },
      });
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('# ')) {
      flushText();
      flushList();
      blocks.push({
        id: generateId(),
        type: 'heading',
        content: { text: line.slice(2), size: 'h1' },
      });
    } else if (line.startsWith('## ')) {
      flushText();
      flushList();
      blocks.push({
        id: generateId(),
        type: 'heading',
        content: { text: line.slice(3), size: 'h2' },
      });
    } else if (line.startsWith('### ')) {
      flushText();
      flushList();
      blocks.push({
        id: generateId(),
        type: 'heading',
        content: { text: line.slice(4), size: 'h3' },
      });
    } else if (line === '---') {
      flushText();
      flushList();
      blocks.push({
        id: generateId(),
        type: 'divider',
        content: { style: 'solid', color: '#e5e7eb' },
      });
    } else if (line.startsWith('> ')) {
      flushText();
      flushList();
      blocks.push({
        id: generateId(),
        type: 'quote',
        content: { text: line.slice(2), author: '' },
      });
    } else if (line.match(/^\[.+→\]$/)) {
      flushText();
      flushList();
      const buttonText = line.slice(1, -1).replace(' →', '').trim();
      blocks.push({
        id: generateId(),
        type: 'button',
        content: { text: buttonText, url: '#', color: '#9333ea', textColor: '#ffffff' },
      });
    } else if (line.match(/^[-*•]\s+/)) {
      flushText();
      inList = true;
      const itemText = line.replace(/^[-*•]\s+/, '');
      listItems.push(itemText);
    } else if (line.match(/^\d+\.\s+/)) {
      flushText();
      inList = true;
      const itemText = line.replace(/^\d+\.\s+/, '');
      listItems.push(itemText);
    } else {
      if (inList) {
        flushList();
      }
      currentText += line + '\n';
    }
  }
  
  flushText();
  flushList();
  return blocks;
}

export function EmailBuilder() {
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

  const handleSelectTemplate = useCallback((template: EmailTemplateData) => {
    const newBlocks = parseTemplateToBlocks(template);
    setBlocks(newBlocks);
    setShowTemplates(false);
  }, []);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedBlockId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((id: string) => {
    if (draggedBlockId && id !== draggedBlockId) {
      setDragOverBlockId(id);
    }
  }, [draggedBlockId]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetId) return;

    setBlocks(prev => {
      const dragIndex = prev.findIndex(b => b.id === draggedBlockId);
      const dropIndex = prev.findIndex(b => b.id === targetId);
      if (dragIndex < 0 || dropIndex < 0) return prev;

      const newBlocks = [...prev];
      const [draggedBlock] = newBlocks.splice(dragIndex, 1);
      const adjustedIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
      newBlocks.splice(adjustedIndex, 0, draggedBlock);
      return newBlocks;
    });

    setDraggedBlockId(null);
    setDragOverBlockId(null);
  }, [draggedBlockId]);

  const handleDropAtEnd = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedBlockId) return;

    setBlocks(prev => {
      const dragIndex = prev.findIndex(b => b.id === draggedBlockId);
      if (dragIndex < 0) return prev;

      const newBlocks = [...prev];
      const [draggedBlock] = newBlocks.splice(dragIndex, 1);
      newBlocks.push(draggedBlock);
      return newBlocks;
    });

    setDraggedBlockId(null);
    setDragOverBlockId(null);
  }, [draggedBlockId]);

  const handleDragEnterEnd = useCallback(() => {
    if (draggedBlockId) {
      setDragOverBlockId('__end__');
    }
  }, [draggedBlockId]);

  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  }, []);

  const addBlock = useCallback((type: BlockType) => {
    const newBlock: EmailBlock = {
      id: generateId(),
      type,
      content: { ...DEFAULT_CONTENT[type] }
    };
    setBlocks(prev => [...prev, newBlock]);
  }, []);

  const updateBlock = useCallback((id: string, content: Record<string, string>) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
  }, []);

  const moveBlockUp = useCallback((id: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index <= 0) return prev;
      const newBlocks = [...prev];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      return newBlocks;
    });
  }, []);

  const moveBlockDown = useCallback((id: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      return newBlocks;
    });
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index < 0) return prev;
      const block = prev[index];
      const newBlock: EmailBlock = {
        id: generateId(),
        type: block.type,
        content: { ...block.content }
      };
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
  }, []);

  const generateHtml = useCallback(() => {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { font-size: 28px; }
    h2 { font-size: 24px; }
    h3 { font-size: 20px; }
    .button { display: inline-block; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
    .columns { display: flex; gap: 20px; }
    .column { flex: 1; }
    blockquote { border-left: 4px solid #9333ea; padding-left: 16px; margin: 0; font-style: italic; color: #666; }
  </style>
</head>
<body>`;

    blocks.forEach(block => {
      switch (block.type) {
        case 'heading':
          html += `\n  <${block.content.size}>${block.content.text}</${block.content.size}>`;
          break;
        case 'text':
          html += `\n  <p>${block.content.text.replace(/\n/g, '<br>')}</p>`;
          break;
        case 'image':
          if (block.content.url) {
            html += `\n  <img src="${block.content.url}" alt="${block.content.alt}" style="width: ${block.content.width}; max-width: 100%;">`;
          }
          break;
        case 'button':
          html += `\n  <a href="${block.content.url}" class="button" style="background-color: ${block.content.color}; color: ${block.content.textColor};">${block.content.text}</a>`;
          break;
        case 'divider':
          html += `\n  <hr style="border-style: ${block.content.style}; border-color: ${block.content.color};">`;
          break;
        case 'spacer':
          html += `\n  <div style="height: ${block.content.height}px;"></div>`;
          break;
        case 'columns':
          html += `\n  <div class="columns"><div class="column">${block.content.left}</div><div class="column">${block.content.right}</div></div>`;
          break;
        case 'list':
          html += `\n  <ul>${block.content.items.split('\n').filter(Boolean).map(item => `<li>${item}</li>`).join('')}</ul>`;
          break;
        case 'quote':
          html += `\n  <blockquote><p>"${block.content.text}"</p>${block.content.author ? `<footer>— ${block.content.author}</footer>` : ''}</blockquote>`;
          break;
      }
    });

    html += '\n</body>\n</html>';
    return html;
  }, [blocks]);

  const copyHtml = () => {
    navigator.clipboard.writeText(generateHtml());
  };

  return (
    <div className="space-y-6" data-testid="email-builder">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email Builder</h2>
          <p className="text-muted-foreground">Drag and drop blocks to create your email</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowTemplates(true)}
            className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30"
            data-testid="button-open-templates"
          >
            <LayoutTemplate className="h-4 w-4 mr-2" />
            Use Template
          </Button>
          <Button
            variant={showPreview ? "default" : "outline"}
            onClick={() => { setShowPreview(!showPreview); setShowHtml(false); }}
            data-testid="button-toggle-preview"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={showHtml ? "default" : "outline"}
            onClick={() => { setShowHtml(!showHtml); setShowPreview(false); }}
            data-testid="button-toggle-html"
          >
            <Code className="h-4 w-4 mr-2" />
            HTML
          </Button>
        </div>
      </div>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Email Template Library
            </DialogTitle>
            <DialogDescription>
              Choose a pre-designed template to get started quickly
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <EmailTemplateLibrary onSelectTemplate={handleSelectTemplate} />
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Add Blocks</CardTitle>
              <CardDescription>Click to add a block to your email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_TYPES.map((blockType) => {
                  const Icon = blockType.icon;
                  return (
                    <Button
                      key={blockType.type}
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center gap-1 hover-elevate"
                      onClick={() => addBlock(blockType.type)}
                      data-testid={`button-add-${blockType.type}`}
                    >
                      <Icon className="h-5 w-5 text-purple-500" />
                      <span className="text-xs">{blockType.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {showHtml ? (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">HTML Output</CardTitle>
                <Button size="sm" onClick={copyHtml} data-testid="button-copy-html">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy HTML
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs font-mono max-h-[500px] overflow-y-auto">
                  {generateHtml()}
                </pre>
              </CardContent>
            </Card>
          ) : showPreview ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Email Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <EmailPreview blocks={blocks} />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {blocks.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Add blocks from the left panel to start building your email</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {blocks.map((block, index) => (
                      <div
                        key={block.id}
                        onDragEnter={() => handleDragEnter(block.id)}
                      >
                        <BlockEditor
                          block={block}
                          onUpdate={updateBlock}
                          onDelete={deleteBlock}
                          onMoveUp={moveBlockUp}
                          onMoveDown={moveBlockDown}
                          onDuplicate={duplicateBlock}
                          isFirst={index === 0}
                          isLast={index === blocks.length - 1}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedBlockId === block.id}
                          isDragOver={dragOverBlockId === block.id}
                        />
                      </div>
                    ))}
                    <div
                      onDragEnter={handleDragEnterEnd}
                      onDragOver={handleDragOver}
                      onDrop={handleDropAtEnd}
                      className={`h-16 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200 ${
                        dragOverBlockId === '__end__' 
                          ? 'border-purple-500 bg-purple-500/10 text-purple-500' 
                          : 'border-border text-muted-foreground'
                      }`}
                      data-testid="drop-zone-end"
                    >
                      <span className="text-sm">Drop here to move to end</span>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
