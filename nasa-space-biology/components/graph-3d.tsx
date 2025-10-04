"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

import type { GraphData, GraphNode, GraphEdge } from "@/lib/graph-data"
import type { ForceGraph3DInstance } from "react-force-graph-3d"

type ForceGraph3DComponent = typeof import("react-force-graph-3d").default

type VisualNode = GraphNode & {
  name: string
  group: number
  displayGroup: number
  val: number
  planetIndex: number
}

type VisualEdge = Omit<GraphEdge, "source" | "target"> & {
  source: VisualNode
  target: VisualNode
  value: number
  description: string | null
}

type Graph3DProps = {
  graph: GraphData
}

type PlanetPreset = {
  name: string
  icon: string
  base: string
  accent: string
  ambient: string
  pattern: "bands" | "spots" | "swirl" | "storm"
  hasRing?: boolean
  ringColor?: string
}

type PlanetAsset = {
  name: string
  icon: string
  preview: string | null
  createObject: (scale: number) => THREE.Object3D
  accent: string
}

const PLANET_PRESETS: PlanetPreset[] = [
  {
    name: "Aqua Atlas",
    icon: "🌊",
    base: "#2563eb",
    accent: "#38bdf8",
    ambient: "#1d4ed8",
    pattern: "bands",
  },
  {
    name: "Crimson Forge",
    icon: "🔥",
    base: "#ef4444",
    accent: "#f97316",
    ambient: "#991b1b",
    pattern: "spots",
  },
  {
    name: "Verdant Bloom",
    icon: "🌿",
    base: "#22c55e",
    accent: "#34d399",
    ambient: "#166534",
    pattern: "swirl",
  },
  {
    name: "Solar Halo",
    icon: "🌟",
    base: "#f59e0b",
    accent: "#facc15",
    ambient: "#b45309",
    pattern: "storm",
    hasRing: true,
    ringColor: "#fde68a",
  },
  {
    name: "Aurora Drift",
    icon: "💫",
    base: "#8b5cf6",
    accent: "#c084fc",
    ambient: "#5b21b6",
    pattern: "bands",
  },
  {
    name: "Mist Opal",
    icon: "🪶",
    base: "#0ea5e9",
    accent: "#67e8f9",
    ambient: "#075985",
    pattern: "spots",
    hasRing: true,
    ringColor: "#bae6fd",
  },
]

const planetGeometry = new THREE.SphereGeometry(1, 48, 48)

const ringGeometry = new THREE.TorusGeometry(1.35, 0.08, 16, 60)

const EXTRA_PATTERNS: PlanetPreset["pattern"][] = ["bands", "spots", "swirl", "storm"]

function hslToHex(h: number, s: number, l: number): string {
  const color = new THREE.Color()
  color.setHSL((h % 360) / 360, Math.min(Math.max(s, 0), 100) / 100, Math.min(Math.max(l, 0), 100) / 100)
  return `#${color.getHexString()}`
}

function generatePlanetPreset(index: number): PlanetPreset {
  const hue = (index * 137.508) % 360
  const accentHue = (hue + 25) % 360
  const ambientHue = (hue + 330) % 360

  const base = hslToHex(hue, 70, 45)
  const accent = hslToHex(accentHue, 75, 60)
  const ambient = hslToHex(ambientHue, 65, 35)
  const pattern = EXTRA_PATTERNS[index % EXTRA_PATTERNS.length]
  const hasRing = index % 5 === 0
  const ringColor = hasRing ? hslToHex((hue + 180) % 360, 50, 75) : undefined

  return {
    name: `Orbital-${index + 1}`,
    icon: "🪐",
    base,
    accent,
    ambient,
    pattern,
    hasRing,
    ringColor,
  }
}

function mixColor(colorA: string, colorB: string, amount: number) {
  const a = new THREE.Color(colorA)
  const b = new THREE.Color(colorB)
  return `#${a.lerp(b, amount).getHexString()}`
}

