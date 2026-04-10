'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { useInventory } from '@/hooks/useInventory';
import { SystemCard } from '@/components/inventory/SystemCard';
import { SystemForm } from '@/components/inventory/SystemForm';
import { RelationshipForm } from '@/components/inventory/RelationshipForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { System, CreateSystemInput, CreateRelationshipInput } from '@/types/inventory';
import { Plus, GitFork, Search, Upload, Download, Network, List } from 'lucide-react';

// Heavy: load lazily to avoid SSR issues with ReactFlow
const GraphVisualization = dynamic(
  () => import('@/components/inventory/GraphVisualization').then((m) => m.GraphVisualization),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading graph...</div> }
);

type ViewMode = 'list' | 'graph';
type DialogMode = 'none' | 'add-system' | 'edit-system' | 'add-relationship' | 'import';

export default function InventoryPage() {
  const {
    systems, graphData, isLoading, error,
    fetchSystems, fetchGraph,
    createSystem, updateSystem, deleteSystem,
    createRelationship, deleteRelationship,
    importInventory, exportInventory,
  } = useInventory();

  const [view, setView] = useState<ViewMode>('list');
  const [dialog, setDialog] = useState<DialogMode>('none');
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);

  useEffect(() => {
    fetchSystems();
    fetchGraph();
  }, [fetchSystems, fetchGraph]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const filteredSystems = systems.filter(
    (s) =>
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.techStack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const relCountMap = graphData.edges.reduce((acc, r) => {
    acc[r.sourceId] = (acc[r.sourceId] ?? 0) + 1;
    acc[r.targetId] = (acc[r.targetId] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  async function handleCreateSystem(input: CreateSystemInput) {
    const result = await createSystem(input);
    if (result) {
      await fetchGraph();
      setDialog('none');
      toast.success(`"${result.name}" added`);
    }
  }

  async function handleUpdateSystem(input: CreateSystemInput) {
    if (!editingSystem) return;
    const result = await updateSystem(editingSystem.id, input);
    if (result) {
      await fetchGraph();
      setDialog('none');
      setEditingSystem(null);
      toast.success('System updated');
    }
  }

  async function handleDeleteSystem(id: string) {
    if (!confirm('Delete this system and all its relationships?')) return;
    await deleteSystem(id);
    await fetchGraph();
    if (selectedSystemId === id) setSelectedSystemId(null);
    toast.success('System deleted');
  }

  async function handleCreateRelationship(input: CreateRelationshipInput) {
    const result = await createRelationship(input);
    if (result) {
      await fetchGraph();
      setDialog('none');
      toast.success('Relationship added');
    }
  }

  async function handleExport() {
    const data = await exportInventory();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported');
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const ok = await importInventory(data);
      if (ok) toast.success('Inventory imported');
    } catch {
      toast.error('Invalid import file');
    }
    e.target.value = '';
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-3">
        <h1 className="text-base font-semibold">System Inventory</h1>
        <div className="relative ml-2 w-60">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search systems..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)} className="ml-2">
          <TabsList className="h-8">
            <TabsTrigger value="list" className="h-7 px-3 text-xs">
              <List className="mr-1 h-3.5 w-3.5" /> List
            </TabsTrigger>
            <TabsTrigger value="graph" className="h-7 px-3 text-xs">
              <Network className="mr-1 h-3.5 w-3.5" /> Graph
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          <label>
            <input type="file" accept=".json" className="hidden" onChange={handleImportFile} />
            <Button variant="outline" size="sm" className="cursor-pointer" asChild>
              <span>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Import
              </span>
            </Button>
          </label>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDialog('add-relationship')}>
            <GitFork className="mr-1.5 h-3.5 w-3.5" />
            Add Relationship
          </Button>
          <Button size="sm" onClick={() => setDialog('add-system')}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add System
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'list' ? (
          <ScrollArea className="h-full">
            <div className="grid grid-cols-2 gap-3 p-6 xl:grid-cols-3">
              {isLoading && (
                <p className="col-span-full text-sm text-muted-foreground">Loading...</p>
              )}
              {!isLoading && filteredSystems.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <Network className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No systems match your search' : 'No systems yet. Add your first system.'}
                  </p>
                </div>
              )}
              {filteredSystems.map((s) => (
                <SystemCard
                  key={s.id}
                  system={s}
                  relationshipCount={relCountMap[s.id] ?? 0}
                  isSelected={selectedSystemId === s.id}
                  onClick={() => setSelectedSystemId(s.id === selectedSystemId ? null : s.id)}
                  onEdit={() => { setEditingSystem(s); setDialog('edit-system'); }}
                  onDelete={() => handleDeleteSystem(s.id)}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full">
            <GraphVisualization
              systems={graphData.nodes}
              relationships={graphData.edges}
              onSelectSystem={setSelectedSystemId}
            />
          </div>
        )}
      </div>

      {/* Add System Dialog */}
      <Dialog open={dialog === 'add-system'} onOpenChange={(o) => !o && setDialog('none')}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add System</DialogTitle>
          </DialogHeader>
          <SystemForm
            onSubmit={handleCreateSystem}
            onCancel={() => setDialog('none')}
          />
        </DialogContent>
      </Dialog>

      {/* Edit System Dialog */}
      <Dialog
        open={dialog === 'edit-system'}
        onOpenChange={(o) => { if (!o) { setDialog('none'); setEditingSystem(null); } }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit System</DialogTitle>
          </DialogHeader>
          {editingSystem && (
            <SystemForm
              initial={editingSystem}
              onSubmit={handleUpdateSystem}
              onCancel={() => { setDialog('none'); setEditingSystem(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Relationship Dialog */}
      <Dialog open={dialog === 'add-relationship'} onOpenChange={(o) => !o && setDialog('none')}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Relationship</DialogTitle>
          </DialogHeader>
          {systems.length < 2 ? (
            <p className="text-sm text-muted-foreground py-4">
              You need at least 2 systems to create a relationship.
            </p>
          ) : (
            <RelationshipForm
              systems={systems}
              preselectedSourceId={selectedSystemId ?? undefined}
              onSubmit={handleCreateRelationship}
              onCancel={() => setDialog('none')}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
