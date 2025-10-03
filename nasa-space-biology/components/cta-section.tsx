import { Button } from "@/components/ui/button"
import { ArrowRight, Shield } from "lucide-react"

export function CTASection() {
  return (
    <section id="access" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-primary/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl">
            <div className="p-8 md:p-12">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-4 py-2 font-mono text-sm text-accent">
                <Shield className="h-4 w-4" />
                <span>Authorized NASA Researchers Only</span>
              </div>

              <h2 className="mb-4 font-mono text-3xl font-bold text-foreground md:text-4xl text-balance">
                Ready to Explore Space Biology Knowledge?
              </h2>

              <p className="mb-8 text-lg text-muted-foreground text-balance">
                Access the most comprehensive AI-powered research assistant for space biology. Connect with decades of
                NASA research through intelligent conversation.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="group font-mono text-base">
                  Request Access
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button size="lg" variant="outline" className="font-mono text-base bg-transparent">
                  Contact Research Team
                </Button>
              </div>

              <div className="mt-8 flex items-center gap-6 border-t border-border/50 pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
                  <span className="font-mono">System Online</span>
                </div>
                <div className="text-sm text-muted-foreground font-mono">Response Time: {"<"}100ms</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
