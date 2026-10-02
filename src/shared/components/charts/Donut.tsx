"use client"

import * as React from "react"
import { cn } from "@/shared/lib/utils"

export type DonutDatum = { label: string; value: number; color?: string; raw?: unknown }

const DEFAULT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
]

export function Donut({
  data,
  size = 120,
  thickness = 14,
  centerLabel,
  centerValue,
  onPick,
  highlightValue,
  className,
}: {
  data: DonutDatum[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string | number
  onPick?: (d: DonutDatum) => void
  highlightValue?: unknown
  className?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const C = 2 * Math.PI * r

  let acc = 0

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} stroke="var(--muted)" strokeWidth={thickness} fill="none" />
        {total > 0 && data.map((d, i) => {
          const frac = d.value / total
          const dash = frac * C
          const gap = C - dash
          const offset = -acc * C
          acc += frac
          const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
          const active = highlightValue !== undefined && highlightValue === (d.raw ?? d.label)
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              stroke={color}
              strokeWidth={active ? thickness + 2 : thickness}
              fill="none"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all"
            />
          )
        })}
        {centerValue !== undefined && (
          <>
            <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-sm font-semibold">
              {centerValue}
            </text>
            {centerLabel && (
              <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
                {centerLabel}
              </text>
            )}
          </>
        )}
      </svg>

      <ul className="min-w-0 flex-1 space-y-1">
        {data.slice(0, 6).map((d, i) => {
          const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
          const active = highlightValue !== undefined && highlightValue === (d.raw ?? d.label)
          const clickable = Boolean(onPick)
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onPick?.(d)}
                className={cn(
                  "flex w-full items-center gap-2 text-left text-xs transition",
                  clickable ? "cursor-pointer hover:text-foreground" : "cursor-default",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: color }} />
                <span className="truncate">{d.label}</span>
                <span className="ml-auto shrink-0 tabular-nums">{pct}%</span>
              </button>
            </li>
          )
        })}
        {data.length > 6 && (
          <li className="text-[11px] text-muted-foreground">+{data.length - 6} more</li>
        )}
      </ul>
    </div>
  )
}
