'use client';

import { useState, useCallback } from 'react';
import { DocSet, CascadeResult, DocType, GeneratedDoc } from '@/types/docs';

export function useDocs(analysisId: string) {
  const [docSet, setDocSet] = useState<DocSet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState<DocType | null>(null);
  const [generationProgress, setGenerationProgress] = useState<DocType[]>([]);
  const [isCascading, setIsCascading] = useState(false);
  const [cascadeResult, setCascadeResult] = useState<CascadeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/docs/${analysisId}`);
      const json = await res.json() as { data?: DocSet; error?: string };
      if (json.error) throw new Error(json.error);
      setDocSet(json.data ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load docs');
    } finally {
      setIsLoading(false);
    }
  }, [analysisId]);

  const generateDocs = useCallback(async (): Promise<void> => {
    setIsGenerating(true);
    setGenerationProgress([]);
    setError(null);
    try {
      const res = await fetch('/api/docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      });

      if (!res.body) throw new Error('No response stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              type: string;
              docType?: DocType;
              doc?: GeneratedDoc;
              message?: string;
            };

            if (event.type === 'start' && event.docType) {
              setGeneratingDoc(event.docType);
            } else if (event.type === 'done' && event.docType && event.doc) {
              setGenerationProgress((prev) => [...prev, event.docType!]);
              setGeneratingDoc(null);
              setDocSet((prev) => {
                if (!prev) {
                  return {
                    analysisId,
                    enrichedBrdVersion: 1,
                    docs: [event.doc!],
                    lastUpdatedAt: new Date().toISOString(),
                  };
                }
                const idx = prev.docs.findIndex((d) => d.type === event.docType);
                const newDocs =
                  idx >= 0
                    ? prev.docs.map((d, i) => (i === idx ? event.doc! : d))
                    : [...prev.docs, event.doc!];
                return { ...prev, docs: newDocs, lastUpdatedAt: new Date().toISOString() };
              });
            } else if (event.type === 'error') {
              throw new Error(event.message ?? 'Generation error');
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
      setGeneratingDoc(null);
    }
  }, [analysisId]);

  const triggerCascade = useCallback(async (updatedBrd: string): Promise<CascadeResult | null> => {
    setIsCascading(true);
    setCascadeResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/docs/${analysisId}/cascade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedBrd }),
      });
      const json = await res.json() as { data?: CascadeResult; error?: string };
      if (json.error) throw new Error(json.error);
      if (json.data) {
        setCascadeResult(json.data);
        // Reload docs to get updated content
        await loadDocs();
        return json.data;
      }
      return null;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cascade failed');
      return null;
    } finally {
      setIsCascading(false);
    }
  }, [analysisId, loadDocs]);

  return {
    docSet,
    isLoading,
    isGenerating,
    generatingDoc,
    generationProgress,
    isCascading,
    cascadeResult,
    error,
    loadDocs,
    generateDocs,
    triggerCascade,
  };
}
