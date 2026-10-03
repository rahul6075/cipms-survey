"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Activity,
  AlertCircle,
  ArrowDownUp,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  LayoutGrid,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode,
  Search,
  Table as TableIcon,
  Trash2,
  Users as UsersIcon,
  X,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Checkbox } from "@/shared/components/ui/checkbox"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { MiniSparkline } from "@/shared/components/MiniSparkline"
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value"
import { useIsMobile } from "@/shared/hooks/use-mobile"
import { useFetchJson } from "@/shared/hooks/use-fetch-json"

export type Role = "super_admin" | "admin" | "agent"

type FormStatus = "draft" | "active" | "closed"
type FormAccess = "public" | "private" | "restricted"

export type FormRow = {
  _id: string
  title: string
  description?: string
  status: FormStatus
  access_type: FormAccess
  field_count: number
  require_consent?: boolean
  created_by?: { _id?: string; name?: string } | null
  createdAt: string
  updatedAt: string
  responses_total: number
  responses_last_7d: number[]
  last_response_at: string | null
  assigned_count: number
}

type Counts = { total: number; active: number; draft: number; closed: number }

type ApiResponse = {
  rows: FormRow[]
  total: number
  page: number
  pageSize: number
  pageCount: number
  counts: Counts
}

const STATUS_META: Record<FormStatus, { label: string; cls: string; dot: string }> = {
  draft:  { label: "Draft",  cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
  active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", dot: "bg-emerald-500" },
  closed: { label: "Closed", cls: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
}

const ACCESS_LABEL: Record<FormAccess, string> = {
  public: "Public",
  private: "Private",
  restricted: "Restricted",
}

/* ─── url state ──────────────────────────────────────────────── */

type FilterState = {
  q: string
  status: FormStatus | "all"
  access: FormAccess | "all"
  owner: string
  sort: string
  page: number
  pageSize: number
  view: "table" | "gallery"
}

const DEFAULT_STATE: FilterState = {
  q: "",
  status: "all",
  access: "all",
  owner: "all",
  sort: "-updatedAt",
  page: 1,
  pageSize: 25,
  view: "table",
}

function readState(sp: URLSearchParams): FilterState {
  return {
    q: sp.get("q") || "",
    status: (sp.get("status") as FilterState["status"]) || "all",
    access: (sp.get("access") as FilterState["access"]) || "all",
    owner: sp.get("owner") || "all",
    sort: sp.get("sort") || "-updatedAt",
    page: Math.max(1, Number(sp.get("page")) || 1),
    pageSize: Math.max(1, Number(sp.get("pageSize")) || 25),
    view: (sp.get("view") === "gallery" ? "gallery" : "table"),
  }
}

function writeState(patch: Partial<FilterState>, current: FilterState): string {
  const merged = { ...current, ...patch }
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    const def = (DEFAULT_STATE as Record<string, unknown>)[k]
    if (v !== def && v !== "" && v !== undefined && v !== null) sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}

function respondedWithinHour(iso: string | null) {
  return !!iso && Date.now() - new Date(iso).getTime() < 60 * 60 * 1000
}

function timeAgo(iso?: string | null) {
  if (!iso) return "—"
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo`
  return `${Math.floor(mo / 12)}y`
}

/* ─── main orchestrator ──────────────────────────────────────── */

export function FormsView({ sessionRole }: { sessionRole: Role }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const state = React.useMemo(() => readState(searchParams), [searchParams])

  const [searchInput, setSearchInput] = React.useState(state.q)
  const debouncedSearch = useDebouncedValue(searchInput, 300)

  React.useEffect(() => {
    if (debouncedSearch === state.q) return
    router.replace(`/dashboard/forms${writeState({ q: debouncedSearch, page: 1 }, state)}`, { scroll: false })
  }, [debouncedSearch, router, state])

  const apiQuery = new URLSearchParams()
  if (state.q) apiQuery.set("q", state.q)
  if (state.status !== "all") apiQuery.set("status", state.status)
  if (state.access !== "all") apiQuery.set("access", state.access)
  if (state.owner !== "all") apiQuery.set("owner", state.owner)
  apiQuery.set("sort", state.sort)
  apiQuery.set("page", String(state.page))
  apiQuery.set("pageSize", String(state.pageSize))
  const { data, loading, error, reload: refresh } = useFetchJson<ApiResponse>(`/api/forms?${apiQuery}`)

  const update = React.useCallback(
    (patch: Partial<FilterState>) =>
      router.replace(`/dashboard/forms${writeState(patch, state)}`, { scroll: false }),
    [router, state]
  )

  // Selection
  // Selection belongs to one page/filter combination and clears when it changes.
  const selectionKey = searchParams.toString()
  const [selection, setSelection] = React.useState<{ key: string; ids: Set<string> }>({ key: selectionKey, ids: new Set() })
  const selected = selection.key === selectionKey ? selection.ids : new Set<string>()
  const toggleRow = (id: string, c: boolean) => {
    const n = new Set(selected)
    if (c) n.add(id)
    else n.delete(id)
    setSelection({ key: selectionKey, ids: n })
  }
  const toggleAll = (c: boolean) =>
    setSelection({ key: selectionKey, ids: c && data ? new Set(data.rows.map((r) => r._id)) : new Set() })

  // Inline expand
  const [openId, setOpenId] = React.useState<string | null>(null)
  const toggleOpen = (id: string) => setOpenId((cur) => (cur === id ? null : id))

  const isMobile = useIsMobile()
  const counts = data?.counts || { total: 0, active: 0, draft: 0, closed: 0 }

  const chips = [
    state.status !== "all" && { label: `Status: ${STATUS_META[state.status as FormStatus].label}`, clear: () => update({ status: "all", page: 1 }) },
    state.access !== "all" && { label: `Access: ${ACCESS_LABEL[state.access as FormAccess]}`, clear: () => update({ access: "all", page: 1 }) },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  const totalResponses = React.useMemo(() => {
    if (!data) return 0
    return data.rows.reduce((s, r) => s + r.responses_total, 0)
  }, [data])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading ? "Loading…" : (
              <>
                {counts.total.toLocaleString("en-IN")} form{counts.total !== 1 && "s"} ·{" "}
                {counts.active} active · {totalResponses.toLocaleString("en-IN")} responses on this page
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/forms/new" />}
          >
            <Plus className="h-4 w-4" /> New Form
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={FileText}
          label="Total forms"
          value={counts.total}
          active={state.status === "all"}
          onClick={() => update({ status: "all", page: 1 })}
          accent="bg-pill-blue"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Active"
          value={counts.active}
          active={state.status === "active"}
          onClick={() => update({ status: "active", page: 1 })}
          accent="bg-pill-emerald"
        />
        <KpiCard
          icon={Pencil}
          label="Drafts"
          value={counts.draft}
          active={state.status === "draft"}
          onClick={() => update({ status: "draft", page: 1 })}
          accent="bg-pill-amber"
        />
        <KpiCard
          icon={AlertCircle}
          label="Closed"
          value={counts.closed}
          active={state.status === "closed"}
          onClick={() => update({ status: "closed", page: 1 })}
          accent="bg-pill-rose"
        />
      </div>

      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search forms…"
              className="h-8 pl-8"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <FilterSelect
            label="Status"
            value={state.status}
            onChange={(v) => update({ status: v as FilterState["status"], page: 1 })}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
              { value: "closed", label: "Closed" },
            ]}
          />
          <FilterSelect
            label="Access"
            value={state.access}
            onChange={(v) => update({ access: v as FilterState["access"], page: 1 })}
            options={[
              { value: "all", label: "All" },
              { value: "public", label: "Public" },
              { value: "private", label: "Private" },
              { value: "restricted", label: "Restricted" },
            ]}
          />

          <div className="ml-auto flex items-center gap-2">
            <SortMenu value={state.sort} onChange={(v) => update({ sort: v, page: 1 })} />
            <ViewToggle value={state.view} onChange={(v) => update({ view: v })} />
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {chips.map((c) => (
              <Badge key={c.label} variant="secondary" className="h-6 gap-1 pr-1 text-xs font-normal">
                {c.label}
                <button
                  type="button"
                  onClick={c.clear}
                  className="rounded p-0.5 hover:bg-background/60"
                  aria-label={`Clear ${c.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-6 text-xs text-muted-foreground"
              onClick={() => update({ status: "all", access: "all", q: "", page: 1 })}
            >
              Clear all
            </Button>
          </div>
        )}
      </Card>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <span className="text-muted-foreground">·</span>
          <Button size="sm" variant="ghost" className="h-7">Set active</Button>
          <Button size="sm" variant="ghost" className="h-7">Set draft</Button>
          <Button size="sm" variant="ghost" className="h-7 text-destructive">Archive</Button>
          <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={() => setSelection({ key: selectionKey, ids: new Set() })}>
            <X className="h-3 w-3" /> Clear
          </Button>
        </div>
      )}

      {/* View */}
      {isMobile || state.view === "gallery" ? (
        <GalleryView
          data={data ?? null}
          loading={loading}
          error={error}
          onStatus={(id, status) => flipStatus(id, status, refresh)}
        />
      ) : (
        <TableView
          data={data ?? null}
          loading={loading}
          error={error}
          selected={selected}
          toggleRow={toggleRow}
          toggleAll={toggleAll}
          sort={state.sort}
          onSort={(v) => update({ sort: v, page: 1 })}
          openId={openId}
          onToggleOpen={toggleOpen}
          onStatus={(id, status) => flipStatus(id, status, refresh)}
          onChange={refresh}
          sessionRole={sessionRole}
        />
      )}

      {/* Pagination */}
      {data && data.total > 0 && (
        <Pagination
          page={state.page}
          pageSize={state.pageSize}
          total={data.total}
          pageCount={data.pageCount}
          onPage={(p) => update({ page: p })}
          onPageSize={(ps) => update({ pageSize: ps, page: 1 })}
        />
      )}
    </div>
  )
}

