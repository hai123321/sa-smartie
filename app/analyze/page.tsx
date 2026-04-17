'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BrdUploader } from '@/components/analyze/BrdUploader';
import { AnalysisResult } from '@/components/analyze/AnalysisResult';
import { BrdAnalysis, BrdAnalysisMeta } from '@/types/analysis';
import { useAnalysis } from '@/hooks/useAnalysis';
import { FileText, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function AnalyzePage() {
  const router = useRouter();
  const { analyses, isAnalyzing, error, fetchAnalyses, analyze, deleteAnalysis, exportAnalysis } =
    useAnalysis();
  const [currentAnalysis, setCurrentAnalysis] = useState<BrdAnalysis | null>(null);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  async function handleAnalyze(content: string, title?: string) {
    const result = await analyze(content, title);
    if (result) {
      setCurrentAnalysis(result);
      toast.success('Analysis complete!');
    }
  }

  async function handleExport() {
    if (!currentAnalysis) return;
    const result = await exportAnalysis(currentAnalysis.id);
    if (result) {
      const blob = new Blob([result.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported!');
    }
  }

  async function handleLoadAnalysis(meta: BrdAnalysisMeta) {
    const res = await fetch(`/api/analyses/${meta.id}`);
    const json = await res.json() as { data?: BrdAnalysis };
    if (json.data) setCurrentAnalysis(json.data);
  }

  async function handleDelete(id: string) {
    await deleteAnalysis(id);
    if (currentAnalysis?.id === id) setCurrentAnalysis(null);
    toast.success('Deleted');
  }

  function handleDiscussWithAI() {
    if (!currentAnalysis) return;
    router.push(`/chat?analysisId=${currentAnalysis.id}`);
  }

  function handleStartSession() {
    if (!currentAnalysis) return;
    router.push(`/session/${currentAnalysis.id}`);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar: history */}
      <div className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium">History</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => { setCurrentAnalysis(null); }}
          >
            + New
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {analyses.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground text-center">
                No analyses yet
              </p>
            )}
            {analyses.map((a) => (
              <div
                key={a.id}
                className={cn(
                  'group flex items-start gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent',
                  currentAnalysis?.id === a.id && 'bg-primary/10 text-primary'
                )}
                onClick={() => handleLoadAnalysis(a)}
              >
                <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-60" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {a.questionCount} questions · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-60 hover:!opacity-100 shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">BRD Analyzer</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Paste your BRD to generate targeted stakeholder questions
            </p>
          </div>

          {!currentAnalysis ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <BrdUploader onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{currentAnalysis.title}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentAnalysis(null)}
                >
                  Analyze New BRD
                </Button>
              </div>
              <AnalysisResult
                analysis={currentAnalysis}
                onExport={handleExport}
                onDiscussWithAI={handleDiscussWithAI}
                onStartSession={handleStartSession}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
