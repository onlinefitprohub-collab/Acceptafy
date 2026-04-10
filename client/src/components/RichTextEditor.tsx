import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Minus,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onImagesChange?: (images: ImageData[]) => void;
}

export interface ImageData {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  sizeKB?: number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

export function RichTextEditor({ content, onChange, placeholder = 'Start writing...', onImagesChange }: RichTextEditorProps) {
  const { toast } = useToast();
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageMetadataRef = useRef<Map<string, ImageData>>(new Map());

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please paste or drop an image file",
        variant: "destructive"
      });
      return null;
    }

    const maxSizeKB = 5000;
    const sizeKB = Math.round(file.size / 1024);
    
    if (sizeKB > maxSizeKB) {
      toast({
        title: "Image too large",
        description: `Image is ${sizeKB}KB. Maximum allowed is ${maxSizeKB}KB.`,
        variant: "destructive"
      });
      return null;
    }

    try {
      const base64 = await fileToBase64(file);
      const dimensions = await getImageDimensions(base64);
      
      return {
        src: base64,
        width: dimensions.width,
        height: dimensions.height,
        sizeKB,
        alt: file.name.replace(/\.[^/.]+$/, ''),
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return null;
    }
  }, [toast]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        validate: () => true,
        HTMLAttributes: {
          class: 'text-purple-500 hover:underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      
      if (onImagesChange) {
        const images: ImageData[] = [];
        editor.state.doc.descendants((node) => {
          if (node.type.name === 'image') {
            const src = node.attrs.src;
            const storedMetadata = imageMetadataRef.current.get(src);
            if (storedMetadata) {
              images.push(storedMetadata);
            } else {
              images.push({
                src,
                alt: node.attrs.alt || '',
              });
            }
          }
        });
        onImagesChange(images);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-neutral dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none',
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handleImageFile(file).then((imageData) => {
                if (imageData && editor) {
                  imageMetadataRef.current.set(imageData.src, imageData);
                  editor.chain().focus().setImage({ 
                    src: imageData.src,
                    alt: imageData.alt,
                  }).run();
                  toast({
                    title: "Image added",
                    description: `${imageData.width}x${imageData.height}px (${imageData.sizeKB}KB)`,
                  });
                }
              });
            }
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        
        const file = files[0];
        if (file.type.startsWith('image/')) {
          event.preventDefault();
          handleImageFile(file).then((imageData) => {
            if (imageData && editor) {
              imageMetadataRef.current.set(imageData.src, imageData);
              const { pos } = view.posAtCoords({ left: event.clientX, top: event.clientY }) || { pos: view.state.selection.head };
              editor.chain().focus().setImage({ 
                src: imageData.src,
                alt: imageData.alt,
              }).run();
              toast({
                title: "Image added",
                description: `${imageData.width}x${imageData.height}px (${imageData.sizeKB}KB)`,
              });
            }
          });
          return true;
        }
        return false;
      },
    },
  }, [handleImageFile, onImagesChange, toast]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setLinkUrl('');
  }, [editor, linkUrl]);

  const addImage = useCallback(async () => {
    if (!editor || !imageUrl) return;
    
    const dimensions = await getImageDimensions(imageUrl);
    const imageData: ImageData = {
      src: imageUrl,
      width: dimensions.width,
      height: dimensions.height,
      alt: '',
    };
    imageMetadataRef.current.set(imageUrl, imageData);
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
  }, [editor, imageUrl]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          data-testid="editor-bold"
        >
          <Bold className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          data-testid="editor-italic"
        >
          <Italic className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          data-testid="editor-underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          data-testid="editor-strike"
        >
          <Strikethrough className="w-4 h-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          data-testid="editor-h1"
        >
          <Heading1 className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-testid="editor-h2"
        >
          <Heading2 className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          data-testid="editor-h3"
        >
          <Heading3 className="w-4 h-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          data-testid="editor-bullet-list"
        >
          <List className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          data-testid="editor-ordered-list"
        >
          <ListOrdered className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('blockquote')}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          data-testid="editor-quote"
        >
          <Quote className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('codeBlock')}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
          data-testid="editor-code"
        >
          <Code className="w-4 h-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'left' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
          data-testid="editor-align-left"
        >
          <AlignLeft className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'center' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
          data-testid="editor-align-center"
        >
          <AlignCenter className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'right' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
          data-testid="editor-align-right"
        >
          <AlignRight className="w-4 h-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={editor.isActive('link')}
              data-testid="editor-link"
            >
              <LinkIcon className="w-4 h-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <Label htmlFor="link-url">Link URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                data-testid="input-link-url"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={setLink} data-testid="button-set-link">
                  Set Link
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => editor.chain().focus().unsetLink().run()}
                  data-testid="button-remove-link"
                >
                  Remove
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Toggle size="sm" data-testid="editor-image">
              <ImageIcon className="w-4 h-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                data-testid="input-image-url"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addImage} data-testid="button-add-image">
                  Add Image
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-image"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: You can also paste or drag images directly into the editor
              </p>
            </div>
          </PopoverContent>
        </Popover>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const imageData = await handleImageFile(file);
              if (imageData && editor) {
                imageMetadataRef.current.set(imageData.src, imageData);
                editor.chain().focus().setImage({ 
                  src: imageData.src,
                  alt: imageData.alt,
                }).run();
                toast({
                  title: "Image uploaded",
                  description: `${imageData.width}x${imageData.height}px (${imageData.sizeKB}KB)`,
                });
              }
            }
            e.target.value = '';
          }}
          data-testid="input-file-upload"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          data-testid="editor-hr"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          data-testid="editor-undo"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          data-testid="editor-redo"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      <EditorContent editor={editor} className="min-h-[300px]" />
    </div>
  );
}
