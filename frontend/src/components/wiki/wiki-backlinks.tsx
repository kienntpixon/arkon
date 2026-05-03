"use client";

import React from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { WikiGraphData } from "@/types/wiki";
import { WikiGraphMini } from "./wiki-graph";

type Props = {
  slug: string;
  backlinks: string[];
  outlinks: string[];
  sourceIds: string[];
};

function LinkItem({
  slug,
  direction,
}: {
  slug: string;
  direction: "back" | "forward";
}) {
  const label = slug.split("/").pop() ?? slug;
  return (
    <Link
      href={`/wiki/${slug}`}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors group"
    >
      <span className="material-symbols-outlined text-xs text-muted-foreground group-hover:text-primary transition-colors">
        {direction === "back" ? "arrow_back" : "arrow_forward"}
      </span>
      <span className="truncate" title={slug}>
        {label}
      </span>
    </Link>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  if (count === 0) return null;
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="material-symbols-outlined text-xs">{icon}</span>
        {title}
        <span className="ml-auto tabular-nums">{count}</span>
        <span className="material-symbols-outlined text-xs">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

export function WikiBacklinks({ slug, backlinks, outlinks, sourceIds }: Props) {
  const [graphData, setGraphData] = React.useState<WikiGraphData | null>(null);

  React.useEffect(() => {
    api<WikiGraphData>(`/api/wiki/graph?slug=${encodeURIComponent(slug)}&depth=1`)
      .then((d) => setGraphData(d))
      .catch(() => setGraphData(null));
  }, [slug]);

  const isEmpty = backlinks.length === 0 && outlinks.length === 0;

  return (
    <div className="w-64 shrink-0 border-l border-border bg-card/30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="material-symbols-outlined text-sm text-muted-foreground">
          link
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Connections
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {isEmpty ? (
          <p className="text-xs text-muted-foreground py-2">No connections yet.</p>
        ) : (
          <>
            <Section title="Backlinks" icon="arrow_back" count={backlinks.length}>
              {backlinks.map((s) => (
                <LinkItem key={s} slug={s} direction="back" />
              ))}
            </Section>
            <Section title="Outlinks" icon="arrow_forward" count={outlinks.length}>
              {outlinks.map((s) => (
                <LinkItem key={s} slug={s} direction="forward" />
              ))}
            </Section>
          </>
        )}

        {/* Sources */}
        {sourceIds.length > 0 && (
          <div>
            <div className="flex items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="material-symbols-outlined text-xs">description</span>
              Sources
              <span className="ml-auto tabular-nums">{sourceIds.length}</span>
            </div>
            <Link
              href="/knowledge"
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
            >
              <span className="material-symbols-outlined text-xs">open_in_new</span>
              View in Knowledge Base
            </Link>
          </div>
        )}

        {/* Mini graph */}
        {graphData && graphData.nodes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 pt-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-t border-border">
              <span className="material-symbols-outlined text-xs">hub</span>
              Graph
            </div>
            <div className="rounded-xl overflow-hidden">
              <WikiGraphMini
                slug={slug}
                nodes={graphData.nodes}
                edges={graphData.edges}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
