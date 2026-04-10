import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { ChatRequestSchema } from '@/lib/validation/schemas';
import { getAuthMode, getClaudeClient, getModel } from '@/lib/ai/claude-client';
import { streamClaudeCli } from '@/lib/ai/cli-client';
import { buildArchitectureQASystemPrompt } from '@/lib/ai/prompts/architecture-qa';
import { buildInventoryContext } from '@/lib/ai/prompts/inventory-context';
import { systemsRepository } from '@/lib/db/systems-repository';
import { relationshipsRepository } from '@/lib/db/relationships-repository';
import { analysesStore } from '@/lib/storage/analyses-store';
import { conversationsStore } from '@/lib/storage/conversations-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = ChatRequestSchema.safeParse(body);

    if (!input.success) {
      return new Response(
        JSON.stringify({ error: input.error.issues[0]?.message ?? 'Invalid input' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, conversationId, analysisId, useInventoryContext } = input.data;

    // Build context
    const [systems, relationships, brdAnalysis] = await Promise.all([
      useInventoryContext ? systemsRepository.findAll() : Promise.resolve([]),
      useInventoryContext ? relationshipsRepository.findAll() : Promise.resolve([]),
      analysisId ? analysesStore.getById(analysisId) : Promise.resolve(null),
    ]);

    const inventoryContext = buildInventoryContext(systems, relationships);
    const systemPrompt = buildArchitectureQASystemPrompt(inventoryContext, brdAnalysis);

    const convId = conversationId ?? uuidv4();
    const lastUserMsg = messages[messages.length - 1];
    const titleCandidate = lastUserMsg?.content?.slice(0, 60) ?? 'New conversation';

    const encoder = new TextEncoder();
    let fullResponse = '';

    async function saveConversation(response: string) {
      const now = new Date().toISOString();
      const existing = await conversationsStore.getById(convId);
      if (existing) {
        await conversationsStore.appendMessage(convId, {
          id: uuidv4(), role: 'assistant', content: response, timestamp: now,
        });
      } else {
        await conversationsStore.save({
          id: convId,
          title: titleCandidate,
          messages: [
            ...messages.map((m) => ({ id: uuidv4(), role: m.role, content: m.content, timestamp: now })),
            { id: uuidv4(), role: 'assistant' as const, content: response, timestamp: now },
          ],
          attachedAnalysisId: analysisId ?? undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const authMode = getAuthMode();

          if (authMode === 'cli') {
            // CLI mode: use claude subprocess with simulated streaming
            const userContent = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
            for await (const chunk of streamClaudeCli(systemPrompt, userContent)) {
              fullResponse += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            }
          } else {
            // API mode: real SSE streaming
            const client = getClaudeClient();
            const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
              role: m.role,
              content: m.content,
            }));
            const response = await client.messages.create({
              model: getModel(),
              max_tokens: 4096,
              system: systemPrompt,
              messages: anthropicMessages,
              stream: true,
            });

            for await (const event of response) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const text = event.delta.text;
                fullResponse += text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }
          }

          await saveConversation(fullResponse);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`)
          );
          controller.close();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
