"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Progress } from "@/shared/components/ui/progress"
import { DataTable, type DataTableBulkAction } from "@/shared/components/data-table/DataTable"
import { encodeState } from "@/shared/components/data-table/urlState"
import { useFetchJson } from "@/shared/hooks/use-fetch-json"
import { DEFAULT_STATE, type DataTableColumn, type DataTableState } from "@/shared/components/data-table/types"
import { UserDrawer } from "./UserDrawer"
import { CreateUserDialog } from "./CreateUserDialog"

/* ─── public types (reused by UserDrawer + CreateUserDialog) ──── */

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

type Counts = { total: number; active: number; agents: number; incompleteProfiles: number }
type ApiResponse = { rows: UserRow[]; total: number; counts: Counts }

const ROLE_META: Record<Role, { label: string; cls: string }> = {
  super_admin: { label: "Super Admin",   cls: "bg-primary/10 text-primary border-primary/20" },
  admin:       { label: "Admin",         cls: "bg-chart-3/15 text-chart-3 border-chart-3/20" },
  agent:       { label: "Gram Pradhan",  cls: "bg-chart-2/15 text-chart-2 border-chart-2/20" },
}

const STATUS_META: Record<Status, { label: string; dot: string; cls: string }> = {
  active:    { label: "Active",    dot: "bg-emerald-500",         cls: "text-foreground" },
  inactive:  { label: "Inactive",  dot: "bg-muted-foreground/50", cls: "text-muted-foreground" },
  invited:   { label: "Invited",   dot: "bg-chart-4",             cls: "text-chart-4" },
  suspended: { label: "Suspended", dot: "bg-destructive",         cls: "text-destructive" },
}

