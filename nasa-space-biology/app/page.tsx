import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { KnowledgeGraph } from "@/components/knowledge-graph"
import { CTASection } from "@/components/cta-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <KnowledgeGraph />
      <Features />
    </main>
  )
}
