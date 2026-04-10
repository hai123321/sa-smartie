'use client';

import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { System, Relationship } from '@/types/inventory';

interface GraphVisualizationProps {
  systems: readonly System[];
  relationships: readonly Relationship[];
  onSelectSystem?: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  deprecated: '#ef4444',
  planned: '#3b82f6',
};

const TYPE_ABBREV: Record<string, string> = {
  'web-app': 'WEB',
  'mobile-app': 'MOB',
  'api': 'API',
  'database': 'DB',
  'message-broker': 'MQ',
  'identity': 'IAM',
  'file-storage': 'FS',
  'cdn': 'CDN',
  'monitoring': 'MON',
  'third-party': '3P',
  'legacy': 'LEG',
  'other': 'SVC',
};

function buildLayout(
  systems: readonly System[],
  relationships: readonly Relationship[]
): { nodes: Node[]; edges: Edge[] } {
  // Simple grid layout — space systems in columns
  const cols = Math.ceil(Math.sqrt(systems.length)) || 1;
  const H_GAP = 220;
  const V_GAP = 140;

  const nodes: Node[] = systems.map((s, i) => ({
    id: s.id,
    type: 'default',
    position: {
      x: (i % cols) * H_GAP + 50,
      y: Math.floor(i / cols) * V_GAP + 50,
    },
    data: { label: s.name },
    style: {
      background: '#fff',
      border: `2px solid ${STATUS_COLORS[s.status] ?? '#d1d5db'}`,
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      fontWeight: 500,
      minWidth: 140,
    },
  }));

  const edges: Edge[] = relationships.map((r) => ({
    id: r.id,
    source: r.sourceId,
    target: r.targetId,
    label: `${r.predicate}${r.protocol ? ` · ${r.protocol}` : ''}`,
    labelStyle: { fontSize: 9, fill: '#6b7280' },
    labelBgStyle: { fill: '#f9fafb', fillOpacity: 0.8 },
    labelBgPadding: [2, 4] as [number, number],
    markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#94a3b8' },
    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    type: 'smoothstep',
  }));

  return { nodes, edges };
}

export function GraphVisualization({
  systems, relationships, onSelectSystem,
}: GraphVisualizationProps) {
  const { nodes: initNodes, edges: initEdges } = buildLayout(systems, relationships);
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  // Re-layout when data changes
  useEffect(() => {
    const { nodes: n, edges: e } = buildLayout(systems, relationships);
    setNodes(n);
    setEdges(e);
  }, [systems, relationships, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectSystem?.(node.id);
    },
    [onSelectSystem]
  );

  if (systems.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Add systems to see the graph visualization
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.3}
      maxZoom={2}
    >
      <Controls />
      <MiniMap
        nodeStrokeWidth={2}
        zoomable
        pannable
        style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
      />
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
    </ReactFlow>
  );
}
