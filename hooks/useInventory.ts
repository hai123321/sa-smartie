'use client';

import { useState, useCallback } from 'react';
import { System, Relationship, GraphData, CreateSystemInput, UpdateSystemInput, CreateRelationshipInput } from '@/types/inventory';

export function useInventory() {
  const [systems, setSystems] = useState<System[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSystems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/inventory/systems');
      const json = await res.json() as { data?: System[]; error?: string };
      if (json.error) throw new Error(json.error);
      setSystems(json.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load systems');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/graph');
      const json = await res.json() as { data?: GraphData; error?: string };
      if (json.error) throw new Error(json.error);
      setGraphData(json.data ?? { nodes: [], edges: [] });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    }
  }, []);

  const createSystem = useCallback(async (input: CreateSystemInput): Promise<System | null> => {
    try {
      const res = await fetch('/api/inventory/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json() as { data?: System; error?: string };
      if (json.error) throw new Error(json.error);
      if (json.data) {
        setSystems((prev) => [...prev, json.data!].sort((a, b) => a.name.localeCompare(b.name)));
      }
      return json.data ?? null;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create system');
      return null;
    }
  }, []);

  const updateSystem = useCallback(async (id: string, input: UpdateSystemInput): Promise<System | null> => {
    try {
      const res = await fetch(`/api/inventory/systems/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json() as { data?: System; error?: string };
      if (json.error) throw new Error(json.error);
      if (json.data) {
        setSystems((prev) => prev.map((s) => (s.id === id ? json.data! : s)));
      }
      return json.data ?? null;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update system');
      return null;
    }
  }, []);

  const deleteSystem = useCallback(async (id: string): Promise<void> => {
    try {
      await fetch(`/api/inventory/systems/${id}`, { method: 'DELETE' });
      setSystems((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete system');
    }
  }, []);

  const createRelationship = useCallback(async (input: CreateRelationshipInput): Promise<Relationship | null> => {
    try {
      const res = await fetch('/api/inventory/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json() as { data?: Relationship; error?: string };
      if (json.error) throw new Error(json.error);
      return json.data ?? null;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create relationship');
      return null;
    }
  }, []);

  const deleteRelationship = useCallback(async (id: string): Promise<void> => {
    try {
      await fetch(`/api/inventory/relationships/${id}`, { method: 'DELETE' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete relationship');
    }
  }, []);

  const importInventory = useCallback(async (data: { systems: System[]; relationships: Relationship[] }): Promise<boolean> => {
    try {
      const res = await fetch('/api/inventory/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json() as { data?: object; error?: string };
      if (json.error) throw new Error(json.error);
      await fetchSystems();
      await fetchGraph();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
      return false;
    }
  }, [fetchSystems, fetchGraph]);

  const exportInventory = useCallback(async (): Promise<{ systems: System[]; relationships: Relationship[] } | null> => {
    try {
      const res = await fetch('/api/inventory/export');
      const json = await res.json() as { data?: { systems: System[]; relationships: Relationship[] }; error?: string };
      if (json.error) throw new Error(json.error);
      return json.data ?? null;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed');
      return null;
    }
  }, []);

  return {
    systems, graphData, isLoading, error,
    fetchSystems, fetchGraph,
    createSystem, updateSystem, deleteSystem,
    createRelationship, deleteRelationship,
    importInventory, exportInventory,
  };
}
