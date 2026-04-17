'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { useDocs } from '@/hooks/useDocs';
import { DocViewer } from '@/components/docs/DocViewer';
import { GenerationProgress } from '@/components/docs/GenerationProgress';
import { CascadePanel } from '@/components/docs/CascadePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrdAnalysis } from '@/types/analysis';
import { BrdSession } from '@/types/session';
import { DocType, DOC_META, DOC_ORDER } from '@/types/docs';
import { cn } from '@/lib/utils';
import {
  FileText, Layers, ListChecks, Database, Plug, FileCheck,
  Download, Zap, ChevronLeft, Loader2, RefreshCw,
} from 'lucide-react';

const DOC_ICONS: Record<DocType, React.ElementType> = {
  architecture: Layers,
  prd: ListChecks,
  'data-model': Database,
  'api-design': Plug,
  adr: FileCheck,
};

type Props = { params: Promise<{ analysisId: string }> };

function DocsContent({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoGenerate = searchParams.get('generate') === '1';

  const [analysis, setAnalysis] = useState<BrdAnalysis | null>(null);
  const [session, setSession] = useState<BrdSession | null>(null);
  const [activeTab, setActiveTab] = useState<DocType | 'cascade'>('architecture');

  const {
    docSet,
    isLoading,
    isGenerating,
    generatingDoc,
    generationProgress,
    isCascading,
    cascadeResult,
    error,
    loadDocs,
    generateDocs,
    triggerCascade,
  } = useDocs(analysisId);

  useEffect(() => {
    Promise.all([
      fetch(`/api/analyses/${analysisId}`).then((r) => r.json()),
      fetch(`/api/session/${analysisId}`).then((r) => r.json()),
    ]).then(([a, s]: [{ data?: BrdAnalysis }, { data?: BrdSession }]) => {
      if (a.data) setAnalysis(a.data);
      if (s.data) setSession(s.data);
    });
    loadDocs();
  }, [analysisId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (autoGenerate && !isGenerating && !docSet) {
      generateDocs();
    }
  }, [autoGenerate, docSet]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (cascadeResult && cascadeResult.impactedDocTypes.length > 0) {
      toast.success(`Updated ${cascadeResult.impactedDocTypes.length} document(s)`);
    } else if (cascadeResult) {
      toast.info('No documents needed updating');
    }
  }, [cascadeResult]);

  function downloadDoc(docType: DocType) {
    const doc = docSet?.docs.find((d) => d.type === docType);
    if (!doc) return;
    const meta = DOC_META[docType];
    const blob = new Blob([doc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis?.title ?? 'doc'}-${meta.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasNoDocs = !docSet || docSet.docs.length === 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/analyze')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3 w-3" />
            Back
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-semibold">{analysis?.title ?? 'Loading…'}</h1>
          </div>
          {docSet && (
            <Badge variant="secondary" className="text-xs">
              v{docSet.enrichedBrdVersion}
            </Badge>
          )}
          {docSet && (
            <span className="text-xs text-muted-foreground">
              {docSet.docs.length}/5 docs · Updated {new Date(docSet.lastUpdatedAt).toLocaleString('vi-VN')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!hasNoDocs && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 gap-1"
              onClick={generateDocs}
              disabled={isGenerating}
            >
              <RefreshCw className={cn('h-3 w-3', isGenerating && 'animate-spin')} />
              Regenerate All
            </Button>
          )}
          {hasNoDocs && !isGenerating && (
            <Button size="sm" className="gap-1" onClick={generateDocs}>
              <Layers className="h-3.5 w-3.5" />
              Generate Documents
            </Button>
          )}
        </div>
      </div>

      {/* Generation in progress */}
      {isGenerating && (
        <div className="flex-1 overflow-y-auto p-6 flex items-start justify-center">
          <div className="w-full max-w-lg pt-4">
            <GenerationProgress
              generatingDoc={generatingDoc}
              completedDocs={generationProgress}
            />
          </div>
        </div>
      )}

      {/* No docs yet */}
      {!isGenerating && hasNoDocs && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 max-w-sm">
            <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <div>
              <p className="text-sm font-medium">No documents yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                {session?.sessionStatus === 'finalized'
                  ? 'Click "Generate Documents" to create all architecture documents from the enriched BRD.'
                  : 'Complete the PO Q&A session first to enrich the BRD, then generate documents.'}
              </p>
            </div>
            {session?.sessionStatus !== 'finalized' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/session/${analysisId}`)}
              >
                Start Q&A Session
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Docs tabs */}
      {!isGenerating && !hasNoDocs && (
        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as DocType | 'cascade')}
            className="flex flex-col h-full"
          >
            <div className="border-b border-border bg-card px-6 shrink-0">
              <TabsList className="h-9 bg-transparent p-0 gap-0">
                {DOC_ORDER.map((docType) => {
                  const Icon = DOC_ICONS[docType];
                  const doc = docSet.docs.find((d) => d.type === docType);
                  return (
                    <TabsTrigger
                      key={docType}
                      value={docType}
                      className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs gap-1.5"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {DOC_META[docType].title}
                      {doc && (
                        <span className="text-[9px] text-muted-foreground">v{doc.version}</span>
                      )}
                    </TabsTrigger>
                  );
                })}
                <TabsTrigger
                  value="cascade"
                  className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent px-4 text-xs gap-1.5 ml-auto"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Cascade Update
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              {DOC_ORDER.map((docType) => {
                const doc = docSet.docs.find((d) => d.type === docType);
                return (
                  <TabsContent
                    key={docType}
                    value={docType}
                    className="h-full m-0 overflow-y-auto"
                  >
                    {doc ? (
                      <div className="max-w-3xl mx-auto px-6 py-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Version {doc.version}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(doc.generatedAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => downloadDoc(docType)}
                          >
                            <Download className="h-3 w-3" />
                            Export
                          </Button>
                        </div>
                        <DocViewer doc={doc} />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-muted-foreground">Document not yet generated.</p>
                      </div>
                    )}
                  </TabsContent>
                );
              })}

              <TabsContent value="cascade" className="h-full m-0 overflow-hidden">
                <CascadePanel
                  enrichedBrd={session?.enrichedBrd ?? analysis?.rawContent ?? ''}
                  isCascading={isCascading}
                  cascadeResult={cascadeResult}
                  onTrigger={triggerCascade}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}

export default function DocsPage({ params }: Props) {
  const { analysisId } = use(params);
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <DocsContent analysisId={analysisId} />
    </Suspense>
  );
}
