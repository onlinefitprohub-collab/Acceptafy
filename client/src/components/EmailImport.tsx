import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, FileText, X, Check, AlertCircle, Mail } from 'lucide-react';

interface ParsedEmail {
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  previewText: string;
}

interface EmailImportProps {
  onLoadEmail: (subject: string, previewText: string, body: string) => void;
}

function parseEmlFile(content: string): ParsedEmail {
  const lines = content.split(/\r?\n/);
  const headers: Record<string, string> = {};
  let bodyStartIndex = 0;
  let inHeaders = true;
  let currentHeader = '';
  let currentValue = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (inHeaders) {
      if (line === '') {
        if (currentHeader) {
          headers[currentHeader.toLowerCase()] = currentValue.trim();
        }
        bodyStartIndex = i + 1;
        inHeaders = false;
        break;
      }
      
      if (line.startsWith(' ') || line.startsWith('\t')) {
        currentValue += ' ' + line.trim();
      } else {
        if (currentHeader) {
          headers[currentHeader.toLowerCase()] = currentValue.trim();
        }
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          currentHeader = line.substring(0, colonIndex);
          currentValue = line.substring(colonIndex + 1).trim();
        }
      }
    }
  }

  let rawBody = lines.slice(bodyStartIndex).join('\n');
  
  const contentType = headers['content-type'] || '';
  const contentTransferEncoding = headers['content-transfer-encoding'] || '';
  
  if (contentType.includes('multipart')) {
    const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/i);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = rawBody.split('--' + boundary);
      
      for (const part of parts) {
        if (part.includes('Content-Type: text/plain') || 
            (part.includes('text/plain') && !part.includes('text/html'))) {
          const partLines = part.split(/\r?\n/);
          let partBodyStart = 0;
          for (let i = 0; i < partLines.length; i++) {
            if (partLines[i].trim() === '') {
              partBodyStart = i + 1;
              break;
            }
          }
          rawBody = partLines.slice(partBodyStart).join('\n').trim();
          break;
        }
      }
      
      if (!rawBody || rawBody.includes('--')) {
        for (const part of parts) {
          if (part.includes('Content-Type: text/html') || part.includes('text/html')) {
            const partLines = part.split(/\r?\n/);
            let partBodyStart = 0;
            for (let i = 0; i < partLines.length; i++) {
              if (partLines[i].trim() === '') {
                partBodyStart = i + 1;
                break;
              }
            }
            let htmlBody = partLines.slice(partBodyStart).join('\n').trim();
            htmlBody = htmlBody.replace(/<[^>]+>/g, '');
            htmlBody = htmlBody.replace(/&nbsp;/g, ' ');
            htmlBody = htmlBody.replace(/&amp;/g, '&');
            htmlBody = htmlBody.replace(/&lt;/g, '<');
            htmlBody = htmlBody.replace(/&gt;/g, '>');
            htmlBody = htmlBody.replace(/&quot;/g, '"');
            rawBody = htmlBody.trim();
            break;
          }
        }
      }
    }
  }

  if (contentTransferEncoding.toLowerCase() === 'quoted-printable') {
    rawBody = rawBody
      .replace(/=\r?\n/g, '')
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  } else if (contentTransferEncoding.toLowerCase() === 'base64') {
    try {
      rawBody = atob(rawBody.replace(/\s/g, ''));
    } catch (e) {
      console.warn('Failed to decode base64 content');
    }
  }

  rawBody = rawBody
    .replace(/--[^\n]+--\s*$/g, '')
    .replace(/--[^\n]+\s*$/g, '')
    .trim();

  const previewText = rawBody.substring(0, 150).replace(/\n/g, ' ').trim();

  return {
    subject: headers['subject'] || '',
    from: headers['from'] || '',
    to: headers['to'] || '',
    date: headers['date'] || '',
    body: rawBody,
    previewText
  };
}

export function EmailImport({ onLoadEmail }: EmailImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedEmail, setParsedEmail] = useState<ParsedEmail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = useCallback((file: File) => {
    setError(null);
    
    if (!file.name.endsWith('.eml')) {
      setError('Please upload a .eml file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseEmlFile(content);
        setParsedEmail(parsed);
        setFileName(file.name);
      } catch (err) {
        setError('Failed to parse .eml file. The file may be corrupted or in an unsupported format.');
        console.error('Parse error:', err);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleLoadEmail = () => {
    if (parsedEmail) {
      onLoadEmail(parsedEmail.subject, parsedEmail.previewText, parsedEmail.body);
      setParsedEmail(null);
      setFileName(null);
    }
  };

  const handleClear = () => {
    setParsedEmail(null);
    setFileName(null);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Email
          </CardTitle>
          <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] px-1.5 py-0">NEW</Badge>
        </div>
        <CardDescription>
          Import .eml files from your email client to analyze and grade them
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!parsedEmail ? (
          <>
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                ${isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.01]' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              data-testid="dropzone-email-import"
            >
              <input
                type="file"
                accept=".eml"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                data-testid="input-file-email"
              />
              <div className="flex flex-col items-center gap-3">
                <div className={`p-4 rounded-full transition-colors duration-200 ${isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Upload className={`w-8 h-8 transition-colors duration-200 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {isDragging ? 'Drop your .eml file here' : 'Drag and drop your .eml file here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive" data-testid="error-import">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-sm text-foreground mb-2">How to export .eml files:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Gmail:</strong> Open email &rarr; More (three dots) &rarr; Download message</li>
                <li><strong>Outlook:</strong> Open email &rarr; File &rarr; Save As &rarr; Select .eml format</li>
                <li><strong>Apple Mail:</strong> Select email &rarr; File &rarr; Save As</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-sm" data-testid="text-filename">{fileName}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClear} data-testid="button-clear-import">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Subject</label>
                <Input 
                  value={parsedEmail.subject} 
                  readOnly 
                  className="mt-1 bg-muted/30"
                  data-testid="input-parsed-subject"
                />
              </div>

              {parsedEmail.from && (
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">From:</span>{' '}
                    <span className="text-foreground" data-testid="text-from">{parsedEmail.from}</span>
                  </div>
                  {parsedEmail.date && (
                    <div>
                      <span className="text-muted-foreground">Date:</span>{' '}
                      <span className="text-foreground" data-testid="text-date">{parsedEmail.date}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Body Preview</label>
                <Textarea 
                  value={parsedEmail.body.substring(0, 500) + (parsedEmail.body.length > 500 ? '...' : '')} 
                  readOnly 
                  className="mt-1 bg-muted/30 min-h-[150px]"
                  data-testid="textarea-parsed-body"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleLoadEmail} className="flex-1" data-testid="button-load-email">
                <Mail className="w-4 h-4 mr-2" />
                Load into Editor
              </Button>
              <Button variant="outline" onClick={handleClear} data-testid="button-cancel-import">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
