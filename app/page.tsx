'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrdAnalysisMeta } from '@/types/analysis';
import { ConversationMeta } from '@/types/chat';
import { System } from '@/types/inventory';
import { FileText, MessageSquare, Network, Plus, ArrowRight, Brain, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<BrdAnalysisMeta[]>([]);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [systems, setSystems] = useState<System[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/analyses').then((r) => r.json()),
      fetch('/api/conversations').then((r) => r.json()),
      fetch('/api/inventory/systems').then((r) => r.json()),
    ]).then(([a, c, s]) => {
      setAnalyses((a as { data?: BrdAnalysisMeta[] }).data?.slice(0, 5) ?? []);
      setConversations((c as { data?: ConversationMeta[] }).data?.slice(0, 5) ?? []);
      setSystems((s as { data?: System[] }).data ?? []);
    });
  }, []);

  const techCounts = systems.reduce((acc, s) => {
    s.techStack.forEach((t) => { acc[t] = (acc[t] ?? 0) + 1; });
    return acc;
  }, {} as Record<string, number>);

  const topTech = Object.entries(techCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const statusCounts = systems.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="overflow-auto h-full">
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">SA Smartie</h1>
            <p className="text-sm text-muted-foreground">Solution Architect AI Assistant</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              href: '/analyze',
              icon: FileText,
              title: 'Analyze BRD',
              desc: 'Generate stakeholder questions from a BRD',
              color: 'bg-blue-50 text-blue-600',
            },
            {
              href: '/docs',
              icon: Layers,
              title: 'Architecture Docs',
              desc: 'PO session → enrich BRD → generate & cascade docs',
              color: 'bg-amber-50 text-amber-600',
            },
            {
              href: '/chat',
              icon: MessageSquare,
              title: 'Architecture Q&A',
              desc: 'Chat with AI about your architecture',
              color: 'bg-violet-50 text-violet-600',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className={cn('inline-flex h-9 w-9 items-center justify-center rounded-lg mb-3', item.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Inventory stats */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">System Inventory</h3>
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            {systems.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground mb-3">No systems added yet</p>
                <Link href="/inventory">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    Add first system
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-2xl font-bold">{systems.length}</p>
                    <p className="text-xs text-muted-foreground">Total systems</p>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <span key={status} className="flex items-center gap-1">
                        <span className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          status === 'active' ? 'bg-green-500' :
                          status === 'deprecated' ? 'bg-red-400' : 'bg-blue-400'
                        )} />
                        {count} {status}
                      </span>
                    ))}
                  </div>
                </div>
                {topTech.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                      Top technologies
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {topTech.map(([tech, count]) => (
                        <span key={tech} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                          {tech} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent analyses */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Recent Analyses</h3>
              <Link href="/analyze">
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            {analyses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground mb-3">No analyses yet</p>
                <Link href="/analyze">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    Analyze first BRD
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {analyses.map((a) => (
                  <Link key={a.id} href="/analyze">
                    <div className="flex items-center gap-2.5 rounded-md p-2 hover:bg-accent transition-colors cursor-pointer">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {a.questionCount}Q · {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent conversations */}
        {conversations.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Recent Conversations</h3>
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {conversations.map((c) => (
                <Link key={c.id} href="/chat">
                  <div className="flex items-start gap-2.5 rounded-md p-2.5 hover:bg-accent transition-colors cursor-pointer">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.messageCount} messages · {new Date(c.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
