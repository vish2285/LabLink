import { useEffect, useRef } from 'react'

// Canvas-based subtle grid that warps toward the cursor
export default function CursorGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null!)

  useEffect(() => {
    const canvas: HTMLCanvasElement = canvasRef.current
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    let widthCSS = 0
    let heightCSS = 0

    function resize() {
      const { innerWidth: w, innerHeight: h } = window
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      canvas.width = Math.floor(w * DPR)
      canvas.height = Math.floor(h * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      widthCSS = w
      heightCSS = h
      buildPoints()
    }

    const gridSize = 40 // denser grid
    const overscan = gridSize // extend beyond edges to avoid cutoff
    const radius = 180 // influence radius (px)
    const intensity = 0.25 // how strongly points move toward cursor
    const maxOffset = gridSize * 0.8 // clamp displacement to avoid extreme distortion

    let points: { x: number; y: number }[] = []
    function buildPoints() {
      points = []
      const w = Math.ceil(canvas.width / DPR)
      const h = Math.ceil(canvas.height / DPR)
      for (let x = -overscan; x <= w + overscan; x += gridSize) {
        for (let y = -overscan; y <= h + overscan; y += gridSize) {
          points.push({ x, y })
        }
      }
    }

    const mouse = { x: -9999, y: -9999 }
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    function warpPoint(px: number, py: number) {
      const dx = mouse.x - px
      const dy = mouse.y - py
      const d = Math.hypot(dx, dy) || 0.0001
      // Gaussian falloff: strong near cursor, fades smoothly
      const falloff = Math.exp(-(d * d) / (2 * radius * radius))
      let ox = dx * intensity * falloff
      let oy = dy * intensity * falloff
      // Clamp overly large offsets
      const mag = Math.hypot(ox, oy)
      if (mag > maxOffset) {
        const s = maxOffset / mag
        ox *= s
        oy *= s
      }
      return { x: px + ox, y: py + oy, d }
    }

    let raf = 0
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw warped grid lines (rows)
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(170,180,195,0.08)'
      for (let y = -overscan; y <= heightCSS + overscan; y += gridSize) {
        let first = true
        ctx.beginPath()
        for (let x = -overscan; x <= widthCSS + overscan; x += gridSize) {
          const { x: wx, y: wy } = warpPoint(x, y)
          if (first) {
            ctx.moveTo(wx, wy)
            first = false
          } else {
            ctx.lineTo(wx, wy)
          }
        }
        ctx.stroke()
      }

      // Draw warped grid lines (columns)
      for (let x = -overscan; x <= widthCSS + overscan; x += gridSize) {
        let first = true
        ctx.beginPath()
        for (let y = -overscan; y <= heightCSS + overscan; y += gridSize) {
          const { x: wx, y: wy } = warpPoint(x, y)
          if (first) {
            ctx.moveTo(wx, wy)
            first = false
          } else {
            ctx.lineTo(wx, wy)
          }
        }
        ctx.stroke()
      }

      // Draw dots on warped points
      for (const p of points) {
        const { x: wx, y: wy, d } = warpPoint(p.x, p.y)
        const alpha = Math.max(0.06, 1 - d / 220) * 0.65 // toned for dark bg
        ctx.fillStyle = `rgba(180,190,200,${alpha})`
        ctx.beginPath()
        ctx.arc(wx, wy, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />
}


