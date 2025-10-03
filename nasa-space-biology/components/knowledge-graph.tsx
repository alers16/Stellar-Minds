"use client"

import { useEffect, useRef } from "react"

export function KnowledgeGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const nodes: Array<{
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      label: string
      color: string
    }> = [
      {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: 0,
        vy: 0,
        radius: 30,
        label: "Space Biology",
        color: "rgba(100, 200, 255, 1)",
      },
      {
        x: canvas.width / 2 - 150,
        y: canvas.height / 2 - 100,
        vx: 0.3,
        vy: 0.2,
        radius: 20,
        label: "Microgravity",
        color: "rgba(120, 255, 180, 1)",
      },
      {
        x: canvas.width / 2 + 150,
        y: canvas.height / 2 - 100,
        vx: -0.3,
        vy: 0.2,
        radius: 20,
        label: "Radiation",
        color: "rgba(120, 255, 180, 1)",
      },
      {
        x: canvas.width / 2 - 150,
        y: canvas.height / 2 + 100,
        vx: 0.2,
        vy: -0.3,
        radius: 20,
        label: "Plant Growth",
        color: "rgba(120, 255, 180, 1)",
      },
      {
        x: canvas.width / 2 + 150,
        y: canvas.height / 2 + 100,
        vx: -0.2,
        vy: -0.3,
        radius: 20,
        label: "Cell Biology",
        color: "rgba(120, 255, 180, 1)",
      },
      {
        x: canvas.width / 2,
        y: canvas.height / 2 - 150,
        vx: 0.1,
        vy: 0.3,
        radius: 15,
        label: "DNA",
        color: "rgba(255, 180, 120, 0.8)",
      },
      {
        x: canvas.width / 2,
        y: canvas.height / 2 + 150,
        vx: -0.1,
        vy: -0.3,
        radius: 15,
        label: "Proteins",
        color: "rgba(255, 180, 120, 0.8)",
      },
    ]

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      ctx.strokeStyle = "rgba(100, 200, 255, 0.2)"
      ctx.lineWidth = 2
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 250) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach((node, index) => {
        // Glow effect
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 2)
        gradient.addColorStop(0, node.color)
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2)
        ctx.fill()

        // Node circle
        ctx.fillStyle = node.color
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fill()

        // Node border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
        ctx.lineWidth = 2
        ctx.stroke()

        // Label
        if (index === 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 1)"
          ctx.font = "bold 14px monospace"
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
          ctx.font = "12px monospace"
        }
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(node.label, node.x, node.y)

        // Update position
        if (index !== 0) {
          node.x += node.vx
          node.y += node.vy

          const margin = node.radius + 50
          if (node.x < margin || node.x > canvas.width - margin) node.vx *= -1
          if (node.y < margin || node.y > canvas.height - margin) node.vy *= -1
        }
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <section id="knowledge" className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-mono text-4xl font-bold text-foreground">Interconnected Knowledge</h2>
          <p className="text-lg text-muted-foreground text-balance">
            Navigate through a vast network of space biology research
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
            <canvas ref={canvasRef} className="h-[500px] w-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
