import fs from 'fs/promises';
import path from 'path';
import { Conversation, ConversationMeta, Message } from '@/types/chat';

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
const CONVOS_DIR = path.join(DATA_DIR, 'conversations');

async function ensureDir() {
  await fs.mkdir(CONVOS_DIR, { recursive: true });
}

export const conversationsStore = {
  async save(conversation: Conversation): Promise<void> {
    await ensureDir();
    const file = path.join(CONVOS_DIR, `${conversation.id}.json`);
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(conversation, null, 2), 'utf-8');
    await fs.rename(tmp, file);
  },

  async getById(id: string): Promise<Conversation | null> {
    await ensureDir();
    try {
      const raw = await fs.readFile(path.join(CONVOS_DIR, `${id}.json`), 'utf-8');
      return JSON.parse(raw) as Conversation;
    } catch {
      return null;
    }
  },

  async getAll(): Promise<ConversationMeta[]> {
    await ensureDir();
    try {
      const files = await fs.readdir(CONVOS_DIR);
      const metas: ConversationMeta[] = [];
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const raw = await fs.readFile(path.join(CONVOS_DIR, file), 'utf-8');
          const convo = JSON.parse(raw) as Conversation;
          metas.push({
            id: convo.id,
            title: convo.title,
            messageCount: convo.messages.length,
            attachedAnalysisId: convo.attachedAnalysisId,
            createdAt: convo.createdAt,
            updatedAt: convo.updatedAt,
          });
        } catch {
          // skip corrupt files
        }
      }
      return metas.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch {
      return [];
    }
  },

  async appendMessage(id: string, message: Message): Promise<Conversation | null> {
    const convo = await this.getById(id);
    if (!convo) return null;
    const updated: Conversation = {
      ...convo,
      messages: [...convo.messages, message],
      updatedAt: new Date().toISOString(),
    };
    await this.save(updated);
    return updated;
  },

  async updateTitle(id: string, title: string): Promise<void> {
    const convo = await this.getById(id);
    if (!convo) return;
    await this.save({ ...convo, title, updatedAt: new Date().toISOString() });
  },

  async deleteById(id: string): Promise<boolean> {
    await ensureDir();
    try {
      await fs.unlink(path.join(CONVOS_DIR, `${id}.json`));
      return true;
    } catch {
      return false;
    }
  },
};
