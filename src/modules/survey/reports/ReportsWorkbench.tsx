"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Activity,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Loader2,
  Smartphone,
  Monitor,
  Table as TableIcon,
  Trophy,
  Users as UsersIcon,
  X,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Input } from "@/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { MiniBarChart, EmptyChart, type BarDatum } from "@/shared/components/charts/MiniBarChart"
import { Histogram } from "@/shared/components/charts/Histogram"
import { Donut } from "@/shared/components/charts/Donut"
import { ResponseExplorer } from "./ResponseExplorer"
import { PivotBuilder } from "./PivotBuilder"

/* ─── types ──────────────────────────────────────────────────── */

export type ReportForm = { _id: string; title: string; status: string }

type AggregateResponse = {
  form: { _id: string; title: string; fields: FormField[] }
  scope: { from: string; to: string; filters: Record<string, unknown>; bucket: "day" | "hour" }
  overview: {
    total: number
    previousTotal: number
    deltaPct: number | null
    uniqueAgents: number
    mobile: number
    desktop: number
    firstAt: string | null
    lastAt: string | null
  }
  timeseries: Array<{ bucket: string; n: number }>
  leaderboard: Array<{
    agent_id: string
    name: string
    profile_data?: Record<string, unknown>
    submissions: number
    firstAt?: string
    lastAt?: string
  }>
  hourHistogram: Array<{ _id: number; n: number }>
  fields: Array<FieldBreakdown>
}

export type FormField = {
  id: string
  label: string
  type: string
  options?: string[]
}

export type FieldBreakdown = {
  id: string
  label: string
  type: string
  options: string[]
  data: unknown
}

/* ─── url state ──────────────────────────────────────────────── */

type FilterState = {
  formId: string
  from: string
  to: string
  filters: Record<string, string>
}

function parseFilters(sp: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of sp.entries()) {
    if (!k.startsWith("f.")) continue
    out[k.slice(2)] = v
  }
  return out
}

function writeState(state: Partial<FilterState>, current: FilterState): string {
  const merged: FilterState = { ...current, ...state }
  const sp = new URLSearchParams()
  if (merged.formId) sp.set("formId", merged.formId)
  if (merged.from) sp.set("from", merged.from)
  if (merged.to) sp.set("to", merged.to)
  for (const [k, v] of Object.entries(merged.filters || {})) {
    if (v) sp.set(`f.${k}`, v)
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}

const DATE_PRESETS: Array<{ key: string; label: string; days: number }> = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "all", label: "All time", days: 3650 },
]

/* ─── main ───────────────────────────────────────────────────── */

