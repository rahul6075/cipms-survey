"use client"

import { cn } from "@/shared/lib/utils"

/**
 * Numeric histogram. Buckets a value array client-side and renders bars.
 */
export function Histogram({
  values,
  bucketCount = 10,
  className,
}: {
  values: number[]
  bucketCount?: number
  className?: string
}) {
  if (!values || values.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border/70 text-xs text-muted-foreground">
        No numeric data yet
      </div>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = span / bucketCount
  const buckets = new Array(bucketCount).fill(0) as number[]
  for (const v of values) {
    const idx = Math.min(bucketCount - 1, Math.floor((v - min) / step))
    buckets[idx] += 1
  }
  const highest = Math.max(...buckets, 1)

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex h-20 items-end gap-0.5">
        {buckets.map((b, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/70 transition hover:bg-primary"
            style={{ height: `${Math.max(4, (b / highest) * 100)}%` }}
            title={`${(min + i * step).toFixed(1)} – ${(min + (i + 1) * step).toFixed(1)}: ${b}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{formatNum(min)}</span>
        <span>{formatNum(max)}</span>
      </div>
    </div>
  )
}

function formatNum(n: number) {
  if (Number.isInteger(n)) return n.toString()
  return n.toFixed(1)
}
