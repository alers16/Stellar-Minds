import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { KnowledgeGraph } from "@/components/knowledge-graph"
import { CTASection } from "@/components/cta-section"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <KnowledgeGraph />
      <Features />
      <CTASection />
    </main>
  )
}