export function ReportsWorkbench({ initialForms }: { initialForms: ReportForm[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const state: FilterState = React.useMemo(() => ({
    formId: searchParams.get("formId") || initialForms[0]?._id || "",
    from: searchParams.get("from") || defaultFrom(),
    to: searchParams.get("to") || new Date().toISOString(),
    filters: parseFilters(searchParams),
  }), [searchParams, initialForms])

  const update = React.useCallback(
    (patch: Partial<FilterState>) => router.replace(`/dashboard/reports${writeState(patch, state)}`, { scroll: false }),
    [router, state]
  )

  const [data, setData] = React.useState<AggregateResponse | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!state.formId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch("/api/reports/aggregate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formId: state.formId,
        from: state.from,
        to: state.to,
        filters: state.filters,
      }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Failed to load report")))
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) setError(e.message || "Error") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [state])

  function addFilter(key: string, value: unknown) {
    const next = { ...state.filters }
    const str = typeof value === "string" ? value : String(value)
    if (next[key] === str) delete next[key]
    else next[key] = str
    update({ filters: next })
  }
  function removeFilter(key: string) {
    const next = { ...state.filters }
    delete next[key]
    update({ filters: next })
  }
  function clearFilters() { update({ filters: {} }) }

  function setPreset(preset: typeof DATE_PRESETS[number]) {
    const to = new Date()
    const from = new Date(to.getTime() - preset.days * 86400_000)
    update({ from: from.toISOString(), to: to.toISOString() })
  }

  const activePreset = React.useMemo(() => {
    const span = (new Date(state.to).getTime() - new Date(state.from).getTime()) / 86400_000
    return DATE_PRESETS.find((p) => Math.abs(p.days - span) < 1)?.key || "custom"
  }, [state.from, state.to])

  function exportCsv() {
    if (!data) return
    const rows = data.timeseries.map((r) => [r.bucket, r.n])
    const header = ["bucket", "responses"]
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")
    const blob = new Blob([
      `# Report export · form=${data.form.title} · from=${data.scope.from} · to=${data.scope.to}\n`,
      csv,
    ], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${data.form.title.replace(/\s+/g, "-")}-timeseries.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success("CSV downloaded")
  }

  const currentForm = initialForms.find((f) => f._id === state.formId) || null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Explore survey responses with charts, pivots and a raw-data table.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Context bar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <FormPicker forms={initialForms} value={state.formId} onChange={(id) => update({ formId: id, filters: {} })} />

          <DateRange
            activePreset={activePreset}
            onPreset={setPreset}
            from={state.from}
            to={state.to}
            onFrom={(v) => update({ from: v })}
            onTo={(v) => update({ to: v })}
          />

          <div className="ml-auto flex items-center gap-2">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            {currentForm && (
              <Badge variant="outline" className="text-[10px]">
                {currentForm.title}
              </Badge>
            )}
          </div>
        </div>

        {Object.keys(state.filters).length > 0 && data && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {Object.entries(state.filters).map(([key, value]) => {
              const field = data.fields.find((f) => f.id === key) || data.form.fields.find((f) => f.id === key)
              const label = field?.label || key
              return (
                <Badge key={key} variant="secondary" className="h-6 gap-1 pr-1 text-xs font-normal">
                  <span className="truncate">{label}: {value}</span>
                  <button
                    type="button"
                    onClick={() => removeFilter(key)}
                    className="rounded p-0.5 hover:bg-background/60"
                    aria-label={`Clear ${label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
            <Button variant="ghost" size="sm" className="ml-1 h-6 text-xs text-muted-foreground" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </Card>
      )}

      {!state.formId ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No forms available yet. Create a form to start reporting.
        </Card>
      ) : loading && !data ? (
        <Card className="p-16 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        </Card>
      ) : data ? (
        <>
          <KpiStrip overview={data.overview} />

          <div className="grid gap-4 lg:grid-cols-3">
            <TimeseriesCard timeseries={data.timeseries} bucket={data.scope.bucket} className="lg:col-span-2" />
            <LeaderboardCard leaderboard={data.leaderboard} onPick={(agentId) => addFilter("__agent", agentId)} />
          </div>

          <FieldBreakdownGrid
            fields={data.fields}
            activeFilters={state.filters}
            onPick={addFilter}
          />

          <PivotBuilder
            formId={data.form._id}
            fields={data.form.fields}
            from={state.from}
            to={state.to}
            filters={state.filters}
          />

          <ResponseExplorer
            formId={data.form._id}
            fields={data.form.fields}
            from={state.from}
            to={state.to}
            filters={state.filters}
          />
        </>
      ) : null}
    </div>
  )
}

/* ─── small bits ─────────────────────────────────────────────── */

function defaultFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 29)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function csvCell(v: unknown): string {
  const s = String(v ?? "")
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`
  return s
}

function FormPicker({
  forms,
  value,
  onChange,
}: {
  forms: ReportForm[]
  value: string
  onChange: (id: string) => void
}) {
  // Base-ui Select doesn't infer trigger text from the chosen SelectItem's
  // children, so we resolve the title ourselves and render it directly.
  const currentTitle = forms.find((f) => f._id === value)?.title

  return (
    <Select value={value} onValueChange={(v) => onChange(v || "")}>
      <SelectTrigger className="h-8 min-w-[220px] w-auto">
        <TableIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        {currentTitle ? (
          <span className="truncate">{currentTitle}</span>
        ) : (
          <SelectValue placeholder="Select form" />
        )}
      </SelectTrigger>
      <SelectContent>
        {forms.map((f) => (
          <SelectItem key={f._id} value={f._id}>{f.title}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DateRange({
  activePreset,
  onPreset,
  from,
  to,
  onFrom,
  onTo,
}: {
  activePreset: string
  onPreset: (p: typeof DATE_PRESETS[number]) => void
  from: string
  to: string
  onFrom: (v: string) => void
  onTo: (v: string) => void
}) {
  const presetLabel = DATE_PRESETS.find((p) => p.key === activePreset)?.label || "Custom"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <CalendarRange className="h-3.5 w-3.5" />
          <span>{presetLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      } />
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Quick ranges
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {DATE_PRESETS.map((p) => (
          <DropdownMenuItem key={p.key} onClick={() => onPreset(p)} className={cn(activePreset === p.key && "bg-accent text-accent-foreground")}>
            {p.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="space-y-1.5 px-2 py-2">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Custom</label>
          <Input type="date" value={from.slice(0, 10)} onChange={(e) => onFrom(new Date(e.target.value).toISOString())} className="h-8" />
          <Input type="date" value={to.slice(0, 10)} onChange={(e) => onTo(new Date(e.target.value + "T23:59:59").toISOString())} className="h-8" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ─── KPI strip ──────────────────────────────────────────────── */

function KpiStrip({ overview }: { overview: AggregateResponse["overview"] }) {
  const tiles: Array<{
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string | number
    sub?: string
    accent: string
    trend?: { dir: "up" | "down"; text: string }
  }> = [
    {
      icon: Activity, label: "Responses", value: overview.total.toLocaleString("en-IN"),
      sub: overview.previousTotal > 0 ? `vs. ${overview.previousTotal.toLocaleString("en-IN")} prior` : "no prior period",
      accent: "bg-pill-blue",
      trend: overview.deltaPct != null ? { dir: overview.deltaPct >= 0 ? "up" : "down", text: `${Math.abs(overview.deltaPct)}%` } : undefined,
    },
    { icon: UsersIcon, label: "Unique Pradhans", value: overview.uniqueAgents.toLocaleString("en-IN"), accent: "bg-pill-emerald" },
    {
      icon: Smartphone, label: "Mobile", value: overview.mobile.toLocaleString("en-IN"),
      sub: overview.total > 0 ? `${Math.round((overview.mobile / overview.total) * 100)}% of total` : undefined,
      accent: "bg-pill-amber",
    },
    {
      icon: Monitor, label: "Desktop", value: overview.desktop.toLocaleString("en-IN"),
      sub: overview.total > 0 ? `${Math.round((overview.desktop / overview.total) * 100)}% of total` : undefined,
      accent: "bg-pill-rose",
    },
    {
      icon: Clock, label: "First response",
      value: overview.firstAt ? new Date(overview.firstAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—",
      accent: "bg-pill-violet",
    },
    {
      icon: CheckCircle2, label: "Last response",
      value: overview.lastAt ? new Date(overview.lastAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—",
      accent: "bg-pill-cyan",
    },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((t) => (
        <Card key={t.label} className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", t.accent)}>
              <t.icon className="h-4 w-4 text-foreground/70" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{t.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-semibold tabular-nums">{t.value}</p>
                {t.trend && (
                  <span className={cn(
                    "text-[11px] font-medium tabular-nums",
                    t.trend.dir === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  )}>
                    {t.trend.dir === "up" ? "▲" : "▼"} {t.trend.text}
                  </span>
                )}
              </div>
              {t.sub && <p className="truncate text-[11px] text-muted-foreground">{t.sub}</p>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

/* ─── Timeseries ─────────────────────────────────────────────── */

function TimeseriesCard({
  timeseries,
  bucket,
  className,
}: {
  timeseries: AggregateResponse["timeseries"]
  bucket: "day" | "hour"
  className?: string
}) {
  const data = timeseries.map((d) => ({
    bucket: d.bucket,
    n: d.n,
    label: formatBucket(d.bucket, bucket),
  }))
  const total = data.reduce((s, d) => s + d.n, 0)
  const peak = data.reduce((best, d) => (d.n > best.n ? d : best), data[0] || { label: "", n: 0 })

  return (
    <Card className={cn("p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Responses over time</h3>
          <p className="text-xs text-muted-foreground">
            {total.toLocaleString("en-IN")} total · peak {peak?.n || 0} on {peak?.label || "—"}
          </p>
        </div>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="repFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} interval="preserveStartEnd" />
            <YAxis tickLine={false} axisLine={false} width={28} fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
              }}
              labelClassName="text-xs"
            />
            <Area
              type="monotone"
              dataKey="n"
              name="Responses"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#repFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function formatBucket(key: string, unit: "day" | "hour") {
  if (unit === "hour") {
    // "2026-10-02 14:00" → "02 Oct · 14h"
    const [day, time] = key.split(" ")
    const d = new Date(day + "T00:00:00")
    const h = (time || "00:00").slice(0, 2)
    return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} ${h}h`
  }
  const d = new Date(key)
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

/* ─── Leaderboard ────────────────────────────────────────────── */

function LeaderboardCard({
  leaderboard,
  onPick,
}: {
  leaderboard: AggregateResponse["leaderboard"]
  onPick: (agentId: string) => void
}) {
  const max = leaderboard[0]?.submissions || 1
  return (
    <Card className="flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Top Pradhans</h3>
        <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      {leaderboard.length === 0 ? (
        <EmptyChart label="No submissions in this range" />
      ) : (
        <ul className="space-y-2">
          {leaderboard.map((a, i) => {
            const photo = typeof a.profile_data?.photo === "string" ? (a.profile_data.photo as string) : ""
            const pct = Math.round((a.submissions / max) * 100)
            return (
              <li key={a.agent_id}>
                <button
                  type="button"
                  onClick={() => onPick(a.agent_id)}
                  className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-muted/50"
                >
                  <span className="w-5 shrink-0 text-xs font-semibold text-muted-foreground">{i + 1}</span>
                  <Avatar className="h-6 w-6">
                    {photo && <AvatarImage src={photo} alt={a.name} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">
                      {a.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{a.name}</p>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{a.submissions}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* ─── Field breakdown grid ───────────────────────────────────── */

function FieldBreakdownGrid({
  fields,
  activeFilters,
  onPick,
}: {
  fields: FieldBreakdown[]
  activeFilters: Record<string, string>
  onPick: (fieldId: string, value: unknown) => void
}) {
  if (fields.length === 0) return null
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Field breakdowns</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((f) => (
          <FieldTile
            key={f.id}
            field={f}
            active={activeFilters[f.id]}
            onPick={(v) => onPick(f.id, v)}
          />
        ))}
      </div>
    </section>
  )
}

function FieldTile({
  field,
  active,
  onPick,
}: {
  field: FieldBreakdown
  active?: string
  onPick: (v: unknown) => void
}) {
  return (
    <Card className="flex flex-col p-4">
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{field.label}</p>
          <p className="text-[11px] text-muted-foreground">{field.type}</p>
        </div>
      </header>
      <div className="flex-1">{renderFieldBody(field, active, onPick)}</div>
    </Card>
  )
}

function renderFieldBody(field: FieldBreakdown, active: string | undefined, onPick: (v: unknown) => void) {
  const t = field.type

  if (["radio", "checkbox", "dropdown", "yes_no"].includes(t)) {
    const raw = (field.data as Array<{ _id: string | boolean; n: number }>) || []
    const data: BarDatum[] = raw.map((r) => ({
      label: String(r._id ?? "—"),
      value: r.n,
      raw: r._id,
    }))
    // 2–5 options → donut; more → bar list
    if (data.length > 0 && data.length <= 5) {
      return (
        <Donut
          data={data}
          size={110}
          thickness={14}
          centerValue={data.reduce((s, d) => s + d.value, 0)}
          centerLabel="total"
          onPick={(d) => onPick(d.raw ?? d.label)}
          highlightValue={active}
        />
      )
    }
    return <MiniBarChart data={data} onPick={(d) => onPick(d.raw ?? d.label)} highlightValue={active} />
  }

  if (["number", "rating"].includes(t)) {
    const raw = (field.data as Array<{ n: number; min: number; max: number; avg: number; values: number[] }>) || []
    const r = raw[0]
    if (!r) return <EmptyChart />
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Stat label="Count" value={r.n.toString()} />
          <Stat label="Avg" value={r.avg.toFixed(1)} />
          <Stat label="Max" value={r.max.toFixed(0)} />
        </div>
        <Histogram values={r.values} />
      </div>
    )
  }

  return <EmptyChart />
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 px-2 py-1.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}
