import { Graph3D } from "@/components/graph-3d"
import { SpaceBackground } from "@/components/space-background"
import { graphData } from "@/lib/graph-data"

export default function GraphPage() {
  const nodeCount = graphData.nodes.length
  const edgeCount = graphData.edges.length
  const communityCount = new Set(graphData.nodes.map((node) => node.community ?? -1)).size

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0b1648] via-[#140b2e] to-[#040213]">
      <SpaceBackground />
      <div className="pointer-events-none absolute inset-0 -z-20 mix-blend-screen [background-image:radial-gradient(circle_at_12%_18%,rgba(99,102,241,0.35),transparent_60%),radial-gradient(circle_at_78%_12%,rgba(236,72,153,0.32),transparent_58%),radial-gradient(circle_at_52%_82%,rgba(56,189,248,0.3),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(#f8fafc_1px,transparent_1px),radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:140px_140px,90px_90px] [background-position:10px_20px,60px_80px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-sky-400/30 via-transparent to-transparent blur-3xl" />

      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-4 font-mono text-sm uppercase tracking-[0.3em] text-primary/80">Knowledge Map</p>
            <h1 className="mb-6 font-mono text-4xl font-bold text-foreground sm:text-5xl">
              Explore the Stellar Minds 3D Graph
            </h1>
            <p className="text-lg text-muted-foreground text-balance">
              Each node captures a key concept or mission within the Stellar Minds knowledge base. Dive into the graph to
              uncover relationships, communities, and research linkages across space biology.
            </p>
          </div>

          <div className="mb-16 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm">
              <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Nodes</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{nodeCount}</p>
              <p className="text-sm text-muted-foreground">Key entities represented inside the graph.</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm">
              <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Relationships</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{edgeCount}</p>
              <p className="text-sm text-muted-foreground">Connections between related concepts.</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm">
              <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Communities</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{communityCount}</p>
              <p className="text-sm text-muted-foreground">Affinity clusters discovered in the network.</p>
            </div>
          </div>

          <Graph3D graph={graphData} />
        </div>
      </section>
    </main>
  )
}
