"use client"

import * as React from "react"
import { CheckCircle2, Shield, Trash2 } from "lucide-react"

import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Progress } from "@/shared/components/ui/progress"

import { DataTable, type DataTableBulkAction } from "@/shared/components/data-table/DataTable"
import {
  DEFAULT_STATE,
  type DataTableColumn,
  type DataTableState,
  type FilterItem,
} from "@/shared/components/data-table/types"
import { makeDemoRows, queryDemo, type DemoPradhan } from "@/shared/components/data-table/__fixtures__/fakeApi"

const ALL_ROWS = makeDemoRows(1000)

/* ─── columns ─────────────────────────────────────────────────── */

const COLUMNS: DataTableColumn<DemoPradhan>[] = [
  {
    id: "name",
    header: "Name",
    kind: "text",
    searchable: true,
    cell: (r) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
            {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{r.name}</p>
          <p className="truncate text-xs text-muted-foreground">{r.email}</p>
        </div>
      </div>
    ),
  },
  { id: "email", header: "Email", kind: "text", defaultHidden: true, searchable: true },
  { id: "phone", header: "Phone", kind: "text", defaultHidden: true },
  {
    id: "role",
    header: "Role",
    kind: "enum",
    enumOptions: [
      { value: "super_admin", label: "Super Admin" },
      { value: "admin", label: "Admin" },
      { value: "agent", label: "Gram Pradhan" },
    ],
    cell: (r) => <Badge variant="outline" className="text-[11px]">{r.role}</Badge>,
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
    cell: (r) => {
      const dot = r.status === "active" ? "bg-emerald-500"
        : r.status === "invited" ? "bg-chart-4"
        : r.status === "suspended" ? "bg-destructive"
        : "bg-muted-foreground/50"
      return (
        <span className="inline-flex items-center gap-1.5 text-xs">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {r.status}
        </span>
      )
    },
  },
  {
    id: "profile_percent",
    header: "Profile",
    kind: "number",
    cell: (r) => (
      <div className="flex min-w-[100px] items-center gap-2">
        <Progress value={r.profile_percent} className="h-1.5 w-16" />
        <span className="text-xs tabular-nums text-muted-foreground">{r.profile_percent}%</span>
      </div>
    ),
  },
  {
    id: "state",
    header: "State",
    kind: "enum",
    enumOptions: ["Uttar Pradesh", "Bihar", "Madhya Pradesh", "Rajasthan", "Maharashtra"]
      .map((s) => ({ value: s, label: s })),
  },
  { id: "district", header: "District", kind: "text" },
  {
    id: "tags",
    header: "Tags",
    kind: "arrayEnum",
    enumOptions: ["high-engagement", "needs-training", "data-steward", "key-contact", "pilot", "prefers-whatsapp"]
      .map((t) => ({ value: t, label: t })),
    cell: (r) => (
      <div className="flex flex-wrap gap-1">
        {r.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px] font-normal">{t}</Badge>)}
        {r.tags.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
      </div>
    ),
    defaultHidden: true,
  },
  { id: "verified", header: "Verified", kind: "boolean", cell: (r) => r.verified ? "Yes" : "No", defaultHidden: true },
  {
    id: "monthly_submissions",
    header: "Submissions / month",
    kind: "number",
    align: "right",
  },
  {
    id: "created_at",
    header: "Joined",
    kind: "date",
    cell: (r) => new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  },
]

/* ─── per-scenario harness ────────────────────────────────────── */

function Scenario({
  title,
  description,
  initial,
  scope,
}: {
  title: string
  description: string
  initial?: Partial<DataTableState>
  scope: string
}) {
  const [state, setState] = React.useState<DataTableState>({ ...DEFAULT_STATE, ...initial })
  // In-memory fixture: computed synchronously, no simulated latency.
  const data = React.useMemo(
    () => queryDemo(ALL_ROWS, state, { searchColumns: ["name", "email", "district"] }),
    [state],
  )

  const bulk: DataTableBulkAction<DemoPradhan>[] = [
    { key: "verify", label: "Mark verified", icon: CheckCircle2, onRun: (rs) => alert(`Verify ${rs.length}`) },
    { key: "deactivate", label: "Deactivate", icon: Shield, onRun: (rs) => alert(`Deactivate ${rs.length}`) },
    { key: "delete", label: "Delete", icon: Trash2, tone: "destructive", onRun: (rs) => alert(`Delete ${rs.length}`) },
  ]

  return (
    <section className="space-y-2">
      <header>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </header>
      <DataTable
        columns={COLUMNS}
        rows={data.rows}
        total={data.total}
        state={state}
        onStateChange={(patch) => setState((p) => ({ ...p, ...patch }))}
        rowKey={(r) => r._id}
        onRowClick={(r) => console.log("row click", r._id)}
        bulkActions={bulk}
        searchPlaceholder="Search name, email, district…"
        scope={scope}
      />
    </section>
  )
}

/* ─── page ─────────────────────────────────────────────────────── */

const SCENARIOS: Array<{ title: string; description: string; initial?: Partial<DataTableState> }> = [
  {
    title: "1. Basic",
    description: "Default state. All built-ins visible: search, Filter builder, Columns menu, sort, pagination.",
  },
  {
    title: "2. Text filter — contains",
    description: "Pre-seeded with {name contains 'kumar'}. Open the Filter button to see the row-style builder.",
    initial: { filters: [{ id: "f1", column: "name", op: "contains", value: "kumar" }] },
  },
  {
    title: "3. Number between",
    description: "{monthly_submissions between 50 and 150}. Verifies the two-value input.",
    initial: { filters: [{ id: "f1", column: "monthly_submissions", op: "between", value: 50, value2: 150 }] },
  },
  {
    title: "4. Enum isAnyOf (multi-select)",
    description: "{state isAnyOf [Uttar Pradesh, Bihar]}. Click chip to edit; checkbox list in editor.",
    initial: { filters: [{ id: "f1", column: "state", op: "isAnyOf", value: ["Uttar Pradesh", "Bihar"] }] },
  },
  {
    title: "5. Array enum — includes any of",
    description: "{tags includesAnyOf [pilot, key-contact]}. Tags column is forced visible.",
    initial: {
      filters: [{ id: "f1", column: "tags", op: "includesAnyOf", value: ["pilot", "key-contact"] }],
      columnVisibility: { tags: false },
    },
  },
  {
    title: "6. AND combinator — 3 rules",
    description: "role=agent AND status=active AND profile<50. Combinator toggle hidden when <2 filters, visible here.",
    initial: {
      logic: "and",
      filters: [
        { id: "f1", column: "role", op: "is", value: "agent" },
        { id: "f2", column: "status", op: "is", value: "active" },
        { id: "f3", column: "profile_percent", op: "lt", value: 50 },
      ],
    },
  },
  {
    title: "7. OR combinator",
    description: "status=suspended OR profile<10. Toggle AND/OR in the filter popover header.",
    initial: {
      logic: "or",
      filters: [
        { id: "f1", column: "status", op: "is", value: "suspended" },
        { id: "f2", column: "profile_percent", op: "lt", value: 10 },
      ],
    },
  },
  {
    title: "8. isEmpty / isNotEmpty (no value needed)",
    description: "{tags isEmpty}. Operator picker hides the value input.",
    initial: {
      filters: [{ id: "f1", column: "tags", op: "isEmpty" } as FilterItem],
      columnVisibility: { tags: false },
    },
  },
  {
    title: "9. Sorted + paginated",
    description: "Sort by monthly_submissions desc, page size 10, jump to page 2.",
    initial: {
      sort: { column: "monthly_submissions", dir: "desc" },
      pageSize: 10,
      page: 2,
    },
  },
  {
    title: "10. Many columns → horizontal scroll",
    description: "Force every column visible so the table overflows and the inner scrollbar appears.",
    initial: {
      columnVisibility: { email: false, phone: false, tags: false, verified: false },
    },
  },
  {
    title: "11. Empty state",
    description: "{name equals 'nobody'} → no rows. Shows the empty-state cell.",
    initial: { filters: [{ id: "f1", column: "name", op: "equals", value: "nobody" }] },
  },
  {
    title: "12. Presets · save & load",
    description: "Click Filter → use Save New to name a preset → load / delete from the left pane. Presets persist in localStorage under this scenario's own scope.",
    initial: {
      filters: [
        { id: "f1", column: "state", op: "isAnyOf", value: ["Uttar Pradesh", "Bihar"] },
        { id: "f2", column: "role", op: "is", value: "agent" },
      ],
      logic: "and",
    },
  },
]

export default function DevDataTablePage() {
  const [active, setActive] = React.useState(0)
  const current = SCENARIOS[active]
  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">DataTable workbench</h1>
        <p className="text-xs text-muted-foreground">
          In-app replacement for Storybook. Pick a scenario; interact with the table; row clicks log to console.
          Fixture is 1,000 deterministic demo pradhans so results are reproducible.
        </p>
      </header>
      <nav className="flex flex-wrap gap-1">
        {SCENARIOS.map((s, i) => (
          <Button
            key={s.title}
            type="button"
            size="sm"
            variant={active === i ? "default" : "outline"}
            onClick={() => setActive(i)}
            className="h-7 text-[11px]"
          >
            {s.title}
          </Button>
        ))}
      </nav>
      {/* Remount per scenario so initial state actually resets. Scope keeps
          saved presets per-scenario so switching scenarios doesn't mix lists. */}
      <Scenario key={active} {...current} scope={`dev-scenario-${active}`} />
    </div>
  )
}
