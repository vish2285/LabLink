import { useEffect, useRef } from 'react'

// Canvas-based subtle dots grid reacting to cursor proximity
export default function CursorGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null!)

  useEffect(() => {
    const canvas: HTMLCanvasElement = canvasRef.current
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    function resize() {
      const { innerWidth: w, innerHeight: h } = window
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      canvas.width = Math.floor(w * DPR)
      canvas.height = Math.floor(h * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      buildPoints()
    }

    const gridSize = 40
    let points: { x: number; y: number }[] = []
    function buildPoints() {
      points = []
      const w = Math.ceil(canvas.width / DPR)
      const h = Math.ceil(canvas.height / DPR)
      for (let x = 0; x < w; x += gridSize) {
        for (let y = 0; y < h; y += gridSize) {
          points.push({ x, y })
        }
      }
    }

    const mouse = { x: -9999, y: -9999 }
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    let raf = 0
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of points) {
        const d = Math.hypot(mouse.x - p.x, mouse.y - p.y)
        const alpha = Math.max(0.06, 1 - d / 220) * 0.6 // toned for dark bg
        ctx.fillStyle = `rgba(180,190,200,${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />
}