function timeAgo(iso?: string) {
  if (!iso) return "—"
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`
  const d = Math.floor(h / 24); if (d < 30) return `${d}d`
  const mo = Math.floor(d / 30); if (mo < 12) return `${mo}mo`
  return `${Math.floor(mo / 12)}y`
}

/* ─── main ───────────────────────────────────────────────────── */

export function UsersViewNew({ sessionRole }: { sessionRole: Role }) {
  const [state, setStateRaw] = React.useState<DataTableState>({ ...DEFAULT_STATE, pageSize: 25 })
  const setState = React.useCallback(
    (patch: Partial<DataTableState>) => setStateRaw((prev) => ({ ...prev, ...patch })),
    [],
  )

  const [openUserId, setOpenUserId] = React.useState<string | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)

  const { data, loading, error, reload: refresh } = useFetchJson<ApiResponse>(
    `/api/users?dt=${encodeURIComponent(encodeState(state))}`,
  )
  const openUser = (data?.rows || []).find((r) => r._id === openUserId) || null
  const counts = data?.counts || { total: 0, active: 0, agents: 0, incompleteProfiles: 0 }

  const columns = React.useMemo<DataTableColumn<UserRow>[]>(() => [
    {
      id: "name",
      header: "User",
      kind: "text",
      searchable: true,
      cell: (u) => {
        const photo = typeof u.profile_data?.photo === "string" ? (u.profile_data.photo as string) : ""
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              {photo && <AvatarImage src={photo} alt={u.name} />}
              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                {u.name?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{u.name}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
          </div>
        )
      },
    },
    { id: "email", header: "Email", kind: "text", defaultHidden: true },
    {
      id: "role",
      header: "Role",
      kind: "enum",
      enumOptions: [
        ...(sessionRole === "super_admin" ? [{ value: "super_admin", label: "Super Admin" }] : []),
        { value: "admin", label: "Admin" },
        { value: "agent", label: "Gram Pradhan" },
      ],
      cell: (u) => (
        <Badge variant="outline" className={cn("text-[11px] font-medium", ROLE_META[u.role].cls)}>
          {ROLE_META[u.role].label}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      kind: "enum",
      enumOptions: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "invited", label: "Invited" },
        { value: "suspended", label: "Suspended" },
      ],
      cell: (u) => {
        const st = STATUS_META[(u.status || (u.is_active ? "active" : "inactive")) as Status]
        return (
          <span className={cn("inline-flex items-center gap-1.5 text-xs", st.cls)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
            {st.label}
          </span>
        )
      },
    },
    {
      id: "profile_percent",
      header: "Profile",
      kind: "number",
      cell: (u) => {
        const pct = u.profile_percent ?? 0
        return (
          <div className="flex min-w-[100px] items-center gap-2">
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
        )
      },
    },
    {
      id: "created_by",
      header: "Created by",
      kind: "custom",
      sortable: false,
      filterable: false,
      cell: (u) => <span className="text-sm text-muted-foreground">{u.created_by?.name || "—"}</span>,
    },
    {
      id: "createdAt",
      header: "Joined",
      kind: "date",
      cell: (u) => (
        <span className="text-sm text-muted-foreground" title={new Date(u.createdAt).toLocaleString()}>
          {timeAgo(u.createdAt)}
        </span>
      ),
    },
  ], [sessionRole])

  const bulkActions: DataTableBulkAction<UserRow>[] | undefined = sessionRole === "super_admin" ? [
    {
      key: "deactivate",
      label: "Deactivate",
      icon: Shield,
      onRun: async (rows) => {
        await Promise.all(rows.map((u) => fetch(`/api/users/${u._id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: false }),
        })))
        toast.success(`Deactivated ${rows.length} user${rows.length > 1 ? "s" : ""}`)
        refresh()
      },
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      onRun: async (rows) => {
        if (!confirm(`Delete ${rows.length} user${rows.length > 1 ? "s" : ""}?`)) return
        await Promise.all(rows.map((u) => fetch(`/api/users/${u._id}`, { method: "DELETE" })))
        toast.success("Deleted")
        refresh()
      },
    },
  ] : undefined

  return (
    <div className="space-y-4">
      {/* Header */}
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
          <Button
            variant="outline" size="sm" className="hidden sm:inline-flex"
            nativeButton={false} render={<Link href="/dashboard/pradhan-intake" />}
          >
            <UserPlus className="h-3.5 w-3.5" /> Quick intake
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Invite user
          </Button>
        </div>
      </div>

      {/* KPI strip — each tile writes a filter row into DataTable state */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={UsersIcon} label="Total users" value={counts.total} accent="bg-pill-blue"
          active={state.filters.length === 0}
          onClick={() => setState({ filters: [], page: 1 })}
        />
        <KpiCard
          icon={CheckCircle2} label="Active" value={counts.active} accent="bg-pill-emerald"
          active={state.filters.some((f) => f.column === "status" && f.value === "active")}
          onClick={() => setState({
            filters: [{ id: "status-active", column: "status", op: "is", value: "active" }],
            page: 1,
          })}
        />
        <KpiCard
          icon={UserCheck} label="Gram Pradhans" value={counts.agents} accent="bg-pill-amber"
          active={state.filters.some((f) => f.column === "role" && f.value === "agent")}
          onClick={() => setState({
            filters: [{ id: "role-agent", column: "role", op: "is", value: "agent" }],
            page: 1,
          })}
        />
        <KpiCard
          icon={AlertCircle} label="Incomplete profiles" value={counts.incompleteProfiles} accent="bg-pill-rose" danger
          active={state.filters.some((f) => f.column === "profile_percent" && f.op === "lt")}
          onClick={() => setState({
            filters: [{ id: "pp-lt-100", column: "profile_percent", op: "lt", value: 100 }],
            page: 1,
          })}
        />
      </div>

      <DataTable
        columns={columns}
        rows={data?.rows || []}
        total={data?.total || 0}
        state={state}
        onStateChange={setState}
        loading={loading}
        error={error}
        rowKey={(u) => u._id}
        searchPlaceholder="Search name or email…"
        onRowClick={(u) => setOpenUserId(u._id)}
        bulkActions={bulkActions}
        scope="users"
      />

      <UserDrawer
        user={openUser}
        open={!!openUserId}
        onOpenChange={(o) => !o && setOpenUserId(null)}
        onChange={refresh}
        sessionRole={sessionRole}
      />

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        sessionRole={sessionRole}
        onCreated={() => { setCreateOpen(false); refresh(); toast.success("User created") }}
      />
    </div>
  )
}

/* ─── KPI tile ───────────────────────────────────────────────── */

function KpiCard({
  icon: Icon, label, value, onClick, active, accent, danger,
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
        active ? "bg-primary/5 ring-primary/30" : "bg-card ring-border hover:bg-muted/40",
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