function drawPlanetTexture(preset: PlanetPreset) {
  const size = 256

  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null
  if (!canvas) {
    const texture = new THREE.Texture()
    return {
      texture,
      preview: null,
    }
  }
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return {
      texture: new THREE.CanvasTexture(canvas),
      preview: null,
    }
  }

  const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size * 0.52)
  gradient.addColorStop(0, mixColor(preset.base, "#ffffff", 0.35))
  gradient.addColorStop(1, mixColor(preset.ambient, "#000000", 0.2))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  ctx.save()
  ctx.translate(size / 2, size / 2)
  ctx.rotate((Math.PI / 180) * -18)

  ctx.strokeStyle = mixColor(preset.accent, "#000000", 0.3)
  ctx.fillStyle = preset.accent
  ctx.lineWidth = size * 0.04

  switch (preset.pattern) {
    case "bands": {
      const bandCount = 6
      for (let i = -bandCount; i <= bandCount; i++) {
        const y = (i / bandCount) * (size / 2)
        ctx.globalAlpha = 0.5 + Math.random() * 0.25
        ctx.beginPath()
        ctx.ellipse(0, y, size * 0.52, size * 0.48, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      break
    }
    case "spots": {
      const spots = 28
      for (let i = 0; i < spots; i++) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * (size * 0.48)
        const spotSize = size * (0.04 + Math.random() * 0.05)
        const x = Math.cos(angle) * radius * 0.5
        const y = Math.sin(angle) * radius * 0.35
        ctx.globalAlpha = 0.35 + Math.random() * 0.3
        ctx.beginPath()
        ctx.ellipse(x, y, spotSize, spotSize * 0.8, angle, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case "swirl": {
      ctx.globalAlpha = 0.45
      ctx.lineWidth = size * 0.05
      const paths = 5
      for (let i = 0; i < paths; i++) {
        ctx.beginPath()
        const startY = -size * 0.45 + i * (size * 0.18)
        ctx.moveTo(-size * 0.6, startY)
        for (let x = -size * 0.6; x <= size * 0.6; x += size * 0.08) {
          const y = startY + Math.sin(x / size * Math.PI * 2 + i) * size * 0.07
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      break
    }
    case "storm": {
      ctx.globalAlpha = 0.25
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2
        const radius = size * 0.3
        const centerX = Math.cos(angle) * radius * 0.4
        const centerY = Math.sin(angle) * radius * 0.45
        const swirlGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.22)
        swirlGradient.addColorStop(0, mixColor(preset.accent, "#ffffff", 0.2))
        swirlGradient.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = swirlGradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, size * 0.22, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
  }

  ctx.restore()

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  texture.needsUpdate = true
  return {
    texture,
    preview: typeof canvas.toDataURL === "function" ? canvas.toDataURL() : null,
  }
}

function createPlanetAsset(preset: PlanetPreset): PlanetAsset {
  const { texture, preview } = drawPlanetTexture(preset)
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.5,
    metalness: 0.15,
    emissive: mixColor(preset.ambient, preset.accent, 0.55),
    emissiveIntensity: 0.35,
  })

  const ringMaterial = preset.hasRing
    ? new THREE.MeshStandardMaterial({
        color: preset.ringColor ?? mixColor(preset.base, "#ffffff", 0.6),
        emissive: mixColor(preset.ringColor ?? preset.base, "#ffffff", 0.2),
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.85,
      })
    : null

  return {
    name: preset.name,
    icon: preset.icon,
    preview,
    accent: preset.accent,
    createObject: (scale: number) => {
      const group = new THREE.Group()
      const sphere = new THREE.Mesh(planetGeometry, material)
      sphere.castShadow = false
      sphere.receiveShadow = false
      group.add(sphere)

      if (preset.hasRing && ringMaterial) {
        const ring = new THREE.Mesh(ringGeometry, ringMaterial)
        ring.rotation.x = Math.PI / 2.15
        ring.rotation.y = Math.PI / 4
        ring.scale.setScalar(1.2)
        group.add(ring)
      }

      group.scale.setScalar(scale)
      return group
    },
  }
}

function escapeHtml(value: string | null | undefined) {
  if (!value) return ""
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function Graph3D({ graph }: Graph3DProps) {
  const [hoveredNode, setHoveredNode] = useState<VisualNode | null>(null)
  const [ForceGraphComponent, setForceGraphComponent] = useState<ForceGraph3DComponent | null>(null)
  const graphRef = useRef<ForceGraph3DInstance | null>(null)
  const [hoveredLink, setHoveredLink] = useState<VisualEdge | null>(null)

  const [planetAssets, setPlanetAssets] = useState<PlanetAsset[]>([])

  const communityIds = useMemo(() => {
    const unique = new Set<number>()
    for (const node of graph.nodes) {
      unique.add(node.community ?? -1)
    }
    return Array.from(unique)
  }, [graph])

  useEffect(() => {
    const required = Math.max(communityIds.length, PLANET_PRESETS.length)
    setPlanetAssets((current) => {
      let updated = current.length ? [...current] : PLANET_PRESETS.map((preset) => createPlanetAsset(preset))

      if (updated.length < required) {
        for (let index = updated.length; index < required; index++) {
          const preset = generatePlanetPreset(index)
          updated.push(createPlanetAsset(preset))
        }
      }

      return updated.length === current.length ? current : updated
    })
  }, [communityIds.length])

  const { data, legend } = useMemo(() => {
    const communityRegistry = new Map<number, { assetIndex: number; count: number; label: number }>()

    const nodes: VisualNode[] = graph.nodes.map((node) => {
      const group = node.community ?? -1
      if (!communityRegistry.has(group)) {
        const assignedIndex = planetAssets.length > 0 ? Math.min(communityRegistry.size, planetAssets.length - 1) : 0
        communityRegistry.set(group, {
          assetIndex: assignedIndex,
          count: 0,
          label: communityRegistry.size + 1,
        })
      }

      const entry = communityRegistry.get(group)!
      entry.count += 1

      return {
        ...node,
        name: node.label,
        group,
        displayGroup: entry.label,
        val: Math.max(1, node.degree ?? 1),
        planetIndex: entry.assetIndex,
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
        description: edge.description ?? null,
        value: Math.max(1, edge.weight ?? 1),
      })
    }

    const legendEntries = Array.from(communityRegistry.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([group, info]) => {
        const asset = planetAssets.length ? planetAssets[info.assetIndex % planetAssets.length] : undefined
        const presetFallback = PLANET_PRESETS.length ? PLANET_PRESETS[(info.label - 1) % PLANET_PRESETS.length] : undefined
        return {
          group,
          label: info.label,
          planetName: asset?.name ?? presetFallback?.name ?? "",
          icon: asset?.icon ?? presetFallback?.icon ?? "🪐",
          preview: asset?.preview ?? null,
          accent: asset?.accent ?? presetFallback?.accent ?? "#38bdf8",
          count: info.count,
        }
      })

    return {
      data: { nodes, links: edges },
      legend: legendEntries,
    }
  }, [graph, planetAssets])

  useEffect(() => {
    setHoveredNode(null)
    setHoveredLink(null)
  }, [data])

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
            nodeRelSize={6}
            nodeOpacity={0.95}
            nodeColor={(node) => {
              const visual = node as VisualNode
              const asset = planetAssets.length ? planetAssets[visual.planetIndex % planetAssets.length] : undefined
              return asset?.accent ?? "#38bdf8"
            }}
            nodeVal={(node) => (node as VisualNode).val}
            nodeLabel={(node) => {
              const n = node as VisualNode
              const asset = planetAssets.length ? planetAssets[n.planetIndex % planetAssets.length] : undefined
              return `<div style="font-family:monospace;padding:0.25rem 0.5rem"><strong>${escapeHtml(n.name)}</strong><br/>Community: ${n.displayGroup}<br/>Planet: ${asset?.name ?? "Unknown"}</div>`
            }}
            nodeThreeObject={(node) => {
              const visual = node as VisualNode
              const asset = planetAssets.length ? planetAssets[visual.planetIndex % planetAssets.length] : undefined
              const scale = 1.6 + Math.log2((visual.val ?? 1) + 1)
              return asset?.createObject(scale) ?? undefined
            }}
            nodeThreeObjectExtend={false}
            linkColor={(link) => {
              const edge = link as VisualEdge
              const asset = planetAssets.length ? planetAssets[edge.source.planetIndex % planetAssets.length] : undefined
              return `${asset?.accent ?? "#38bdf8"}55`
            }}
            linkOpacity={0.35}
            linkWidth={(link) => Math.log2(((link as VisualEdge).value ?? 1) + 1)}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.004}
            linkDirectionalParticleWidth={1.25}
            linkDirectionalParticleColor={(link) => {
              const edge = link as VisualEdge
              const asset = planetAssets.length ? planetAssets[edge.target.planetIndex % planetAssets.length] : undefined
              return asset?.accent ?? "rgba(255,255,255,0.8)"
            }}
            linkCurveRotation={0}
            linkLabel={(link) => {
              const edge = link as VisualEdge
              const description = edge.description ? `<br/><span>${escapeHtml(edge.description)}</span>` : ""
              return `<div style="font-family:monospace;padding:0.25rem 0.5rem"><strong>${escapeHtml(edge.source.name)} ➜ ${escapeHtml(edge.target.name)}</strong><br/>Weight: ${edge.weight?.toFixed(2) ?? "1.00"}${description}</div>`
            }}
            onNodeHover={(node) => {
              setHoveredNode((node as VisualNode) ?? null)
              if (node) {
                setHoveredLink(null)
              }
            }}
            onLinkHover={(link) => {
              setHoveredLink((link as VisualEdge) ?? null)
              if (link) {
                setHoveredNode(null)
              }
            }}
            enableNavigationControls
            showNavInfo={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading 3D graph...
          </div>
        )}
      </div>

      {hoveredNode ? (
        (() => {
          const asset = planetAssets.length ? planetAssets[hoveredNode.planetIndex % planetAssets.length] : undefined
          return (
            <div className="pointer-events-none absolute right-6 top-6 max-w-xs rounded-lg border border-border/60 bg-background/90 p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="text-xl" aria-hidden>
                  {asset?.icon ?? "🪐"}
                </span>
                <div>
                  <p className="font-mono text-sm font-semibold text-foreground">{hoveredNode.label}</p>
                  <p className="text-xs text-muted-foreground">{asset?.name ?? "Unassigned"}</p>
                </div>
              </div>
              <dl className="mt-3 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Community</dt>
                  <dd>#{hoveredNode.displayGroup}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Degree</dt>
                  <dd>{hoveredNode.degree?.toFixed(0) ?? "–"}</dd>
                </div>
              </dl>
            </div>
          )
        })()
      ) : null}

      {hoveredLink ? (
        <div className="pointer-events-none absolute left-6 bottom-6 max-w-sm rounded-lg border border-border/60 bg-background/90 p-4 shadow-lg backdrop-blur-md">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Connection</p>
          <p className="mt-2 font-mono text-sm font-semibold text-foreground">
            {hoveredLink.source.name} ➜ {hoveredLink.target.name}
          </p>
          <dl className="mt-3 space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <dt>Weight</dt>
              <dd>{hoveredLink.weight?.toFixed(2) ?? "1.00"}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt>Description</dt>
              <dd className="text-muted-foreground/80">
                {hoveredLink.description ?? "No additional details"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="mt-6 grid gap-2 rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-3">
        {legend.map(({ group, label, planetName, icon, preview, accent, count }) => (
          <div key={group} className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span
                className="h-8 w-8 overflow-hidden rounded-full border border-border/40"
                style={{
                  backgroundImage: preview ? `url(${preview})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: accent,
                }}
                aria-hidden
              />
              <div>
                <p className="font-mono text-foreground">Community #{label}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {icon} {planetName}
                </p>
              </div>
            </div>
            <span>{count} nodes</span>
          </div>
        ))}
      </div>
    </div>
  )
}
