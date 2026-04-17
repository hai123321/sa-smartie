'use client';

import { useState } from 'react';
import { CascadeResult, DocType, DOC_META } from '@/types/docs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Zap, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react';

interface CascadePanelProps {
  enrichedBrd: string;
  isCascading: boolean;
  cascadeResult: CascadeResult | null;
  onTrigger: (updatedBrd: string) => void;
}

export function CascadePanel({
  enrichedBrd,
  isCascading,
  cascadeResult,
  onTrigger,
}: CascadePanelProps) {
  const [brdText, setBrdText] = useState(enrichedBrd);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<DocType | null>(null);
  const hasChanges = brdText !== enrichedBrd;

  function handleCascade() {
    if (!brdText.trim()) return;
    onTrigger(brdText);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* BRD Editor */}
      <div className="p-4 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Enriched BRD</h3>
            <p className="text-xs text-muted-foreground">Edit to trigger cascade update</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Collapse' : 'Edit BRD'}
          </Button>
        </div>

        {isEditing && (
          <textarea
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={10}
            value={brdText}
            onChange={(e) => setBrdText(e.target.value)}
          />
        )}

        {!isEditing && (
          <div className="rounded-lg bg-muted/40 px-3 py-2 max-h-24 overflow-hidden relative">
            <p className="text-xs text-muted-foreground font-mono line-clamp-4 whitespace-pre-wrap">
              {brdText}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted/40 to-transparent" />
          </div>
        )}

        <div className="flex items-center justify-between">
          {hasChanges ? (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Unsaved changes detected
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No changes</span>
          )}
          <Button
            size="sm"
            onClick={handleCascade}
            disabled={isCascading || !brdText.trim()}
            className={cn('gap-1', hasChanges && 'bg-amber-500 hover:bg-amber-600')}
          >
            {isCascading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            {isCascading ? 'Analyzing…' : 'Run Cascade'}
          </Button>
        </div>
      </div>

      {/* Cascade Result */}
      {cascadeResult && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <h4 className="text-sm font-semibold">Cascade Complete</h4>
            </div>
            <p className="text-xs text-muted-foreground">{cascadeResult.changeDescription}</p>
          </div>

          {cascadeResult.impactedDocTypes.length === 0 ? (
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                No documents needed updating for this change.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium">
                Updated {cascadeResult.impactedDocTypes.length} document(s):
              </p>
              {cascadeResult.impacts.map((impact) => {
                const meta = DOC_META[impact.docType];
                const isExpanded = expandedDoc === impact.docType;
                return (
                  <div
                    key={impact.docType}
                    className="rounded-lg border border-border overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-card hover:bg-accent transition-colors"
                      onClick={() => setExpandedDoc(isExpanded ? null : impact.docType)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          Updated
                        </Badge>
                        <span className="text-sm font-medium">{meta.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border p-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          <span className="font-medium">Reason:</span> {impact.reason}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              Before
                            </p>
                            <div className="rounded bg-red-50 border border-red-100 p-2 max-h-40 overflow-y-auto">
                              <pre className="text-[10px] font-mono text-red-800 whitespace-pre-wrap">
                                {impact.before.slice(0, 600)}
                                {impact.before.length > 600 ? '…' : ''}
                              </pre>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              After
                            </p>
                            <div className="rounded bg-green-50 border border-green-100 p-2 max-h-40 overflow-y-auto">
                              <pre className="text-[10px] font-mono text-green-800 whitespace-pre-wrap">
                                {impact.after.slice(0, 600)}
                                {impact.after.length > 600 ? '…' : ''}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!cascadeResult && !isCascading && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Edit the BRD above and click Run Cascade to see AI update the affected documents automatically.
            </p>
          </div>
        </div>
      )}

      {isCascading && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
            <div>
              <p className="text-sm font-medium">Analyzing impact…</p>
              <p className="text-xs text-muted-foreground mt-1">
                AI is determining which documents need updating
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
