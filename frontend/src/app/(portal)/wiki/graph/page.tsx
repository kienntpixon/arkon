"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { WikiGraphData } from "@/types/wiki";
import { WikiGraph } from "@/components/wiki/wiki-graph";
import { wikiTypeColor, wikiTypeGroupLabel } from "@/components/wiki/wiki-type-badge";

const PAGE_TYPES = ["entity", "concept", "topic", "source"];

export default function WikiGraphPage() {
  const router = useRouter();
  const [graphData, setGraphData] = React.useState<WikiGraphData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTypes, setActiveTypes] = React.useState<Set<string>>(new Set(PAGE_TYPES));
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightSlug, setHighlightSlug] = React.useState<string | null>(null);

  React.useEffect(() => {
    api<WikiGraphData>("/api/wiki/graph")
      .then((d) => setGraphData(d))
      .catch(() => setGraphData(null))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = React.useMemo(() => {
    if (!graphData) return null;
    const nodes = graphData.nodes.filter((n) => activeTypes.has(n.page_type));
    const slugSet = new Set(nodes.map((n) => n.slug));
    const edges = graphData.edges.filter(
      (e) => slugSet.has(e.from) && slugSet.has(e.to)
    );
    return { nodes, edges };
  }, [graphData, activeTypes]);

  const searchMatches = React.useMemo(() => {
    if (!searchQuery || !graphData) return null;
    const q = searchQuery.toLowerCase();
    return graphData.nodes
      .filter((n) => n.title.toLowerCase().includes(q) || n.slug.includes(q))
      .map((n) => n.slug);
  }, [searchQuery, graphData]);

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 64px)" }}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Back + title */}
        <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-sahara">
          <button
            onClick={() => router.push("/wiki")}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Wiki"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <span className="text-sm font-medium text-foreground">Knowledge Graph</span>
          {graphData && (
            <span className="text-xs text-muted-foreground ml-1">
              {graphData.nodes.length} nodes · {graphData.edges.length} edges
            </span>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-sahara">
          <span className="material-symbols-outlined text-sm text-muted-foreground">search</span>
          <input
            type="text"
            placeholder="Highlight node..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              const matches = graphData?.nodes.filter((n) =>
                n.title.toLowerCase().includes(e.target.value.toLowerCase())
              );
              setHighlightSlug(matches?.[0]?.slug ?? null);
            }}
            className="w-40 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Type filter chips */}
        <div className="flex flex-col gap-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-3 py-3 shadow-sahara">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Filter
          </p>
          {PAGE_TYPES.map((type) => {
            const active = activeTypes.has(type);
            const color = wikiTypeColor(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className="flex items-center gap-2 text-xs rounded-lg px-2 py-1 transition-all"
                style={{
                  background: active ? `${color}18` : "transparent",
                  color: active ? color : "#78706a",
                  border: `1px solid ${active ? color + "40" : "transparent"}`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: active ? color : "#78706a" }}
                />
                {wikiTypeGroupLabel(type)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Graph */}
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-background">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary">
            progress_activity
          </span>
        </div>
      ) : !filteredData || filteredData.nodes.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-background">
          <span className="material-symbols-outlined text-4xl text-muted-foreground">hub</span>
          <p className="text-sm text-muted-foreground">
            No wiki pages yet. Upload and compile documents first.
          </p>
        </div>
      ) : (
        <WikiGraph
          nodes={filteredData.nodes}
          edges={filteredData.edges}
          centerSlug={highlightSlug ?? undefined}
          height={undefined}
          onNodeClick={(slug) => router.push(`/wiki/${slug}`)}
        />
      )}
    </div>
  );
}
