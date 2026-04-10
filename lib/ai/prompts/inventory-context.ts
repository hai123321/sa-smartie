import { System, Relationship } from '@/types/inventory';

export function buildInventoryContext(
  systems: System[],
  relationships: Relationship[]
): string {
  if (systems.length === 0) {
    return 'No systems have been added to the inventory yet.';
  }

  const systemMap = new Map(systems.map((s) => [s.id, s]));

  const systemDescriptions = systems
    .map((s) => {
      const rels = relationships.filter(
        (r) => r.sourceId === s.id || r.targetId === s.id
      );
      const relDescriptions = rels.map((r) => {
        const other = r.sourceId === s.id
          ? systemMap.get(r.targetId)?.name ?? r.targetId
          : systemMap.get(r.sourceId)?.name ?? r.sourceId;
        const direction = r.sourceId === s.id ? `→ ${other}` : `← ${other}`;
        return `  - ${r.predicate} ${direction}${r.protocol ? ` (${r.protocol})` : ''}`;
      });

      return [
        `**${s.name}** (${s.type}, ${s.status})`,
        `  Tech: ${s.techStack.join(', ') || 'unspecified'}`,
        s.team ? `  Team: ${s.team}` : '',
        s.description ? `  Description: ${s.description}` : '',
        relDescriptions.length > 0 ? `  Connections:\n${relDescriptions.join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  return `## Current System Inventory (${systems.length} systems)\n\n${systemDescriptions}`;
}

export function buildRelevantContext(
  systems: System[],
  relationships: Relationship[],
  query: string
): string {
  const q = query.toLowerCase();
  const relevant = systems.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.techStack.some((t) => t.toLowerCase().includes(q)) ||
      s.team.toLowerCase().includes(q) ||
      s.type.includes(q)
  );

  if (relevant.length === 0 && systems.length > 0) {
    // Return all if no keyword match — let Claude decide what's relevant
    return buildInventoryContext(systems, relationships);
  }

  const relevantIds = new Set(relevant.map((s) => s.id));
  const relevantRels = relationships.filter(
    (r) => relevantIds.has(r.sourceId) || relevantIds.has(r.targetId)
  );

  return buildInventoryContext(
    relevant.length > 0 ? relevant : systems,
    relevantRels
  );
}
