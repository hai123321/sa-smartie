'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Plus, MessageSquare, Trash2, Network, FileText, Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');

  const {
    conversations, currentMessages, isStreaming, currentConversationId, error,
    fetchConversations, loadConversation, sendMessage, stopStreaming, newChat, deleteConversation,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages]);

  async function handleSend(content: string) {
    await sendMessage({
      content,
      conversationId: currentConversationId ?? undefined,
      analysisId: analysisId ?? undefined,
      useInventoryContext: true,
    });
  }

  const isLastMessageStreaming =
    isStreaming &&
    currentMessages.length > 0 &&
    currentMessages[currentMessages.length - 1]?.role === 'assistant';

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium">Conversations</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { newChat(); router.push('/chat'); }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground text-center">
                No conversations yet
              </p>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                className={cn(
                  'group flex items-start gap-2 rounded-md px-2 py-2 cursor-pointer hover:bg-accent',
                  currentConversationId === c.id && 'bg-primary/10 text-primary'
                )}
                onClick={() => loadConversation(c.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-60" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.messageCount} messages
                    {c.attachedAnalysisId && ' · BRD'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-60 hover:!opacity-100 shrink-0"
                  onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Context badges */}
        <div className="flex items-center gap-2 border-b border-border px-6 py-2 min-h-[44px]">
          <Badge variant="secondary" className="text-xs gap-1">
            <Network className="h-3 w-3" />
            System Inventory context on
          </Badge>
          {analysisId && (
            <Badge variant="secondary" className="text-xs gap-1">
              <FileText className="h-3 w-3" />
              BRD attached
            </Badge>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
          {currentMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold">Architecture Q&A</h3>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
                Ask about system design, architecture patterns, or how your existing systems
                should integrate. I have context about your system inventory.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-sm text-left">
                {[
                  'How should I design the authentication flow for our new mobile app?',
                  'What architecture pattern fits best for our event-driven order processing?',
                  'Review the integration between our Payment Gateway and Order Service',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="rounded-lg border border-border p-3 text-xs text-left hover:border-primary/40 hover:bg-accent transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {currentMessages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={
                    isLastMessageStreaming && i === currentMessages.length - 1
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              onSend={handleSend}
              onStop={stopStreaming}
              isStreaming={isStreaming}
            />
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              Cmd+Enter to send · Responses grounded in your System Inventory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
