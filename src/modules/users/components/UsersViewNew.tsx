"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  AlertCircle,
  ArrowDownUp,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users as UsersIcon,
  X,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
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
import { Progress } from "@/shared/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value"
import { useIsMobile } from "@/shared/hooks/use-mobile"
import { UserDrawer } from "./UserDrawer"
import { CreateUserDialog } from "./CreateUserDialog"

/* ─── types ──────────────────────────────────────────────────── */

export type Role = "super_admin" | "admin" | "agent"
export type Status = "active" | "inactive" | "invited" | "suspended"

export type UserRow = {
  _id: string
  name: string
  email: string
  role: Role
  status: Status
  is_active: boolean
  profile_percent?: number
  profile_complete?: boolean
  profile_data?: Record<string, unknown>
  created_by?: { _id?: string; name?: string } | null
  createdAt: string
  last_active_at?: string
}

type Counts = {
  total: number
  active: number
  agents: number
  incompleteProfiles: number
}

type ApiResponse = {
  rows: UserRow[]
  total: number
  page: number
  pageSize: number
  pageCount: number
  counts: Counts
}

const ROLE_META: Record<Role, { label: string; cls: string }> = {
  super_admin: { label: "Super Admin", cls: "bg-primary/10 text-primary border-primary/20" },
  admin: { label: "Admin", cls: "bg-chart-3/15 text-chart-3 border-chart-3/20" },
  agent: { label: "Gram Pradhan", cls: "bg-chart-2/15 text-chart-2 border-chart-2/20" },
}

const STATUS_META: Record<Status, { label: string; dot: string; cls: string }> = {
  active: { label: "Active", dot: "bg-emerald-500", cls: "text-foreground" },
  inactive: { label: "Inactive", dot: "bg-muted-foreground/50", cls: "text-muted-foreground" },
  invited: { label: "Invited", dot: "bg-chart-4", cls: "text-chart-4" },
  suspended: { label: "Suspended", dot: "bg-destructive", cls: "text-destructive" },
}

/* ─── url state ──────────────────────────────────────────────── */

type FilterState = {
  q: string
  role: Role | "all"
  status: Status | "all"
  profile: "all" | "complete" | "incomplete"
  sort: string
  page: number
  pageSize: number
}

const DEFAULT_STATE: FilterState = {
  q: "",
  role: "all",
  status: "all",
  profile: "all",
  sort: "-createdAt",
  page: 1,
  pageSize: 25,
}

function readState(sp: URLSearchParams): FilterState {
  return {
    q: sp.get("q") || "",
    role: (sp.get("role") as FilterState["role"]) || "all",
    status: (sp.get("status") as FilterState["status"]) || "all",
    profile: (sp.get("profile") as FilterState["profile"]) || "all",
    sort: sp.get("sort") || "-createdAt",
    page: Math.max(1, Number(sp.get("page")) || 1),
    pageSize: Math.max(1, Number(sp.get("pageSize")) || 25),
  }
}

function writeState(state: Partial<FilterState>, current: FilterState): string {
  const merged = { ...current, ...state }
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    const def = (DEFAULT_STATE as Record<string, unknown>)[k]
    if (v !== def && v !== "" && v !== undefined && v !== null) sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}

/* ─── relative time ──────────────────────────────────────────── */

