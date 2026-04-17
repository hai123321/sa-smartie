'use client';

import { useState, useCallback } from 'react';
import { BrdSession } from '@/types/session';

export function useSession(analysisId: string) {
  const [session, setSession] = useState<BrdSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/session/${analysisId}`);
      const json = await res.json() as { data?: BrdSession; error?: string };
      if (json.error) throw new Error(json.error);
      setSession(json.data ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, [analysisId]);

  const createSession = useCallback(async (): Promise<BrdSession | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/session/${analysisId}`, { method: 'POST' });
      const json = await res.json() as { data?: BrdSession; error?: string };
      if (json.error) throw new Error(json.error);
      if (json.data) {
        setSession(json.data);
        return json.data;
      }
      return null;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [analysisId]);

  const submitAnswer = useCallback(async (
    questionId: string,
    answer: string,
    options?: { clarificationAnswer?: string; skipClarification?: boolean }
  ): Promise<{ session: BrdSession | null; clarification?: string }> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/session/${analysisId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          answer,
          clarificationAnswer: options?.clarificationAnswer,
          skipClarification: options?.skipClarification ?? false,
        }),
      });
      const json = await res.json() as {
        data?: { session: BrdSession; clarification?: string };
        error?: string;
      };
      if (json.error) throw new Error(json.error);
      if (json.data?.session) {
        setSession(json.data.session);
      }
      return { session: json.data?.session ?? null, clarification: json.data?.clarification };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit answer';
      setError(message);
      return { session: null };
    } finally {
      setIsSubmitting(false);
    }
  }, [analysisId]);

  const skipQuestion = useCallback(async (questionId: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/session/${analysisId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          answer: '[Skipped]',
          skipClarification: true,
        }),
      });
      const json = await res.json() as { data?: { session: BrdSession }; error?: string };
      if (json.data?.session) setSession(json.data.session);
    } catch {
      // silent
    } finally {
      setIsSubmitting(false);
    }
  }, [analysisId]);

  const finalizeSession = useCallback(async (): Promise<string | null> => {
    setIsFinalizing(true);
    setError(null);
    try {
      const res = await fetch(`/api/session/${analysisId}/finalize`, { method: 'POST' });
      const json = await res.json() as {
        data?: { enrichedBrd: string; session: BrdSession };
        error?: string;
        criticalUnanswered?: string[];
      };
      if (json.error) throw new Error(json.error);
      if (json.data?.session) setSession(json.data.session);
      return json.data?.enrichedBrd ?? null;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to finalize session');
      return null;
    } finally {
      setIsFinalizing(false);
    }
  }, [analysisId]);

  return {
    session,
    isLoading,
    isSubmitting,
    isFinalizing,
    error,
    loadSession,
    createSession,
    submitAnswer,
    skipQuestion,
    finalizeSession,
  };
}
