import { Graph3D } from "@/components/graph-3d"
import { graphData } from "@/lib/graph-data"

export default function GraphPage() {
  const nodeCount = graphData.nodes.length
  const edgeCount = graphData.edges.length
  const communityCount = new Set(graphData.nodes.map((node) => node.community ?? -1)).size

  return (
    <main className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-primary/10" />

      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-4 font-mono text-sm uppercase tracking-[0.3em] text-primary/80">Mapa de Conocimiento</p>
            <h1 className="mb-6 font-mono text-4xl font-bold text-foreground sm:text-5xl">
              Explora el grafo 3D de Stellar Minds
            </h1>
            <p className="text-lg text-muted-foreground text-balance">
              Cada nodo representa conceptos y proyectos clave dentro del ecosistema de biología espacial. Interactúa con
              el grafo para descubrir relaciones, comunidades y conexiones de investigación.
            </p>
          </div>

          <div className="mb-16 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm">
              <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Nodos</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{nodeCount}</p>
              <p className="text-sm text-muted-foreground">Entidades clave dentro del grafo.</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm">
              <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Relaciones</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{edgeCount}</p>
              <p className="text-sm text-muted-foreground">Conexiones entre elementos relacionados.</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm">
              <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Comunidades</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{communityCount}</p>
              <p className="text-sm text-muted-foreground">Agrupaciones detectadas por afinidad.</p>
            </div>
          </div>

          <Graph3D graph={graphData} />
        </div>
      </section>
    </main>
  )
}
