'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrdUploaderProps {
  onAnalyze: (content: string, title?: string) => void;
  isAnalyzing: boolean;
}

export function BrdUploader({ onAnalyze, isAnalyzing }: BrdUploaderProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const isValid = charCount >= 10;

  function handleFile(file: File) {
    if (file.size > 200_000) {
      alert('File too large. Max 200KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleSubmit() {
    if (!isValid || isAnalyzing) return;
    onAnalyze(content, title || undefined);
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="brd-title">Title (optional)</Label>
        <Input
          id="brd-title"
          placeholder="e.g., Payment Gateway BRD v1.2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1"
          disabled={isAnalyzing}
        />
      </div>

      <div>
        <Label htmlFor="brd-content">BRD Content</Label>
        <div
          className={cn(
            'mt-1 rounded-md border border-border transition-colors',
            dragOver && 'border-primary bg-primary/5'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Textarea
            id="brd-content"
            placeholder="Paste your BRD content here, or drag & drop a .txt / .md file..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[320px] resize-y border-0 focus-visible:ring-0 rounded-md font-mono text-sm"
            disabled={isAnalyzing}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {dragOver
              ? 'Drop file here...'
              : 'Drag & drop .txt or .md files, or paste directly'}
          </span>
          <span className={cn(charCount > 100000 && 'text-destructive')}>
            {charCount.toLocaleString()} / 100,000 chars
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.text"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={isAnalyzing}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload File
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isAnalyzing || charCount > 100000}
          className="ml-auto"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Analyze BRD
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
