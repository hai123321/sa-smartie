'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QuestionCard } from './QuestionCard';
import { BrdAnalysis, QuestionCategory } from '@/types/analysis';
import {
  Download, MessageSquare, AlertTriangle, Info, CheckCircle2, Users
} from 'lucide-react';

interface AnalysisResultProps {
  analysis: BrdAnalysis;
  onExport: () => void;
  onDiscussWithAI?: () => void;
  onStartSession?: () => void;
}

const categoryConfig: Record<QuestionCategory, { label: string; color: string }> = {
  'business-logic': { label: 'Business Logic', color: 'bg-blue-100 text-blue-700' },
  'technical-constraints': { label: 'Technical', color: 'bg-purple-100 text-purple-700' },
  nfr: { label: 'NFR', color: 'bg-orange-100 text-orange-700' },
  integrations: { label: 'Integrations', color: 'bg-teal-100 text-teal-700' },
};

const priorityOrder = { critical: 0, important: 1, 'nice-to-have': 2 };

export function AnalysisResult({ analysis, onExport, onDiscussWithAI, onStartSession }: AnalysisResultProps) {
  const criticalCount = analysis.questions.filter(q => q.priority === 'critical').length;
  const importantCount = analysis.questions.filter(q => q.priority === 'important').length;
  const nthCount = analysis.questions.filter(q => q.priority === 'nice-to-have').length;

  const categories: QuestionCategory[] = [
    'business-logic', 'technical-constraints', 'nfr', 'integrations',
  ];

  const questionsByCategory = categories.reduce((acc, cat) => {
    const qs = analysis.questions
      .filter(q => q.category === cat)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    if (qs.length > 0) acc[cat] = qs;
    return acc;
  }, {} as Record<QuestionCategory, typeof analysis.questions[0][]>);

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
        <div>
          <p className="text-xs text-muted-foreground">Questions generated</p>
          <p className="text-2xl font-bold">{analysis.questions.length}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
            {criticalCount} Critical
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
            {importantCount} Important
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
            {nthCount} Nice-to-have
          </Badge>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          {onStartSession && (
            <Button size="sm" onClick={onStartSession} className="gap-1.5 bg-primary">
              <Users className="h-3.5 w-3.5" />
              Start PO Session
            </Button>
          )}
          {onDiscussWithAI && (
            <Button variant="outline" size="sm" onClick={onDiscussWithAI}>
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Discuss with AI
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Questions ({analysis.questions.length})</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="ambiguities">
            Ambiguities ({analysis.ambiguities.length})
          </TabsTrigger>
        </TabsList>

        {/* Questions tab */}
        <TabsContent value="questions" className="mt-4 space-y-6">
          {categories
            .filter((cat) => questionsByCategory[cat])
            .map((cat) => {
              const config = categoryConfig[cat];
              const questions = questionsByCategory[cat];
              return (
                <div key={cat}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {questions.length} question{questions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <QuestionCard key={q.id} question={q} index={i} />
                    ))}
                  </div>
                </div>
              );
            })}
        </TabsContent>

        {/* Summary tab */}
        <TabsContent value="summary" className="mt-4">
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Scope
              </p>
              <p className="text-sm">{analysis.summary.scope}</p>
            </div>

            {analysis.summary.actors.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Actors & Stakeholders
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.summary.actors.map((a) => (
                    <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.summary.businessRules.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Business Rules
                </p>
                <ul className="space-y-1">
                  {analysis.summary.businessRules.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-500" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.summary.integrations.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  External Integrations
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.summary.integrations.map((i) => (
                    <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Ambiguities tab */}
        <TabsContent value="ambiguities" className="mt-4">
          {analysis.ambiguities.length === 0 ? (
            <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No ambiguities identified</p>
            </div>
          ) : (
            <div className="space-y-2">
              {analysis.ambiguities.map((a) => {
                const config = categoryConfig[a.category];
                return (
                  <div key={a.id} className="rounded-md border border-border bg-card p-3.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{a.id}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm">{a.issue}</p>
                        {a.quote && (
                          <blockquote className="mt-2 border-l-2 border-amber-200 pl-2 text-xs italic text-muted-foreground">
                            "{a.quote}"
                          </blockquote>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
