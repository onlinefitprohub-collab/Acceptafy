import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Link as LinkIcon,
  List,
  ListOrdered,
  Undo,
  Redo,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';

interface EmailComposerEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export interface EmailComposerEditorRef {
  insertText: (text: string) => void;
}

export const EmailComposerEditor = forwardRef<EmailComposerEditorRef, EmailComposerEditorProps>(function EmailComposerEditor({ content, onChange, placeholder = 'Write your email content here...' }, ref) {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-500 underline cursor-pointer',
          style: 'color: #a855f7; text-decoration: underline;',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-neutral dark:prose-invert max-w-none min-h-[150px] p-3 focus:outline-none',
      },
    },
  }, []);

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (editor) {
        editor.chain().focus().insertContent(text).run();
      }
    },
  }), [editor]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    
    if (hasSelection) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else if (linkText) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
    } else {
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run();
    }
    
    setLinkUrl('');
    setLinkText('');
    setLinkPopoverOpen(false);
  }, [editor, linkUrl, linkText]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-visible bg-background">
      <div className="flex flex-wrap items-center gap-1 p-1.5 border-b bg-muted/30">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          data-testid="composer-bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          data-testid="composer-italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          data-testid="composer-underline"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </Toggle>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          data-testid="composer-bullet-list"
        >
          <List className="w-3.5 h-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          data-testid="composer-ordered-list"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </Toggle>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        <Popover open={linkPopoverOpen} onOpenChange={(open) => {
          setLinkPopoverOpen(open);
          if (open && editor) {
            const { from, to } = editor.state.selection;
            const existingLink = editor.getAttributes('link').href;
            if (existingLink) {
              setLinkUrl(existingLink);
            }
            if (from !== to) {
              setLinkText(editor.state.doc.textBetween(from, to));
            }
          }
        }}>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={editor.isActive('link')}
              data-testid="composer-link"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-3">
              <div>
                <Label htmlFor="composer-link-text" className="text-xs">Link Text</Label>
                <Input
                  id="composer-link-text"
                  placeholder="Click here to read"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="mt-1"
                  data-testid="input-composer-link-text"
                />
              </div>
              <div>
                <Label htmlFor="composer-link-url" className="text-xs">URL</Label>
                <Input
                  id="composer-link-url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setLink(); } }}
                  className="mt-1"
                  data-testid="input-composer-link-url"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={setLink} disabled={!linkUrl} data-testid="button-composer-set-link">
                  {editor.isActive('link') ? 'Update Link' : 'Insert Link'}
                </Button>
                {editor.isActive('link') && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setLinkUrl('');
                      setLinkText('');
                      setLinkPopoverOpen(false);
                    }}
                    data-testid="button-composer-remove-link"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          data-testid="composer-undo"
          className="h-8 w-8 p-0"
        >
          <Undo className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          data-testid="composer-redo"
          className="h-8 w-8 p-0"
        >
          <Redo className="w-3.5 h-3.5" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
});
