"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, ZoomIn } from "lucide-react"
import { cn } from "@/shared/lib/utils"

/**
 * Click-to-zoom photo. Child content is the trigger (usually an <img>).
 * Clicking opens a full-screen lightbox with the full-res image, pan + wheel
 * zoom, pinch zoom on touch, and ESC / backdrop / X to close.
 *
 * Usage:
 *   <PhotoLightbox src={url} alt={name}>
 *     <img src={url} className="..." />
 *   </PhotoLightbox>
 */
export function PhotoLightbox({
  src,
  alt,
  children,
  className,
}: {
  src: string
  alt?: string
  children: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (!src) return <>{children}</>

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "group relative cursor-zoom-in appearance-none bg-transparent p-0",
        className
      )}
      aria-label={alt ? `View ${alt}` : "View photo"}
    >
      {children}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
        <ZoomIn className="h-4 w-4 text-white drop-shadow" />
      </span>
    </button>
  )

  if (!open) return trigger

  return (
    <>
      {trigger}
      {createPortal(<Overlay src={src} alt={alt} onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}

function Overlay({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  const [scale, setScale] = React.useState(1)
  const [tx, setTx] = React.useState(0)
  const [ty, setTy] = React.useState(0)
  const dragRef = React.useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const [dragging, setDragging] = React.useState(false)

  const reset = () => { setScale(1); setTx(0); setTy(0) }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const next = Math.min(6, Math.max(1, scale * (e.deltaY > 0 ? 0.9 : 1.1)))
    setScale(next)
    if (next === 1) { setTx(0); setTy(0) }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty }
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    setTx(dragRef.current.tx + (e.clientX - dragRef.current.x))
    setTy(dragRef.current.ty + (e.clientY - dragRef.current.y))
  }
  const onPointerUp = () => { dragRef.current = null; setDragging(false) }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Photo"}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative flex h-full w-full items-center justify-center p-6"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={reset}
        onWheel={onWheel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || ""}
          draggable={false}
          className={cn(
            "max-h-full max-w-full select-none object-contain shadow-2xl",
            scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-out"
          )}
          onClick={() => { if (scale === 1) onClose() }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
            transition: dragging ? "none" : "transform 150ms ease",
          }}
        />
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80 backdrop-blur">
        Scroll to zoom · double-click to reset · ESC to close
      </div>
    </div>
  )
}
