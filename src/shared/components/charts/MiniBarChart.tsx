"use client"

import * as React from "react"
import { cn } from "@/shared/lib/utils"

export type BarDatum = { label: string; value: number; raw?: unknown }

/**
 * Horizontal bar chart tuned for breakdown tiles. Clickable rows so breakdown
 * tiles can wire cross-filtering with one prop.
 */
export function MiniBarChart({
  data,
  max,
  onPick,
  highlightValue,
  className,
  maxRows = 8,
}: {
  data: BarDatum[]
  max?: number
  onPick?: (d: BarDatum) => void
  highlightValue?: unknown
  className?: string
  maxRows?: number
}) {
  const top = data.slice(0, maxRows)
  const upper = max ?? Math.max(1, ...top.map((d) => d.value))
  const total = data.reduce((s, d) => s + d.value, 0)

  if (top.length === 0) return <EmptyChart />

  return (
    <ul className={cn("space-y-1.5", className)}>
      {top.map((d, i) => {
        const pct = (d.value / upper) * 100
        const sharePct = total > 0 ? Math.round((d.value / total) * 100) : 0
        const active = highlightValue !== undefined && highlightValue === (d.raw ?? d.label)
        const clickable = Boolean(onPick)
        return (
          <li key={i}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onPick?.(d)}
              className={cn(
                "group block w-full text-left transition",
                clickable && "cursor-pointer",
                !clickable && "cursor-default"
              )}
            >
              <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                <span className={cn("truncate", active ? "font-semibold text-foreground" : "text-foreground/85")}>{d.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {d.value.toLocaleString("en-IN")} <span className="opacity-60">· {sharePct}%</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    active ? "bg-primary" : "bg-primary/70 group-hover:bg-primary"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          </li>
        )
      })}
      {data.length > maxRows && (
        <li className="pt-1 text-[11px] text-muted-foreground">
          +{data.length - maxRows} more
        </li>
      )}
    </ul>
  )
}

export function EmptyChart({ label }: { label?: string }) {
  return (
    <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border/70 text-xs text-muted-foreground">
      {label || "No data for this field yet"}
    </div>
  )
}