async function flipStatus(id: string, status: FormStatus, refresh: () => void) {
  try {
    const r = await fetch(`/api/forms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!r.ok) throw new Error("Failed")
    toast.success(`Form set to ${STATUS_META[status].label}`)
    refresh()
  } catch { toast.error("Could not update status") }
}

/* ─── small bits ─────────────────────────────────────────────── */

function KpiCard({
  icon: Icon,
  label,
  value,
  onClick,
  active,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  onClick?: () => void
  active?: boolean
  accent: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl p-4 text-left ring-1 ring-inset transition",
        active ? "bg-primary/5 ring-primary/30" : "bg-card ring-border hover:bg-muted/40",
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", accent)}>
        <Icon className="h-4 w-4 text-foreground/70" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value.toLocaleString("en-IN")}</p>
      </div>
    </button>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const current = options.find((o) => o.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium">{current?.label || "—"}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(o.value === value && "bg-accent text-accent-foreground")}
          >
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SortMenu({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = [
    { v: "-updatedAt", l: "Recently updated" },
    { v: "-createdAt", l: "Newest first" },
    { v: "createdAt", l: "Oldest first" },
    { v: "title", l: "Title A → Z" },
    { v: "-title", l: "Title Z → A" },
    { v: "-responses_total", l: "Most responses" },
    { v: "-last_response_at", l: "Most recent response" },
  ]
  const cur = opts.find((o) => o.v === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <ArrowDownUp className="h-3 w-3" />
            <span className="hidden sm:inline">{cur?.l || "Sort"}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Sort by
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {opts.map((o) => (
          <DropdownMenuItem
            key={o.v}
            onClick={() => onChange(o.v)}
            className={cn(o.v === value && "bg-accent text-accent-foreground")}
          >
            {o.l}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ViewToggle({ value, onChange }: { value: "table" | "gallery"; onChange: (v: "table" | "gallery") => void }) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "flex h-7 w-8 items-center justify-center rounded-sm text-muted-foreground transition",
          value === "table" && "bg-muted text-foreground"
        )}
        aria-label="Table view"
      >
        <TableIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("gallery")}
        className={cn(
          "flex h-7 w-8 items-center justify-center rounded-sm text-muted-foreground transition",
          value === "gallery" && "bg-muted text-foreground"
        )}
        aria-label="Gallery view"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/* ─── table ──────────────────────────────────────────────────── */

function SortHead({
  field, children, align, sort, onSort,
}: {
  field: string
  children: React.ReactNode
  align?: "left" | "right"
  sort: string
  onSort: (v: string) => void
}) {
  const active = sort === field || sort === `-${field}`
  const nextSort = sort === `-${field}` ? field : `-${field}`
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(nextSort)}
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {children}
        {active && (sort.startsWith("-") ? "↓" : "↑")}
      </button>
    </TableHead>
  )
}

function TableView({
  data,
  loading,
  error,
  selected,
  toggleRow,
  toggleAll,
  sort,
  onSort,
  openId,
  onToggleOpen,
  onStatus,
  onChange,
  sessionRole,
}: {
  data: ApiResponse | null
  loading: boolean
  error: string | null
  selected: Set<string>
  toggleRow: (id: string, c: boolean) => void
  toggleAll: (c: boolean) => void
  sort: string
  onSort: (v: string) => void
  openId: string | null
  onToggleOpen: (id: string) => void
  onStatus: (id: string, status: FormStatus) => void
  onChange: () => void
  sessionRole: Role
}) {
  const rows = data?.rows || []
  const allSel = rows.length > 0 && rows.every((r) => selected.has(r._id))
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pr-0">
                <Checkbox checked={allSel} onCheckedChange={(c) => toggleAll(Boolean(c))} aria-label="Select all" />
              </TableHead>
              <SortHead field="title" sort={sort} onSort={onSort}>Form</SortHead>
              <SortHead field="status" sort={sort} onSort={onSort}>Status</SortHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Fields</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Assigned</TableHead>
              <SortHead field="responses_total" sort={sort} onSort={onSort}>Responses (7d)</SortHead>
              <SortHead field="last_response_at" sort={sort} onSort={onSort}>Last</SortHead>
              {sessionRole === "super_admin" && (
                <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Owner</TableHead>
              )}
              <SortHead field="updatedAt" sort={sort} onSort={onSort}>Updated</SortHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-destructive">{error}</TableCell>
              </TableRow>
            )}
            {!loading && !error && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  No forms match your filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((f) => {
              const open = openId === f._id
              const hot = respondedWithinHour(f.last_response_at)
              return (
                <React.Fragment key={f._id}>
                  <TableRow
                    className={cn("cursor-pointer", selected.has(f._id) && "bg-primary/5", open && "bg-muted/40")}
                    onClick={(e) => {
                      const t = e.target as HTMLElement
                      if (t.closest("[data-no-row-open]")) return
                      onToggleOpen(f._id)
                    }}
                  >
                    <TableCell className="pr-0" data-no-row-open>
                      <Checkbox
                        checked={selected.has(f._id)}
                        onCheckedChange={(c) => toggleRow(f._id, Boolean(c))}
                        aria-label={`Select ${f.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                          {hot && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 max-w-[320px]">
                          <p className="truncate text-sm font-medium">{f.title}</p>
                          {f.description && (
                            <p className="line-clamp-1 text-xs text-muted-foreground">{f.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-no-row-open>
                      <StatusMenu
                        current={f.status}
                        onPick={(s) => onStatus(f._id, s)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{f.field_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{f.assigned_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="min-w-[2.5rem] text-sm font-medium tabular-nums">{f.responses_total}</span>
                        <MiniSparkline
                          data={f.responses_last_7d}
                          stroke="var(--chart-1)"
                          fill="var(--chart-1)"
                          className="text-chart-1"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" title={f.last_response_at ? new Date(f.last_response_at).toLocaleString() : "—"}>
                      {timeAgo(f.last_response_at)}
                    </TableCell>
                    {sessionRole === "super_admin" && (
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                              {f.created_by?.name?.slice(0, 2).toUpperCase() || "—"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-xs text-muted-foreground">{f.created_by?.name || "—"}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-sm text-muted-foreground" title={new Date(f.updatedAt).toLocaleString()}>
                      {timeAgo(f.updatedAt)}
                    </TableCell>
                    <TableCell data-no-row-open>
                      <RowActions form={f} onChange={onChange} />
                    </TableCell>
                  </TableRow>

                  {open && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={10} className="bg-muted/30 p-0">
                        <RowExpand form={f} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

function StatusMenu({
  current,
  onPick,
}: {
  current: FormStatus
  onPick: (s: FormStatus) => void
}) {
  const meta = STATUS_META[current]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition hover:brightness-95",
              meta.cls
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label}
            <ChevronDown className="h-2.5 w-2.5 opacity-60" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-32">
        {(Object.keys(STATUS_META) as FormStatus[]).map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => s !== current && onPick(s)}
            className={cn(s === current && "bg-accent text-accent-foreground")}
          >
            <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", STATUS_META[s].dot)} />
            {STATUS_META[s].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RowActions({ form, onChange }: { form: FormRow; onChange: () => void }) {
  async function destroy() {
    if (!confirm(`Archive "${form.title}"?`)) return
    try {
      const r = await fetch(`/api/forms/${form._id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("fail")
      toast.success("Form archived")
      onChange()
    } catch { toast.error("Could not archive") }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem render={<Link href={`/dashboard/forms/${form._id}/edit`} />}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={`/dashboard/reports?formId=${form._id}`} />}>
          <Eye className="h-3.5 w-3.5" /> Responses
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={`/dashboard/forms/${form._id}/assign`} />}>
          <UsersIcon className="h-3.5 w-3.5" /> Assign
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={destroy} className="text-destructive focus:text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ─── row expand ─────────────────────────────────────────────── */

function RowExpand({ form }: { form: FormRow }) {
  const maxDay = Math.max(...form.responses_last_7d, 1)
  const dayLabels = React.useMemo(() => {
    const out: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      out.push(d.toLocaleDateString("en-IN", { weekday: "short" }))
    }
    return out
  }, [])

  const intakeHref = `/dashboard/pradhan-intake?form=${form._id}`

  return (
    <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* 7-day chart */}
      <div className="rounded-lg border border-border/70 bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Responses · Last 7 days</p>
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex h-24 items-end gap-1.5">
          {form.responses_last_7d.map((v, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "w-full rounded-sm transition-all",
                  v > 0 ? "bg-primary" : "bg-muted"
                )}
                style={{ height: `${Math.max(4, (v / maxDay) * 100)}%` }}
                title={`${v} on ${dayLabels[i]}`}
              />
              <span className="text-[10px] text-muted-foreground">{dayLabels[i][0]}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Total: {form.responses_total.toLocaleString("en-IN")}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> last {timeAgo(form.last_response_at)}
          </span>
        </p>
      </div>

      {/* Quick stats */}
      <div className="space-y-2">
        <StatPill icon={QrCode} label="Assigned Pradhans" value={form.assigned_count.toString()} href={`/dashboard/forms/${form._id}/assign`} />
        <StatPill icon={FileText} label="Fields" value={form.field_count.toString()} />
        <StatPill icon={UsersIcon} label="Access" value={ACCESS_LABEL[form.access_type]} />
        <StatPill icon={Clock} label="Created" value={new Date(form.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          nativeButton={false}
          render={<Link href={`/dashboard/forms/${form._id}/edit`} />}
        >
          <Pencil className="h-3.5 w-3.5" /> Open editor
          <ArrowUpRight className="ml-auto h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          nativeButton={false}
          render={<Link href={`/dashboard/reports?formId=${form._id}`} />}
        >
          <Eye className="h-3.5 w-3.5" /> View responses ({form.responses_total})
          <ArrowUpRight className="ml-auto h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          nativeButton={false}
          render={<Link href={`/dashboard/forms/${form._id}/assign`} />}
        >
          <UsersIcon className="h-3.5 w-3.5" /> Manage assignments
          <ArrowUpRight className="ml-auto h-3 w-3" />
        </Button>
        <Button
          size="sm"
          className="w-full justify-start"
          nativeButton={false}
          render={<Link href={intakeHref} />}
        >
          <QrCode className="h-3.5 w-3.5" /> Generate Pradhan link
          <ArrowUpRight className="ml-auto h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

function StatPill({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string }) {
  const body = (
    <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card p-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-foreground/70" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
      {href && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

/* ─── gallery view ───────────────────────────────────────────── */

function GalleryView({
  data,
  loading,
  error,
  onStatus,
}: {
  data: ApiResponse | null
  loading: boolean
  error: string | null
  onStatus: (id: string, status: FormStatus) => void
}) {
  const rows = data?.rows || []
  if (loading && rows.length === 0) {
    return <Card className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></Card>
  }
  if (error) return <Card className="p-10 text-center text-destructive">{error}</Card>
  if (rows.length === 0) return <Card className="p-10 text-center text-sm text-muted-foreground">No forms match your filters.</Card>

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((f) => {
        const hot = respondedWithinHour(f.last_response_at)
        return (
          <Card key={f._id} className="group relative overflow-hidden p-0 transition hover:shadow-md">
            <div className="h-24 bg-gradient-to-br from-primary/15 via-primary/5 to-background p-4">
              <div className="flex items-start justify-between">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  {hot && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                  )}
                </div>
                <StatusMenu current={f.status} onPick={(s) => onStatus(f._id, s)} />
              </div>
            </div>
            <div className="space-y-2 p-4">
              <Link href={`/dashboard/forms/${f._id}/edit`} className="block">
                <p className="truncate text-sm font-semibold hover:text-primary">{f.title}</p>
              </Link>
              {f.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{f.description}</p>
              )}
              <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                <span>{f.field_count} fields · {f.assigned_count} assigned</span>
                <span>{f.responses_total} responses</span>
              </div>
              <MiniSparkline
                data={f.responses_last_7d}
                width={240}
                height={20}
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                className="w-full text-chart-1"
              />
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-muted-foreground">Updated {timeAgo(f.updatedAt)}</span>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" nativeButton={false} render={<Link href={`/dashboard/forms/${f._id}/edit`} />}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" nativeButton={false} render={<Link href={`/dashboard/reports?formId=${f._id}`} />}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" nativeButton={false} render={<Link href={`/dashboard/forms/${f._id}/assign`} />}>
                    <UsersIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

/* ─── pagination ─────────────────────────────────────────────── */

function Pagination({
  page,
  pageSize,
  total,
  pageCount,
  onPage,
  onPageSize,
}: {
  page: number
  pageSize: number
  total: number
  pageCount: number
  onPage: (p: number) => void
  onPageSize: (ps: number) => void
}) {
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <div>
        Showing <span className="font-medium text-foreground">{from.toLocaleString("en-IN")}–{to.toLocaleString("en-IN")}</span> of{" "}
        <span className="font-medium text-foreground">{total.toLocaleString("en-IN")}</span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 gap-1">{pageSize} / page <ChevronDown className="h-3 w-3" /></Button>} />
          <DropdownMenuContent align="end" className="w-32">
            {[25, 50, 100].map((n) => (
              <DropdownMenuItem key={n} onClick={() => onPageSize(n)}>
                {n} / page
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs">
          Page <span className="font-medium text-foreground">{page}</span> of {pageCount}
        </span>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
