'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrdAnalysisMeta } from '@/types/analysis';
import { DocSet } from '@/types/docs';
import { FileText, Layers, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DocEntry {
  analysis: BrdAnalysisMeta;
  docSet: DocSet | null;
}

export default function DocsIndexPage() {
  const [entries, setEntries] = useState<DocEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analyses')
      .then((r) => r.json())
      .then(async (j: { data?: BrdAnalysisMeta[] }) => {
        const analyses = j.data ?? [];
        const results = await Promise.all(
          analyses.map(async (a) => {
            const res = await fetch(`/api/docs/${a.id}`);
            const dj = await res.json() as { data?: DocSet };
            return { analysis: a, docSet: dj.data ?? null };
          })
        );
        setEntries(results);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const withDocs = entries.filter((e) => e.docSet && e.docSet.docs.length > 0);
  const withoutDocs = entries.filter((e) => !e.docSet || e.docSet.docs.length === 0);

  return (
    <div className="overflow-auto h-full">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Architecture Documents</h1>
            <p className="text-sm text-muted-foreground">AI-generated docs from enriched BRDs</p>
          </div>
        </div>

        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading…</div>
        )}

        {!isLoading && entries.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No documents yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Analyze a BRD, complete the PO session, then generate documents.
            </p>
            <Link href="/analyze">
              <Button size="sm" variant="outline">Analyze a BRD</Button>
            </Link>
          </div>
        )}

        {withDocs.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              With Documents
            </h2>
            {withDocs.map(({ analysis, docSet }) => (
              <Link key={analysis.id} href={`/docs/${analysis.id}`}>
                <div className="group rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{analysis.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {docSet?.docs.length ?? 0}/5 docs
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            v{docSet?.enrichedBrdVersion ?? 1}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {docSet ? new Date(docSet.lastUpdatedAt).toLocaleDateString('vi-VN') : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {withoutDocs.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Document Generation
            </h2>
            {withoutDocs.map(({ analysis }) => (
              <Link key={analysis.id} href={`/docs/${analysis.id}`}>
                <div className="group rounded-xl border border-dashed border-border bg-card/50 p-4 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground/50 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground truncate">{analysis.title}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          No documents generated yet
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
