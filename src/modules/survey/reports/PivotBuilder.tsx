"use client"

import * as React from "react"
import { BarChart3, Loader2, RefreshCw, Table as TableIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/components/ui/select"
import type { FormField } from "./ReportsWorkbench"

type Metric = "count" | "unique_agents" | "avg"

const SPECIAL_DIMENSIONS = [
  { id: "__device", label: "Device", type: "radio" },
  { id: "__panchayat", label: "Panchayat (from Pradhan)", type: "short_text" },
  { id: "__state", label: "State (from Pradhan)", type: "short_text" },
] as const

const CATEGORICAL = new Set(["radio", "checkbox", "dropdown", "yes_no", "short_text", "email", "phone", "date", "time"])
const NUMERIC = new Set(["number", "rating"])

export function PivotBuilder({
  formId,
  fields,
  from,
  to,
  filters,
}: {
  formId: string
  fields: FormField[]
  from: string
  to: string
  filters: Record<string, string>
}) {
  // Only fields that make sense as grouping dimensions.
  const dimFields = React.useMemo<Array<{ id: string; label: string; type: string }>>(
    () => [
      ...SPECIAL_DIMENSIONS.map((d) => ({ id: d.id, label: d.label, type: d.type })),
      ...fields.filter((f) => CATEGORICAL.has(f.type)).map((f) => ({ id: f.id, label: f.label, type: f.type })),
    ],
    [fields]
  )
  const numericFields = React.useMemo(
    () => fields.filter((f) => NUMERIC.has(f.type)),
    [fields]
  )

  const [row, setRow] = React.useState<string>(dimFields[0]?.id || "")
  const [col, setCol] = React.useState<string>(dimFields[1]?.id || "")
  const [metric, setMetric] = React.useState<Metric>("count")
  const [metricField, setMetricField] = React.useState<string>(numericFields[0]?.id || "")
  const [view, setView] = React.useState<"heatmap" | "bars">("heatmap")
  const [open, setOpen] = React.useState(false)

  const [rows, setRows] = React.useState<Array<Record<string, unknown>> | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    // Only fetch when the user actually opens the builder.
    if (!open || !row) return
    let cancelled = false
    setLoading(true)
    const sp = new URLSearchParams({ formId, pageSize: "200", page: "1", from, to })
    for (const [k, v] of Object.entries(filters)) if (v) sp.set(`filter.${k}`, v)
    fetch(`/api/responses?${sp}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Failed to load responses")))
      .then((d) => { if (!cancelled) setRows(d.rows || []) })
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [open, formId, from, to, filters, row])

  const pivot = React.useMemo(() => {
    if (!rows) return null
    return computePivot({ rows, rowKey: row, colKey: col, metric, metricField })
  }, [rows, row, col, metric, metricField])

  if (dimFields.length === 0) return null

  return (
    <Card className="p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Pivot</h3>
          <p className="text-xs text-muted-foreground">
            Cross-tabulate any two categorical fields.
          </p>
        </div>
        <Button
          type="button"
          variant={open ? "outline" : "default"}
          size="sm"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide pivot" : "Build a pivot"}
        </Button>
      </header>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Row</label>
              <Select value={row} onValueChange={(v) => setRow(v || "")}>
                <SelectTrigger className="h-8 w-full min-w-0">
                  <span className="truncate text-left">
                    {dimFields.find((d) => d.id === row)?.label || "Select…"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {dimFields.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Column</label>
              <Select value={col} onValueChange={(v) => setCol(v || "")}>
                <SelectTrigger className="h-8 w-full min-w-0">
                  <span className="truncate text-left">
                    {col === "__none" ? "— None (totals only) —" : dimFields.find((d) => d.id === col)?.label || "Select…"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— None (totals only) —</SelectItem>
                  {dimFields.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Metric</label>
              <Select value={metric} onValueChange={(v) => setMetric(v as Metric)}>
                <SelectTrigger className="h-8 w-full min-w-0">
                  <span className="truncate text-left">
                    {metric === "count" ? "Response count" : metric === "unique_agents" ? "Unique Pradhans" : "Avg of numeric field"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Response count</SelectItem>
                  <SelectItem value="unique_agents">Unique Pradhans</SelectItem>
                  {numericFields.length > 0 && <SelectItem value="avg">Avg of numeric field</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {metric === "avg" && (
              <div className="min-w-[140px]">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Field</label>
                <Select value={metricField} onValueChange={(v) => setMetricField(v || "")}>
                  <SelectTrigger className="h-8 w-full min-w-0">
                    <span className="truncate text-left">
                      {numericFields.find((f) => f.id === metricField)?.label || "Select…"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {numericFields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="ml-auto inline-flex rounded-md border border-border p-0.5">
              <button
                type="button"
                onClick={() => setView("heatmap")}
                className={cn(
                  "flex h-7 w-8 items-center justify-center rounded-sm text-muted-foreground transition",
                  view === "heatmap" && "bg-muted text-foreground"
                )}
                aria-label="Heatmap view"
              >
                <TableIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView("bars")}
                className={cn(
                  "flex h-7 w-8 items-center justify-center rounded-sm text-muted-foreground transition",
                  view === "bars" && "bg-muted text-foreground"
                )}
                aria-label="Grouped bars view"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Result */}
          {loading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !pivot || pivot.rows.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border/70 text-xs text-muted-foreground">
              No data for the current scope. Try widening the date range or clearing filters.
            </div>
          ) : view === "heatmap" ? (
            <PivotHeatmap pivot={pivot} />
          ) : (
            <PivotBars pivot={pivot} />
          )}

          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <RefreshCw className="h-2.5 w-2.5" />
            Based on the latest 200 responses in the current filter scope.
          </p>
        </div>
      )}
    </Card>
  )
}

/* ─── pivot engine ───────────────────────────────────────────── */

type Pivot = {
  rows: string[]
  cols: string[]
  cell: Record<string, Record<string, number>>
  max: number
  totalByRow: Record<string, number>
  totalByCol: Record<string, number>
}

function computePivot({
  rows,
  rowKey,
  colKey,
  metric,
  metricField,
}: {
  rows: Array<Record<string, unknown>>
  rowKey: string
  colKey: string
  metric: Metric
  metricField: string
}): Pivot {
  const cell: Record<string, Record<string, { n: number; sum: number; agents: Set<string> }>> = {}
  const rowSet = new Set<string>()
  const colSet = new Set<string>()
  const NONE = "·"

  for (const r of rows) {
    const rowVal = readDim(r, rowKey)
    const colVal = colKey && colKey !== "__none" ? readDim(r, colKey) : NONE
    const rows_ = Array.isArray(rowVal) ? rowVal : [rowVal]
    const cols_ = Array.isArray(colVal) ? colVal : [colVal]
    for (const rv of rows_) {
      for (const cv of cols_) {
        const rk = normalise(rv)
        const ck = normalise(cv)
        rowSet.add(rk)
        colSet.add(ck)
        if (!cell[rk]) cell[rk] = {}
        if (!cell[rk][ck]) cell[rk][ck] = { n: 0, sum: 0, agents: new Set() }
        cell[rk][ck].n += 1
        if (metric === "avg" && metricField) {
          const raw = (r.answers as Record<string, unknown> | undefined)?.[metricField]
          const num = Number(raw)
          if (!Number.isNaN(num)) cell[rk][ck].sum += num
        }
        const agentId = (r.agent as { _id?: string } | null | undefined)?._id
        if (agentId) cell[rk][ck].agents.add(String(agentId))
      }
    }
  }

  const rowKeys = Array.from(rowSet).sort((a, b) => a.localeCompare(b)).slice(0, 20)
  const colKeys = Array.from(colSet).sort((a, b) => a.localeCompare(b)).slice(0, 12)

  const finalCell: Record<string, Record<string, number>> = {}
  let max = 0
  const totalByRow: Record<string, number> = {}
  const totalByCol: Record<string, number> = {}

  for (const rk of rowKeys) {
    finalCell[rk] = {}
    for (const ck of colKeys) {
      const bucket = cell[rk]?.[ck]
      let value = 0
      if (bucket) {
        if (metric === "count") value = bucket.n
        else if (metric === "unique_agents") value = bucket.agents.size
        else if (metric === "avg") value = bucket.n > 0 ? bucket.sum / bucket.n : 0
      }
      finalCell[rk][ck] = Number(value.toFixed(2))
      max = Math.max(max, value)
      totalByRow[rk] = (totalByRow[rk] || 0) + (metric === "avg" ? 0 : value)
      totalByCol[ck] = (totalByCol[ck] || 0) + (metric === "avg" ? 0 : value)
    }
  }

  return { rows: rowKeys, cols: colKeys, cell: finalCell, max, totalByRow, totalByCol }
}

function readDim(response: Record<string, unknown>, key: string): unknown {
  if (key === "__device") return response.device || "—"
  const agentProfile = (response.agent as { profile_data?: Record<string, unknown> } | null | undefined)?.profile_data
  if (key === "__panchayat") return (agentProfile?.panchayat as string | undefined) || "—"
  if (key === "__state") return (agentProfile?.state as string | undefined) || "—"
  const v = (response.answers as Record<string, unknown> | undefined)?.[key]
  if (v === undefined || v === null || v === "") return "—"
  return v
}

function normalise(v: unknown): string {
  if (v === null || v === undefined) return "—"
  if (typeof v === "boolean") return v ? "Yes" : "No"
  return String(v)
}

/* ─── views ──────────────────────────────────────────────────── */

function PivotHeatmap({ pivot }: { pivot: Pivot }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-background p-2 text-left font-medium text-muted-foreground" />
            {pivot.cols.map((c) => (
              <th key={c} className="p-2 text-left font-medium text-muted-foreground">{c}</th>
            ))}
            <th className="p-2 text-right font-medium text-muted-foreground">Row total</th>
          </tr>
        </thead>
        <tbody>
          {pivot.rows.map((r) => (
            <tr key={r}>
              <td className="sticky left-0 whitespace-nowrap bg-background p-2 font-medium">{r}</td>
              {pivot.cols.map((c) => {
                const v = pivot.cell[r]?.[c] || 0
                const intensity = pivot.max > 0 ? v / pivot.max : 0
                return (
                  <td key={c} className="p-1">
                    <div
                      className="rounded px-2 py-1 text-center tabular-nums"
                      style={{
                        background: v > 0 ? `color-mix(in oklch, var(--primary) ${Math.round(intensity * 55)}%, transparent)` : "transparent",
                        color: intensity > 0.6 ? "var(--primary-foreground)" : "inherit",
                      }}
                    >
                      {v || ""}
                    </div>
                  </td>
                )
              })}
              <td className="p-2 text-right font-medium tabular-nums text-muted-foreground">
                {pivot.totalByRow[r] || 0}
              </td>
            </tr>
          ))}
          <tr>
            <td className="sticky left-0 bg-background p-2 text-right text-[11px] uppercase tracking-wide text-muted-foreground">Col total</td>
            {pivot.cols.map((c) => (
              <td key={c} className="p-2 text-center text-[11px] tabular-nums text-muted-foreground">
                {pivot.totalByCol[c] || 0}
              </td>
            ))}
            <td className="p-2" />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function PivotBars({ pivot }: { pivot: Pivot }) {
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
  return (
    <div className="space-y-3">
      {pivot.rows.map((r) => {
        const total = pivot.cols.reduce((s, c) => s + (pivot.cell[r]?.[c] || 0), 0)
        return (
          <div key={r}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="truncate font-medium">{r}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{total}</span>
            </div>
            <div className="flex h-5 overflow-hidden rounded-md border border-border/50 bg-muted">
              {pivot.cols.map((c, i) => {
                const v = pivot.cell[r]?.[c] || 0
                const pct = total > 0 ? (v / total) * 100 : 0
                if (pct === 0) return null
                return (
                  <div
                    key={c}
                    className="h-full"
                    style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                    title={`${c}: ${v}`}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        {pivot.cols.map((c, i) => (
          <span key={c} className="inline-flex items-center gap-1 text-muted-foreground">
            <span className="h-2 w-2 rounded-sm" style={{ background: colors[i % colors.length] }} />
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}
