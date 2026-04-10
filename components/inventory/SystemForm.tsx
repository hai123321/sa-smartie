'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { System, SystemType, SystemStatus, CreateSystemInput } from '@/types/inventory';

const SYSTEM_TYPES: { value: SystemType; label: string }[] = [
  { value: 'web-app', label: 'Web Application' },
  { value: 'mobile-app', label: 'Mobile App' },
  { value: 'api', label: 'API Service' },
  { value: 'database', label: 'Database' },
  { value: 'message-broker', label: 'Message Broker' },
  { value: 'identity', label: 'Identity / Auth' },
  { value: 'file-storage', label: 'File Storage' },
  { value: 'cdn', label: 'CDN' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'third-party', label: 'Third-party Service' },
  { value: 'legacy', label: 'Legacy System' },
  { value: 'other', label: 'Other' },
];

interface SystemFormProps {
  initial?: System;
  onSubmit: (data: CreateSystemInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SystemForm({ initial, onSubmit, onCancel, isLoading }: SystemFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<SystemType>(initial?.type ?? 'api');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [team, setTeam] = useState(initial?.team ?? '');
  const [status, setStatus] = useState<SystemStatus>(initial?.status ?? 'active');
  const [version, setVersion] = useState(initial?.version ?? '');
  const [techStack, setTechStack] = useState<string[]>(initial?.techStack ? [...initial.techStack] : []);
  const [techInput, setTechInput] = useState('');

  function addTech(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && techInput.trim()) {
      e.preventDefault();
      const val = techInput.trim().replace(/,$/, '');
      if (val && !techStack.includes(val)) {
        setTechStack([...techStack, val]);
      }
      setTechInput('');
    }
  }

  function removeTech(tech: string) {
    setTechStack(techStack.filter((t) => t !== tech));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit({ name: name.trim(), type, description, team, status, version: version || undefined, techStack });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="sys-name">Name *</Label>
          <Input
            id="sys-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Payment Gateway"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="sys-type">Type *</Label>
          <Select value={type} onValueChange={(v) => setType(v as SystemType)}>
            <SelectTrigger id="sys-type" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYSTEM_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sys-status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as SystemStatus)}>
            <SelectTrigger id="sys-status" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="deprecated">Deprecated</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sys-team">Team</Label>
          <Input
            id="sys-team"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="e.g., Payments Team"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="sys-version">Version</Label>
          <Input
            id="sys-version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g., v2.3.1"
            className="mt-1"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="sys-desc">Description</Label>
          <Textarea
            id="sys-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this system does..."
            rows={2}
            className="mt-1"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="sys-tech">Tech Stack</Label>
          <Input
            id="sys-tech"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={addTech}
            placeholder="Type a technology and press Enter (e.g. Java, Spring Boot)"
            className="mt-1"
          />
          {techStack.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {techStack.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1 pr-1">
                  {t}
                  <button type="button" onClick={() => removeTech(t)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!name.trim() || isLoading}>
          {initial ? 'Save Changes' : 'Add System'}
        </Button>
      </div>
    </form>
  );
}
