import { Brain, Database, Network, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Advanced language models trained on decades of NASA space biology research data.",
  },
  {
    icon: Network,
    title: "Knowledge Graph Navigation",
    description: "Explore interconnected research topics through an intelligent graphrag pipeline.",
  },
  {
    icon: Database,
    title: "Comprehensive Database",
    description: "Access to 10,000+ research papers, experiments, and datasets from space missions.",
  },
  {
    icon: Zap,
    title: "Real-Time Analysis",
    description: "Get instant answers and discover connections across multiple research domains.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-mono text-4xl font-bold text-foreground">Advanced Research Capabilities</h2>
          <p className="text-lg text-muted-foreground text-balance">
            Cutting-edge AI technology designed for space biology researchers, investors and mission architects.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 border border-primary/50">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-mono text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
