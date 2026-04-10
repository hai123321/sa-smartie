'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { System, RelationshipType, CreateRelationshipInput } from '@/types/inventory';

const PREDICATE_LABELS: Record<RelationshipType, string> = {
  'integrates-with': 'integrates with',
  'depends-on': 'depends on',
  'publishes-to': 'publishes to',
  'consumes-from': 'consumes from',
  'authenticates-via': 'authenticates via',
  'stores-data-in': 'stores data in',
  'proxied-by': 'proxied by',
  'monitored-by': 'monitored by',
};

interface RelationshipFormProps {
  systems: System[];
  onSubmit: (data: CreateRelationshipInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  preselectedSourceId?: string;
}

export function RelationshipForm({
  systems, onSubmit, onCancel, isLoading, preselectedSourceId,
}: RelationshipFormProps) {
  const [sourceId, setSourceId] = useState(preselectedSourceId ?? '');
  const [predicate, setPredicate] = useState<RelationshipType>('integrates-with');
  const [targetId, setTargetId] = useState('');
  const [protocol, setProtocol] = useState('');
  const [dataFormat, setDataFormat] = useState('');
  const [description, setDescription] = useState('');

  const isValid = sourceId && targetId && sourceId !== targetId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    await onSubmit({
      sourceId,
      targetId,
      predicate,
      protocol: protocol || undefined,
      dataFormat: dataFormat || undefined,
      description: description || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 items-end gap-2">
        <div>
          <Label>Source System *</Label>
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {systems.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Relationship *</Label>
          <Select value={predicate} onValueChange={(v) => setPredicate(v as RelationshipType)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PREDICATE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Target System *</Label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {systems
                .filter((s) => s.id !== sourceId)
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rel-protocol">Protocol</Label>
          <Input
            id="rel-protocol"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            placeholder="REST, gRPC, AMQP..."
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="rel-format">Data Format</Label>
          <Input
            id="rel-format"
            value={dataFormat}
            onChange={(e) => setDataFormat(e.target.value)}
            placeholder="JSON, Protobuf, Avro..."
            className="mt-1"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="rel-desc">Description</Label>
          <Input
            id="rel-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this integration..."
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!isValid || isLoading}>
          Add Relationship
        </Button>
      </div>
    </form>
  );
}
