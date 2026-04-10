/**
 * Simple file-based graph store.
 * Stores all systems and relationships as JSON files in DATA_DIR.
 * Acts as a lightweight graph DB for local-first use.
 */
import fs from 'fs/promises';
import path from 'path';
import { System, Relationship } from '@/types/inventory';

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
const GRAPH_FILE = path.join(DATA_DIR, 'graph.json');

interface GraphStore {
  systems: Record<string, System>;
  relationships: Record<string, Relationship>;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readGraph(): Promise<GraphStore> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(GRAPH_FILE, 'utf-8');
    return JSON.parse(raw) as GraphStore;
  } catch {
    return { systems: {}, relationships: {} };
  }
}

async function writeGraph(store: GraphStore): Promise<void> {
  await ensureDataDir();
  const tmp = GRAPH_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), 'utf-8');
  await fs.rename(tmp, GRAPH_FILE);
}

export const graphDb = {
  readGraph,
  writeGraph,
  async getSystems(): Promise<System[]> {
    const store = await readGraph();
    return Object.values(store.systems);
  },
  async getSystemById(id: string): Promise<System | null> {
    const store = await readGraph();
    return store.systems[id] ?? null;
  },
  async upsertSystem(system: System): Promise<void> {
    const store = await readGraph();
    store.systems[system.id] = system;
    await writeGraph(store);
  },
  async deleteSystem(id: string): Promise<void> {
    const store = await readGraph();
    delete store.systems[id];
    // Cascade delete relationships involving this system
    for (const [relId, rel] of Object.entries(store.relationships)) {
      if (rel.sourceId === id || rel.targetId === id) {
        delete store.relationships[relId];
      }
    }
    await writeGraph(store);
  },
  async getRelationships(): Promise<Relationship[]> {
    const store = await readGraph();
    return Object.values(store.relationships);
  },
  async getRelationshipById(id: string): Promise<Relationship | null> {
    const store = await readGraph();
    return store.relationships[id] ?? null;
  },
  async getRelationshipsBySystem(systemId: string): Promise<Relationship[]> {
    const store = await readGraph();
    return Object.values(store.relationships).filter(
      (r) => r.sourceId === systemId || r.targetId === systemId
    );
  },
  async upsertRelationship(relationship: Relationship): Promise<void> {
    const store = await readGraph();
    store.relationships[relationship.id] = relationship;
    await writeGraph(store);
  },
  async deleteRelationship(id: string): Promise<void> {
    const store = await readGraph();
    delete store.relationships[id];
    await writeGraph(store);
  },
  async importData(systems: System[], relationships: Relationship[]): Promise<void> {
    const store: GraphStore = { systems: {}, relationships: {} };
    for (const s of systems) store.systems[s.id] = s;
    for (const r of relationships) store.relationships[r.id] = r;
    await writeGraph(store);
  },
  async searchSystems(query: string): Promise<System[]> {
    const store = await readGraph();
    const q = query.toLowerCase();
    return Object.values(store.systems).filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.team.toLowerCase().includes(q) ||
        s.techStack.some((t) => t.toLowerCase().includes(q))
    );
  },
};
