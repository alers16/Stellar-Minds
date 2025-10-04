"use client"

import { useEffect, useRef } from "react"

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const stars: { x: number; y: number; size: number; opacity: number; speed: number }[] = []
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        opacity: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.5,
      })
    }

    function animate() {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw stars
      stars.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()

        // Twinkle effect
        star.opacity += star.speed * 0.02
        if (star.opacity > 0.8 || star.opacity < 0.2) {
          star.speed *= -1
        }
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[2000px] h-[2000px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, oklch(0.25 0.08 252) 0%, oklch(0.18 0.06 245) 25%, oklch(0.12 0.04 240) 45%, oklch(0.08 0.02 235) 60%, transparent 75%)",
            opacity: 0.6,
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[65%] w-[3500px] h-[3500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(11, 61, 145, 0.4) 0%, rgba(11, 61, 145, 0.3) 20%, rgba(11, 61, 145, 0.2) 40%, rgba(11, 61, 145, 0.1) 55%, transparent 70%)",
            opacity: 0.7,
            filter: "blur(15px)",
          }}
        />
      </div>
    </>
  )
}
