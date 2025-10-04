"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
    }> = []

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
      })
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = "rgba(11, 61, 145, 0.15)"
      ctx.lineWidth = 1
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      particles.forEach((particle) => {
        ctx.fillStyle = "rgba(11, 61, 145, 0.8)"
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a1628] to-black" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(100, 120, 150, 0.4) 0%, rgba(50, 70, 100, 0.2) 40%, transparent 70%)",
            boxShadow: "inset -40px -40px 100px rgba(0, 0, 0, 0.5), 0 0 100px rgba(11, 61, 145, 0.3)",
          }}
        />
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse-glow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-2 font-mono text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Research Assistant</span>
          </div>

          <h1 className="mb-6 font-mono text-5xl font-bold leading-tight text-balance md:text-7xl">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Stellar Mind AI
            </span>
          </h1>

          <p className="mb-8 text-lg text-muted-foreground text-balance md:text-xl">
            Advanced Space Biology Knowledge Graph connecting decades of NASA space biology research.
            <br />
            Explore interconnected knowledge through intelligent conversation.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="group font-mono text-base">
              <Link href="/chat">
                Access Research Chat
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="font-mono text-base bg-transparent">
              Access Knowledge Graph
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 border-t border-border/50 pt-8">
            <div>
              <div className="mb-2 font-mono text-3xl font-bold text-primary">600+</div>
              <div className="font-mono text-sm text-muted-foreground">Research Papers</div>
            </div>
            <div>
              <div className="mb-2 font-mono text-3xl font-bold text-accent">100+</div>
              <div className="font-mono text-sm text-muted-foreground">Years of Data</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
