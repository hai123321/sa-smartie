'use client';

import { useState, useCallback } from 'react';
import { BrdAnalysis, BrdAnalysisMeta } from '@/types/analysis';

export function useAnalysis() {
  const [analyses, setAnalyses] = useState<BrdAnalysisMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyses');
      const json = await res.json() as { data?: BrdAnalysisMeta[]; error?: string };
      if (json.error) throw new Error(json.error);
      setAnalyses(json.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analyses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyze = useCallback(async (
    content: string,
    title?: string
  ): Promise<BrdAnalysis | null> => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title }),
      });
      const json = await res.json() as { data?: BrdAnalysis; error?: string };
      if (json.error) throw new Error(json.error);
      if (json.data) {
        await fetchAnalyses();
        return json.data;
      }
      return null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [fetchAnalyses]);

  const deleteAnalysis = useCallback(async (id: string): Promise<void> => {
    try {
      await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }, []);

  const exportAnalysis = useCallback(async (
    id: string
  ): Promise<{ content: string; filename: string } | null> => {
    try {
      const res = await fetch(`/api/analyses/${id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'markdown' }),
      });
      const json = await res.json() as { data?: { content: string; filename: string }; error?: string };
      if (json.error) throw new Error(json.error);
      return json.data ?? null;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed');
      return null;
    }
  }, []);

  return { analyses, isLoading, isAnalyzing, error, fetchAnalyses, analyze, deleteAnalysis, exportAnalysis };
}
