import fs from 'fs/promises';
import path from 'path';
import { DocSet, GeneratedDoc, DocType } from '@/types/docs';

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
const DOCS_DIR = path.join(DATA_DIR, 'docs');

async function ensureDir() {
  await fs.mkdir(DOCS_DIR, { recursive: true });
}

export const docsStore = {
  async save(docSet: DocSet): Promise<void> {
    await ensureDir();
    const file = path.join(DOCS_DIR, `${docSet.analysisId}.json`);
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(docSet, null, 2), 'utf-8');
    await fs.rename(tmp, file);
  },

  async getByAnalysisId(analysisId: string): Promise<DocSet | null> {
    await ensureDir();
    try {
      const file = path.join(DOCS_DIR, `${analysisId}.json`);
      const raw = await fs.readFile(file, 'utf-8');
      return JSON.parse(raw) as DocSet;
    } catch {
      return null;
    }
  },

  async upsertDoc(analysisId: string, doc: GeneratedDoc): Promise<DocSet> {
    const existing = await docsStore.getByAnalysisId(analysisId);
    const now = new Date().toISOString();

    if (!existing) {
      const docSet: DocSet = {
        analysisId,
        enrichedBrdVersion: 1,
        docs: [doc],
        lastUpdatedAt: now,
      };
      await docsStore.save(docSet);
      return docSet;
    }

    const idx = existing.docs.findIndex((d) => d.type === doc.type);
    const newDocs =
      idx >= 0
        ? existing.docs.map((d, i) => (i === idx ? doc : d))
        : [...existing.docs, doc];

    const updated: DocSet = {
      ...existing,
      docs: newDocs,
      lastUpdatedAt: now,
    };
    await docsStore.save(updated);
    return updated;
  },

  async bumpVersion(analysisId: string): Promise<void> {
    const existing = await docsStore.getByAnalysisId(analysisId);
    if (!existing) return;
    await docsStore.save({
      ...existing,
      enrichedBrdVersion: existing.enrichedBrdVersion + 1,
      lastUpdatedAt: new Date().toISOString(),
    });
  },

  async getDoc(analysisId: string, type: DocType): Promise<GeneratedDoc | null> {
    const docSet = await docsStore.getByAnalysisId(analysisId);
    return docSet?.docs.find((d) => d.type === type) ?? null;
  },

  async listAnalysisIds(): Promise<string[]> {
    await ensureDir();
    try {
      const files = await fs.readdir(DOCS_DIR);
      return files
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace('.json', ''));
    } catch {
      return [];
    }
  },
};
