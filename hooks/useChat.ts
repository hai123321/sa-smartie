'use client';

import { useState, useCallback, useRef } from 'react';
import { Conversation, ConversationMeta } from '@/types/chat';

interface SendMessageOptions {
  content: string;
  conversationId?: string;
  analysisId?: string;
  useInventoryContext?: boolean;
}

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function useChat() {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [currentMessages, setCurrentMessages] = useState<LocalMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      const json = await res.json() as { data?: ConversationMeta[]; error?: string };
      if (json.data) setConversations(json.data);
    } catch {
      // ignore
    }
  }, []);

  const loadConversation = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const json = await res.json() as { data?: Conversation; error?: string };
      if (json.data) {
        setCurrentConversationId(id);
        setCurrentMessages(
          json.data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        );
      }
    } catch {
      setError('Failed to load conversation');
    }
  }, []);

  const sendMessage = useCallback(async (opts: SendMessageOptions): Promise<void> => {
    const { content, conversationId, analysisId, useInventoryContext = true } = opts;
    setError(null);

    const userMsg: LocalMessage = { id: Date.now().toString(), role: 'user', content };
    const assistantMsg: LocalMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };

    setCurrentMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const allMessages = [
      ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content },
    ];

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          conversationId: conversationId ?? currentConversationId ?? undefined,
          analysisId,
          useInventoryContext,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Chat request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6);
          if (!dataStr.trim()) continue;

          try {
            const data = JSON.parse(dataStr) as {
              text?: string;
              done?: boolean;
              conversationId?: string;
              error?: string;
            };

            if (data.error) {
              setError(data.error);
              break;
            }
            if (data.text) {
              assistantContent += data.text;
              setCurrentMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: assistantContent } : m
                )
              );
            }
            if (data.done && data.conversationId) {
              setCurrentConversationId(data.conversationId);
              await fetchConversations();
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Chat failed';
      setError(message);
      // Remove the empty assistant message on error
      setCurrentMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [currentMessages, currentConversationId, fetchConversations]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const newChat = useCallback(() => {
    setCurrentMessages([]);
    setCurrentConversationId(null);
    setError(null);
  }, []);

  const deleteConversation = useCallback(async (id: string): Promise<void> => {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) newChat();
  }, [currentConversationId, newChat]);

  return {
    conversations, currentMessages, isStreaming, currentConversationId, error,
    fetchConversations, loadConversation, sendMessage, stopStreaming, newChat, deleteConversation,
  };
}