function timeAgo(iso?: string) {
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

/* ─── main ───────────────────────────────────────────────────── */

export function UsersViewNew({ sessionRole }: { sessionRole: Role }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const state = React.useMemo(() => readState(searchParams), [searchParams])

  const [searchInput, setSearchInput] = React.useState(state.q)
  const debouncedSearch = useDebouncedValue(searchInput, 300)

  // Sync debounced search back to URL
  React.useEffect(() => {
    if (debouncedSearch === state.q) return
    router.replace(`/dashboard/users${writeState({ q: debouncedSearch, page: 1 }, state)}`, { scroll: false })
  }, [debouncedSearch, router, state])

  // Fetch
  const [data, setData] = React.useState<ApiResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const sp = new URLSearchParams()
    if (state.q) sp.set("q", state.q)
    if (state.role !== "all") sp.set("role", state.role)
    if (state.status !== "all") sp.set("status", state.status)
    if (state.profile !== "all") sp.set("profile", state.profile)
    sp.set("sort", state.sort)
    sp.set("page", String(state.page))
    sp.set("pageSize", String(state.pageSize))

    fetch(`/api/users?${sp}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Failed to load users")))
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) setError(e.message || "Error loading") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [state, refreshKey])

  const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), [])

  const update = React.useCallback(
    (patch: Partial<FilterState>) =>
      router.replace(`/dashboard/users${writeState(patch, state)}`, { scroll: false }),
    [router, state]
  )

  // Selection
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const toggleRow = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  const toggleAll = (checked: boolean) =>
    setSelected(() => (checked && data ? new Set(data.rows.map((r) => r._id)) : new Set()))

  React.useEffect(() => { setSelected(new Set()) }, [state])

  // Drawer
  const [openUserId, setOpenUserId] = React.useState<string | null>(null)
  const openUser = data?.rows.find((r) => r._id === openUserId) || null

  // Create dialog
  const [createOpen, setCreateOpen] = React.useState(false)

  const isMobile = useIsMobile()

  const counts = data?.counts || { total: 0, active: 0, agents: 0, incompleteProfiles: 0 }

  const activeFilterChips = [
    state.role !== "all" && { label: `Role: ${ROLE_META[state.role as Role]?.label || state.role}`, clear: () => update({ role: "all", page: 1 }) },
    state.status !== "all" && { label: `Status: ${STATUS_META[state.status as Status]?.label || state.status}`, clear: () => update({ status: "all", page: 1 }) },
    state.profile !== "all" && { label: state.profile === "complete" ? "Profile complete" : "Profile incomplete", clear: () => update({ profile: "all", page: 1 }) },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading ? "Loading…" : (
              <>
                {counts.total.toLocaleString("en-IN")} user{counts.total !== 1 && "s"} ·{" "}
                {counts.active.toLocaleString("en-IN")} active
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Invite user
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={UsersIcon}
          label="Total users"
          value={counts.total}
          active={state.role === "all" && state.status === "all" && state.profile === "all"}
          onClick={() => update({ role: "all", status: "all", profile: "all", page: 1 })}
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
          icon={UserCheck}
          label="Gram Pradhans"
          value={counts.agents}
          active={state.role === "agent"}
          onClick={() => update({ role: "agent", page: 1 })}
          accent="bg-pill-amber"
        />
        <KpiCard
          icon={AlertCircle}
          label="Incomplete profiles"
          value={counts.incompleteProfiles}
          active={state.profile === "incomplete"}
          onClick={() => update({ profile: "incomplete", page: 1 })}
          accent="bg-pill-rose"
          danger
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
              placeholder="Search by name or email…"
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
            label="Role"
            value={state.role}
            onChange={(v) => update({ role: v as FilterState["role"], page: 1 })}
            options={[
              { value: "all", label: "All roles" },
              ...(sessionRole === "super_admin" ? [{ value: "super_admin", label: "Super Admin" }] : []),
              { value: "admin", label: "Admin" },
              { value: "agent", label: "Gram Pradhan" },
            ]}
          />
          <FilterSelect
            label="Status"
            value={state.status}
            onChange={(v) => update({ status: v as FilterState["status"], page: 1 })}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "invited", label: "Invited" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
          <FilterSelect
            label="Profile"
            value={state.profile}
            onChange={(v) => update({ profile: v as FilterState["profile"], page: 1 })}
            options={[
              { value: "all", label: "Any profile" },
              { value: "complete", label: "Complete" },
              { value: "incomplete", label: "Incomplete" },
            ]}
          />

          <div className="ml-auto flex items-center gap-2">
            <SortMenu value={state.sort} onChange={(v) => update({ sort: v, page: 1 })} />
          </div>
        </div>

        {activeFilterChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {activeFilterChips.map((c) => (
              <Badge
                key={c.label}
                variant="secondary"
                className="h-6 gap-1 pr-1 text-xs font-normal"
              >
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
              onClick={() => update({ role: "all", status: "all", profile: "all", q: "", page: 1 })}
            >
              Clear all
            </Button>
          </div>
        )}
      </Card>

      {/* Bulk-selection bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <span className="text-muted-foreground">·</span>
          <Button size="sm" variant="ghost" className="h-7">Change role</Button>
          <Button size="sm" variant="ghost" className="h-7">Deactivate</Button>
          <Button size="sm" variant="ghost" className="h-7 text-destructive">Delete</Button>
          <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={() => setSelected(new Set())}>
            <X className="h-3 w-3" /> Clear
          </Button>
        </div>
      )}

      {/* Table / mobile list */}
      {isMobile ? (
        <MobileList
          rows={data?.rows || []}
          loading={loading}
          onOpen={setOpenUserId}
        />
      ) : (
        <TableView
          data={data}
          loading={loading}
          error={error}
          selected={selected}
          toggleRow={toggleRow}
          toggleAll={toggleAll}
          sort={state.sort}
          onSort={(v) => update({ sort: v, page: 1 })}
          onOpen={setOpenUserId}
          sessionRole={sessionRole}
          onChange={refresh}
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

      {/* Side-sheet drawer */}
      <UserDrawer
        user={openUser}
        open={!!openUserId}
        onOpenChange={(o) => !o && setOpenUserId(null)}
        onChange={refresh}
        sessionRole={sessionRole}
      />

      {/* Create user dialog */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        sessionRole={sessionRole}
        onCreated={() => { setCreateOpen(false); refresh(); toast.success("User created") }}
      />
    </div>
  )
}

/* ─── sub-components ─────────────────────────────────────────── */

function KpiCard({
  icon: Icon,
  label,
  value,
  onClick,
  active,
  accent,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  onClick?: () => void
  active?: boolean
  accent: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl p-4 text-left ring-1 ring-inset transition",
        active
          ? "bg-primary/5 ring-primary/30"
          : "bg-card ring-border hover:bg-muted/40",
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", accent)}>
        <Icon className={cn("h-4 w-4", danger ? "text-rose-700 dark:text-rose-400" : "text-foreground/70")} />
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
      <DropdownMenuContent align="start" className="w-44">
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
    { v: "-createdAt", l: "Newest first" },
    { v: "createdAt", l: "Oldest first" },
    { v: "name", l: "Name A → Z" },
    { v: "-name", l: "Name Z → A" },
    { v: "-profile_percent", l: "Profile most complete" },
    { v: "profile_percent", l: "Profile least complete" },
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

/* ─── table view ─────────────────────────────────────────────── */

function TableView({
  data,
  loading,
  error,
  selected,
  toggleRow,
  toggleAll,
  sort,
  onSort,
  onOpen,
  sessionRole,
  onChange,
}: {
  data: ApiResponse | null
  loading: boolean
  error: string | null
  selected: Set<string>
  toggleRow: (id: string, checked: boolean) => void
  toggleAll: (checked: boolean) => void
  sort: string
  onSort: (v: string) => void
  onOpen: (id: string) => void
  sessionRole: Role
  onChange: () => void
}) {
  const rows = data?.rows || []
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r._id))

  const SortHead = ({ field, children, align }: { field: string; children: React.ReactNode; align?: "left" | "right" }) => {
    const active = sort === field || sort === `-${field}`
    const nextSort = sort === `-${field}` ? field : `-${field}`
    return (
      <TableHead className={align === "right" ? "text-right" : undefined}>
        <button
          type="button"
          onClick={() => onSort(nextSort)}
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide",
            active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {children}
          {active && (sort.startsWith("-") ? "↓" : "↑")}
        </button>
      </TableHead>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pr-0">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(c) => toggleAll(Boolean(c))}
                  aria-label="Select all"
                />
              </TableHead>
              <SortHead field="name">User</SortHead>
              <SortHead field="role">Role</SortHead>
              <SortHead field="status">Status</SortHead>
              <SortHead field="profile_percent">Profile</SortHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Created by</TableHead>
              <SortHead field="createdAt">Joined</SortHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No users match your filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((u) => {
              const role = ROLE_META[u.role] || ROLE_META.agent
              const st = STATUS_META[(u.status || (u.is_active ? "active" : "inactive")) as Status]
              const pct = u.profile_percent ?? 0
              const isSel = selected.has(u._id)
              return (
                <TableRow
                  key={u._id}
                  className={cn("cursor-pointer", isSel && "bg-primary/5")}
                  onClick={(e) => {
                    const t = e.target as HTMLElement
                    if (t.closest('[data-no-row-open]')) return
                    onOpen(u._id)
                  }}
                >
                  <TableCell className="pr-0" data-no-row-open>
                    <Checkbox
                      checked={isSel}
                      onCheckedChange={(c) => toggleRow(u._id, Boolean(c))}
                      aria-label={`Select ${u.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        {(() => {
                          const p = (u.profile_data as Record<string, unknown> | undefined)?.photo
                          return typeof p === "string" && p ? <AvatarImage src={p} alt={u.name} /> : null
                        })()}
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                          {u.name?.slice(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[11px] font-medium", role.cls)}>
                      {role.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center gap-1.5 text-xs", st.cls)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                      {st.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Progress
                        value={pct}
                        className={cn(
                          "h-1.5 w-16",
                          pct < 50 && "[&>div]:bg-rose-500",
                          pct >= 50 && pct < 100 && "[&>div]:bg-amber-500",
                        )}
                      />
                      <span className={cn("text-xs tabular-nums", pct < 50 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
                        {pct}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.created_by?.name || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground" title={new Date(u.createdAt).toLocaleString()}>
                    {timeAgo(u.createdAt)}
                  </TableCell>
                  <TableCell data-no-row-open>
                    <RowActions user={u} sessionRole={sessionRole} onChange={onChange} onOpen={() => onOpen(u._id)} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

function RowActions({
  user,
  sessionRole,
  onChange,
  onOpen,
}: {
  user: UserRow
  sessionRole: Role
  onChange: () => void
  onOpen: () => void
}) {
  const canDelete = sessionRole === "super_admin" && user.role !== "super_admin"
  const canToggle = sessionRole === "super_admin" && user.role !== "super_admin"

  async function toggleActive() {
    try {
      await fetch(`/api/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      })
      toast.success(user.is_active ? "User deactivated" : "User activated")
      onChange()
    } catch { toast.error("Failed to update") }
  }
  async function destroy() {
    if (!confirm(`Delete ${user.name}?`)) return
    try {
      const r = await fetch(`/api/users/${user._id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("delete failed")
      toast.success("User deleted")
      onChange()
    } catch { toast.error("Failed to delete") }
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
        <DropdownMenuItem onClick={onOpen}>
          <Pencil className="h-3.5 w-3.5" /> View / edit
        </DropdownMenuItem>
        {canToggle && (
          <DropdownMenuItem onClick={toggleActive}>
            <Shield className="h-3.5 w-3.5" />
            {user.is_active ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={destroy} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ─── mobile list ────────────────────────────────────────────── */

function MobileList({
  rows,
  loading,
  onOpen,
}: {
  rows: UserRow[]
  loading: boolean
  onOpen: (id: string) => void
}) {
  if (loading && rows.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    )
  }
  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">No users</Card>
  }
  return (
    <Card className="divide-y divide-border/60 p-0">
      {rows.map((u) => {
        const role = ROLE_META[u.role] || ROLE_META.agent
        const st = STATUS_META[(u.status || (u.is_active ? "active" : "inactive")) as Status]
        return (
          <button
            key={u._id}
            type="button"
            onClick={() => onOpen(u._id)}
            className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/40"
          >
            <Avatar className="h-9 w-9 shrink-0">
              {(() => {
                const p = (u.profile_data as Record<string, unknown> | undefined)?.photo
                return typeof p === "string" && p ? <AvatarImage src={p} alt={u.name} /> : null
              })()}
              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                {u.name?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.name}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className={cn("text-[10px]", role.cls)}>{role.label}</Badge>
              <span className={cn("inline-flex items-center gap-1 text-[11px]", st.cls)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                {st.label}
              </span>
            </div>
          </button>
        )
      })}
    </Card>
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
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="h-8 gap-1">
                {pageSize} / page <ChevronDown className="h-3 w-3" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-32">
            {[25, 50, 100].map((n) => (
              <DropdownMenuItem key={n} onClick={() => onPageSize(n)}>
                {n} / page
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs">
          Page <span className="font-medium text-foreground">{page}</span> of {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
