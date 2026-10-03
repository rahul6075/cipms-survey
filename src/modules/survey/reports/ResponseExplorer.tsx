"use client"

import * as React from "react"
import { Monitor, Smartphone } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { DataTable } from "@/shared/components/data-table/DataTable"
import { encodeState } from "@/shared/components/data-table/urlState"
import {
  DEFAULT_STATE,
  type DataTableColumn,
  type DataTableState,
  type FilterItem,
} from "@/shared/components/data-table/types"
import { useFetchJson } from "@/shared/hooks/use-fetch-json"
import { ResponseDrawer } from "./ResponseDrawer"
import type { FormField } from "./ReportsWorkbench"

/* ─── types ───────────────────────────────────────────────────── */

type ResponseRow = {
  _id: string
  submitted_at: string
  device?: string
  answers: Record<string, unknown>
  agent?: {
    _id?: string
    name?: string
    profile_data?: Record<string, unknown>
  } | null
}

/*
 * Workbench constraints (date range + cross-filter chips) are merged into the
 * encoded dt payload at fetch time only — never into the DataTable's visible
 * state. Keeps user-controlled filters removable; invisible workbench scope
 * silently narrows the query on the server.
 */
function buildExternalRows(
  from: string,
  to: string,
  filters: Record<string, string>,
  fields: FormField[],
): FilterItem[] {
  const rows: FilterItem[] = []
  if (from) rows.push({ id: "ext-from", column: "__submitted_at", op: "gte", value: from })
  if (to)   rows.push({ id: "ext-to",   column: "__submitted_at", op: "lte", value: to })
  for (const [k, v] of Object.entries(filters)) {
    if (!v) continue
    const col = k === "__device" || k === "__agent" ? k : fields.find((f) => f.id === k)?.id
    if (!col) continue
    rows.push({ id: `ext-f-${k}`, column: col, op: "equals", value: v })
  }
  return rows
}

/* ─── main ────────────────────────────────────────────────────── */

export function ResponseExplorer({
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
  const [rawState, setRawState] = React.useState<DataTableState>(() => ({
    ...DEFAULT_STATE,
    pageSize: 25,
    sort: { column: "__submitted_at", dir: "desc" },
  }))
  // The page only applies to the workbench scope it was chosen in; a new
  // date range / cross-filter starts back at page 1.
  const scopeKey = JSON.stringify([formId, from, to, filters])
  const [pageScope, setPageScope] = React.useState(scopeKey)
  const state = pageScope === scopeKey ? rawState : { ...rawState, page: 1 }
  const setState = (patch: Partial<DataTableState>) => {
    setPageScope(scopeKey)
    setRawState({ ...state, ...patch })
  }

  // Columns: 4 system + one per form field.
  const columns = React.useMemo<DataTableColumn<ResponseRow>[]>(() => {
    const systemCols: DataTableColumn<ResponseRow>[] = [
      {
        id: "__agent",
        header: "Pradhan",
        kind: "text",
        sortable: false,
        filterable: false,
        cell: (r) => {
          const photo = typeof r.agent?.profile_data?.photo === "string" ? (r.agent.profile_data.photo as string) : ""
          return (
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="h-6 w-6">
                {photo && <AvatarImage src={photo} alt={r.agent?.name} />}
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                  {r.agent?.name?.slice(0, 2).toUpperCase() || "—"}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{r.agent?.name || "—"}</span>
            </div>
          )
        },
      },
      {
        id: "__panchayat",
        header: "Panchayat",
        kind: "custom",
        sortable: false,
        filterable: false,
        cell: (r) => {
          const p = (r.agent?.profile_data?.panchayat as string | undefined) || ""
          return <span className="text-xs text-muted-foreground">{p || "—"}</span>
        },
      },
      {
        id: "__submitted_at",
        header: "Submitted",
        kind: "date",
        cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.submitted_at).toLocaleString("en-IN")}</span>,
      },
      {
        id: "__device",
        header: "Device",
        kind: "enum",
        enumOptions: [
          { value: "mobile", label: "Mobile" },
          { value: "desktop", label: "Desktop" },
        ],
        cell: (r) => (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {r.device === "desktop" ? <Monitor className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
            {r.device || "mobile"}
          </span>
        ),
      },
    ]
    const fieldCols: DataTableColumn<ResponseRow>[] = fields.map((f, i) => {
      let kind: DataTableColumn<ResponseRow>["kind"] = "text"
      if (f.type === "number" || f.type === "rating") kind = "number"
      else if (f.type === "date" || f.type === "time") kind = "date"
      else if (f.type === "yes_no") kind = "boolean"
      else if (f.type === "radio" || f.type === "dropdown") kind = "enum"
      else if (f.type === "checkbox") kind = "arrayEnum"
      return {
        id: f.id,
        header: f.label || f.id,
        kind,
        defaultHidden: i >= 4,
        enumOptions: f.options?.map((o) => ({ value: o, label: o })),
        cell: (r) => <AnswerCell value={r.answers?.[f.id]} type={f.type} />,
      }
    })
    return [...systemCols, ...fieldCols]
  }, [fields])

  const [openId, setOpenId] = React.useState<string | null>(null)

  // Workbench constraints are merged into the wire request only, never into
  // visible state, so user filters stay removable.
  const effective: DataTableState = {
    ...state,
    filters: [...buildExternalRows(from, to, filters, fields), ...state.filters],
  }
  const { data, loading, error } = useFetchJson<{ rows: ResponseRow[]; total: number }>(
    `/api/responses?formId=${encodeURIComponent(formId)}&dt=${encodeURIComponent(encodeState(effective))}`,
  )

  return (
    <>
      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        total={data?.total ?? 0}
        state={state}
        onStateChange={setState}
        loading={loading}
        error={error}
        rowKey={(r) => r._id}
        searchPlaceholder="Search answers…"
        onRowClick={(r) => setOpenId(r._id)}
        scope={`responses:${formId}`}
      />

      <ResponseDrawer
        responseId={openId}
        open={!!openId}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </>
  )
}

/* ─── answer cell ─────────────────────────────────────────────── */

function AnswerCell({ value, type }: { value: unknown; type?: string }) {
  if (value === undefined || value === null || value === "") return <span className="text-xs text-muted-foreground">—</span>
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.slice(0, 3).map((v, i) => (
          <Badge key={i} variant="secondary" className="text-[10px] font-normal">{String(v)}</Badge>
        ))}
        {value.length > 3 && <span className="text-[11px] text-muted-foreground">+{value.length - 3}</span>}
      </div>
    )
  }
  if (type === "photo" && typeof value === "string" && value.startsWith("http")) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={value} alt="" className="h-8 w-8 rounded object-cover" />
    )
  }
  const s = typeof value === "object" ? JSON.stringify(value) : String(value)
  return <span className="line-clamp-1 max-w-[220px] text-xs">{s}</span>
}
