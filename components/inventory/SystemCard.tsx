'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { System } from '@/types/inventory';
import {
  Globe, Smartphone, Zap, Database, MessageSquare, Shield,
  HardDrive, Network, Activity, Package, Archive, Box, Pencil, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<string, React.ElementType> = {
  'web-app': Globe,
  'mobile-app': Smartphone,
  'api': Zap,
  'database': Database,
  'message-broker': MessageSquare,
  'identity': Shield,
  'file-storage': HardDrive,
  'cdn': Network,
  'monitoring': Activity,
  'third-party': Package,
  'legacy': Archive,
  'other': Box,
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  deprecated: 'bg-red-100 text-red-700',
  planned: 'bg-blue-100 text-blue-700',
};

interface SystemCardProps {
  system: System;
  relationshipCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
}

export function SystemCard({
  system, relationshipCount = 0, onEdit, onDelete, onClick, isSelected,
}: SystemCardProps) {
  const Icon = TYPE_ICONS[system.type] ?? Box;

  return (
    <div
      className={cn(
        'group rounded-lg border border-border bg-card p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-primary/40',
        isSelected && 'border-primary/60 bg-primary/5'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium leading-tight truncate">{system.name}</p>
              {system.team && (
                <p className="text-xs text-muted-foreground mt-0.5">{system.team}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium',
                STATUS_COLORS[system.status]
              )}>
                {system.status}
              </span>
            </div>
          </div>

          {system.description && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
              {system.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {system.techStack.slice(0, 4).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px] py-0 px-1.5">
                {t}
              </Badge>
            ))}
            {system.techStack.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{system.techStack.length - 4}
              </span>
            )}
            {relationshipCount > 0 && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                {relationshipCount} connection{relationshipCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="mt-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Pencil className="mr-1 h-3 w-3" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
