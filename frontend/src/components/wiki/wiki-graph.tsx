"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";
import { wikiTypeColor } from "./wiki-type-badge";

type GraphNode = SimulationNodeDatum & {
  slug: string;
  title: string;
  page_type: string;
  degree?: number;
};

type GraphLink = SimulationLinkDatum<GraphNode> & {
  from: string;
  to: string;
};

type Props = {
  nodes: { slug: string; title: string; page_type: string }[];
  edges: { from: string; to: string }[];
  centerSlug?: string;
  mini?: boolean;
  height?: number;
  onNodeClick?: (slug: string) => void;
};

// Sahara light palette
const BG = "#faf5ee";
const EDGE_COLOR = "#c8b8a8";
const LABEL_COLOR = "#3a302a";

function nodeRadius(degree: number, mini: boolean): number {
  if (mini) return Math.max(3, Math.min(6, 3 + degree * 0.5));
  return Math.max(5, Math.min(14, 5 + degree * 0.8));
}

export function WikiGraph({
  nodes: rawNodes,
  edges: rawEdges,
  centerSlug,
  mini = false,
  height,
  onNodeClick,
}: Props) {
  const router = useRouter();
  const svgRef = React.useRef<SVGSVGElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ w: 800, h: height ?? 400 });
  const [simNodes, setSimNodes] = React.useState<GraphNode[]>([]);
  const [simLinks, setSimLinks] = React.useState<GraphLink[]>([]);
  const [hoveredSlug, setHoveredSlug] = React.useState<string | null>(null);
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; title: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simulationRef = React.useRef<any>(null);

  // Measure container
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height: h } = entries[0].contentRect;
      setDimensions({ w: width, h: height ?? h });
    });
    obs.observe(el);
    setDimensions({ w: el.clientWidth, h: height ?? el.clientHeight });
    return () => obs.disconnect();
  }, [height]);

  // Build simulation
  React.useEffect(() => {
    if (rawNodes.length === 0) return;

    const degreeMap = new Map<string, number>();
    for (const e of rawEdges) {
      degreeMap.set(e.from, (degreeMap.get(e.from) ?? 0) + 1);
      degreeMap.set(e.to, (degreeMap.get(e.to) ?? 0) + 1);
    }

    const nodes: GraphNode[] = rawNodes.map((n) => ({
      ...n,
      degree: degreeMap.get(n.slug) ?? 0,
      fx: n.slug === centerSlug ? dimensions.w / 2 : undefined,
      fy: n.slug === centerSlug ? dimensions.h / 2 : undefined,
    }));

    const nodeBySlug = new Map(nodes.map((n) => [n.slug, n]));
    const links: GraphLink[] = rawEdges
      .map((e) => ({ ...e, source: nodeBySlug.get(e.from)!, target: nodeBySlug.get(e.to)! }))
      .filter((l) => l.source && l.target);

    const sim = forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(links)
          .id((d) => (d as GraphNode).slug)
          .distance(mini ? 40 : 80)
          .strength(0.4)
      )
      .force("charge", forceManyBody().strength(mini ? -60 : -120))
      .force("center", forceCenter(dimensions.w / 2, dimensions.h / 2).strength(0.05))
      .force("collide", forceCollide<GraphNode>((d) => nodeRadius(d.degree ?? 0, mini) + 4))
      .alphaDecay(0.03);

    sim.on("tick", () => {
      setSimNodes([...nodes]);
      setSimLinks([...links]);
    });

    simulationRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [rawNodes, rawEdges, centerSlug, dimensions.w, dimensions.h, mini]);

  // Neighbors of hovered node
  const neighborSlugs = React.useMemo(() => {
    if (!hoveredSlug) return null;
    const set = new Set<string>([hoveredSlug]);
    for (const l of simLinks) {
      const src = typeof l.source === "object" ? (l.source as GraphNode).slug : String(l.source);
      const tgt = typeof l.target === "object" ? (l.target as GraphNode).slug : String(l.target);
      if (src === hoveredSlug) set.add(tgt);
      if (tgt === hoveredSlug) set.add(src);
    }
    return set;
  }, [hoveredSlug, simLinks]);

  const handleNodeClick = (slug: string) => {
    if (onNodeClick) {
      onNodeClick(slug);
    } else {
      router.push(`/wiki/${slug}`);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden border border-border shadow-sahara"
      style={{ height: height ?? "100%", background: BG }}
    >
      <svg
        ref={svgRef}
        width={dimensions.w}
        height={dimensions.h}
        style={{ display: "block" }}
      >
        {/* Edges */}
        <g>
          {simLinks.map((link, i) => {
            const src = link.source as GraphNode;
            const tgt = link.target as GraphNode;
            if (!src?.x || !tgt?.x) return null;

            const isHighlighted =
              hoveredSlug &&
              (src.slug === hoveredSlug || tgt.slug === hoveredSlug);

            return (
              <line
                key={i}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={isHighlighted ? "#c2652a" : EDGE_COLOR}
                strokeWidth={isHighlighted ? 2 : 1.5}
                opacity={hoveredSlug ? (isHighlighted ? 0.9 : 0.2) : 0.6}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {simNodes.map((node) => {
            if (node.x === undefined || node.y === undefined) return null;
            const r = nodeRadius(node.degree ?? 0, mini);
            const color = wikiTypeColor(node.page_type);
            const isDimmed = hoveredSlug && !neighborSlugs?.has(node.slug);
            const isCenter = node.slug === centerSlug;

            return (
              <g
                key={node.slug}
                transform={`translate(${node.x},${node.y})`}
                style={{ cursor: "pointer" }}
                onClick={() => handleNodeClick(node.slug)}
                onMouseEnter={(e) => {
                  setHoveredSlug(node.slug);
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top - 12,
                      title: node.title,
                    });
                  }
                }}
                onMouseLeave={() => {
                  setHoveredSlug(null);
                  setTooltip(null);
                }}
              >
                <circle
                  r={hoveredSlug === node.slug ? r * 1.4 : r}
                  fill={color}
                  opacity={isDimmed ? 0.2 : 0.9}
                  stroke={isCenter ? "#3a302a" : "white"}
                  strokeWidth={isCenter ? 2 : 1}
                  style={{ transition: "r 150ms ease, opacity 150ms ease" }}
                />
                {!mini && (
                  <text
                    x={r + 5}
                    y={4}
                    fill={LABEL_COLOR}
                    fontSize={11}
                    opacity={isDimmed ? 0.15 : hoveredSlug === node.slug ? 1 : 0.65}
                    style={{
                      pointerEvents: "none",
                      userSelect: "none",
                      transition: "opacity 150ms ease",
                    }}
                  >
                    {node.title.length > 24
                      ? node.title.slice(0, 22) + "…"
                      : node.title}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none z-50 px-2 py-1 rounded-md text-xs font-medium shadow-sahara"
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top: tooltip.y,
            background: "#f6f0e8",
            color: "#3a302a",
            border: "1px solid rgba(216,208,200,0.6)",
          }}
        >
          {tooltip.title}
        </div>
      )}
    </div>
  );
}

export function WikiGraphMini({
  slug,
  nodes,
  edges,
}: {
  slug: string;
  nodes: { slug: string; title: string; page_type: string }[];
  edges: { from: string; to: string }[];
}) {
  return (
    <WikiGraph
      nodes={nodes}
      edges={edges}
      centerSlug={slug}
      mini
      height={180}
    />
  );
}
