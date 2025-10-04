"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import type { GraphData, GraphNode, GraphEdge } from "@/lib/graph-data"
import type { ForceGraph3DInstance } from "react-force-graph-3d"

type ForceGraph3DComponent = typeof import("react-force-graph-3d").default

type VisualNode = GraphNode & {
  name: string
  group: number
  val: number
  color: string
}

type VisualEdge = Omit<GraphEdge, "source" | "target"> & {
  source: VisualNode
  target: VisualNode
  value: number
}

type Graph3DProps = {
  graph: GraphData
}

const PALETTE = [
  "#38bdf8",
  "#a855f7",
  "#f97316",
  "#22d3ee",
  "#facc15",
  "#f472b6",
  "#34d399",
  "#c084fc",
  "#2dd4bf",
  "#f87171",
]

export function Graph3D({ graph }: Graph3DProps) {
  const [hoveredNode, setHoveredNode] = useState<VisualNode | null>(null)
  const [ForceGraphComponent, setForceGraphComponent] = useState<ForceGraph3DComponent | null>(null)
  const graphRef = useRef<ForceGraph3DInstance | null>(null)

  const { data, legend } = useMemo(() => {
    const communitySet = new Map<number, { color: string; count: number }>()

    const nextColor = (index: number) => PALETTE[index % PALETTE.length]

    const nodes: VisualNode[] = graph.nodes.map((node, index) => {
      const group = node.community ?? -1
      if (!communitySet.has(group)) {
        communitySet.set(group, { color: nextColor(communitySet.size), count: 0 })
      }
      const entry = communitySet.get(group)
      if (entry) entry.count += 1

      return {
        ...node,
        name: node.label,
        group,
        val: Math.max(1, node.degree ?? 1),
        color: communitySet.get(group)?.color ?? nextColor(index),
      }
    })

    const nodeById = new Map(nodes.map((node) => [node.id, node]))

    const edges: VisualEdge[] = []
    for (const edge of graph.edges) {
      const sourceNode = nodeById.get(edge.source)
      const targetNode = nodeById.get(edge.target)
      if (!sourceNode || !targetNode) continue

      edges.push({
        id: edge.id,
        source: sourceNode,
        target: targetNode,
        weight: edge.weight,
        value: Math.max(1, edge.weight ?? 1),
      })
    }

    const legendEntries = Array.from(communitySet.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([group, info]) => ({
        group,
        color: info.color,
        count: info.count,
      }))

    return {
      data: { nodes, links: edges },
      legend: legendEntries,
    }
  }, [graph])

  useEffect(() => {
    let mounted = true
    import("react-force-graph-3d").then((mod) => {
      if (mounted) {
        setForceGraphComponent(() => mod.default)
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!ForceGraphComponent) return

    const fg = graphRef.current
    if (!fg) return

    let controls: unknown

    const frameId = requestAnimationFrame(() => {
      const chargeForce = fg.d3Force?.("charge")
      if (chargeForce && typeof (chargeForce as any).strength === "function") {
        ;(chargeForce as any).strength(-120)
      }

      const linkForce = fg.d3Force?.("link")
      if (linkForce && typeof (linkForce as any).distance === "function") {
        ;(linkForce as any).distance(140)
      }

      const setVelocityDecay = (fg as unknown as { d3VelocityDecay?: (value: number) => void }).d3VelocityDecay
      if (typeof setVelocityDecay === "function") {
        setVelocityDecay(0.2)
      }

      if (typeof fg.d3ReheatSimulation === "function") {
        fg.d3ReheatSimulation()
      }

      controls = fg.controls?.()
      if (controls) {
        ;(controls as any).autoRotate = true
        ;(controls as any).autoRotateSpeed = 0.6
      }

      fg.zoomToFit?.(800, 100)
    })

    return () => {
      cancelAnimationFrame(frameId)
      if (controls) {
        ;(controls as any).autoRotate = false
      }
    }
  }, [ForceGraphComponent, data])

  return (
    <div className="relative">
      <div className="relative h-[600px] w-full overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-xl">
        {ForceGraphComponent ? (
          <ForceGraphComponent
            ref={graphRef}
            graphData={data}
            backgroundColor="#020617"
            nodeRelSize={7}
            nodeOpacity={0.95}
            nodeColor={(node) => (node as VisualNode).color}
            nodeVal={(node) => (node as VisualNode).val}
            nodeLabel={(node) => {
              const n = node as VisualNode
              return `<div style="font-family:monospace;padding:0.25rem 0.5rem"><strong>${n.name}</strong><br/>Comunidad: ${n.group}</div>`
            }}
            linkColor={() => "rgba(56,189,248,0.35)"}
            linkOpacity={0.25}
            linkWidth={(link) => Math.log2(((link as VisualEdge).value ?? 1) + 1)}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.004}
            linkDirectionalParticleWidth={1.25}
            linkCurveRotation={0}
            onNodeHover={(node) => setHoveredNode((node as VisualNode) ?? null)}
            enableNavigationControls
            showNavInfo={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Cargando grafo 3D...
          </div>
        )}
      </div>

      {hoveredNode ? (
        <div className="pointer-events-none absolute right-6 top-6 max-w-xs rounded-lg border border-border/60 bg-background/90 p-4 shadow-lg backdrop-blur-md">
          <p className="font-mono text-sm font-semibold text-foreground">{hoveredNode.label}</p>
          <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <dt>Comunidad</dt>
              <dd>#{hoveredNode.group}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Grado</dt>
              <dd>{hoveredNode.degree?.toFixed(0) ?? "–"}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="mt-6 grid gap-2 rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-3">
        {legend.map(({ group, color, count }) => (
          <div key={group} className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-mono text-foreground">Comunidad #{group}</span>
            </div>
            <span>{count} nodos</span>
          </div>
        ))}
      </div>
    </div>
  )
}
