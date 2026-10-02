"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Loader2,
  Monitor,
  Smartphone,
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
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { ResponseDrawer } from "./ResponseDrawer"
import type { FormField } from "./ReportsWorkbench"

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

const SYSTEM_COLUMNS = [
  { id: "__agent", label: "Pradhan" },
  { id: "__panchayat", label: "Panchayat" },
  { id: "__submitted_at", label: "Submitted" },
  { id: "__device", label: "Device" },
] as const

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
  // Default visible columns: 4 system columns + first 4 fields.
  const defaultCols = React.useMemo(
    () => [...SYSTEM_COLUMNS.map((c) => c.id), ...fields.slice(0, 4).map((f) => f.id)],
    [fields]
  )
  const [visibleCols, setVisibleCols] = React.useState<string[]>(defaultCols)
  React.useEffect(() => { setVisibleCols(defaultCols) }, [defaultCols])

  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [rows, setRows] = React.useState<ResponseRow[] | null>(null)
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [openId, setOpenId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    const sp = new URLSearchParams({ formId, from, to, page: String(page), pageSize: String(pageSize) })
    for (const [k, v] of Object.entries(filters)) if (v) sp.set(`filter.${k}`, v)
    fetch(`/api/responses?${sp}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Failed")))
      .then((d) => { if (cancelled) return; setRows(d.rows || []); setTotal(d.total || 0) })
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [formId, from, to, filters, page, pageSize])

  // Reset to page 1 whenever filters change.
  React.useEffect(() => { setPage(1) }, [filters, from, to, formId])

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const allColumns = React.useMemo(
    () => [
      ...SYSTEM_COLUMNS.map((c) => ({ id: c.id, label: c.label, kind: "system" as const })),
      ...fields.map((f) => ({ id: f.id, label: f.label || f.id, kind: "field" as const, type: f.type })),
    ],
    [fields]
  )

  return (
    <Card className="overflow-hidden p-0">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 p-4">
        <div>
          <h3 className="text-sm font-semibold">Raw responses</h3>
          <p className="text-xs text-muted-foreground">
            {total.toLocaleString("en-IN")} total · click a row to open details
          </p>
        </div>
        <ColumnPicker
          columns={allColumns}
          visible={visibleCols}
          onToggle={(id) => setVisibleCols((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
        />
      </header>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {allColumns.filter((c) => visibleCols.includes(c.id)).map((c) => (
                <TableHead key={c.id} className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (!rows || rows.length === 0) && (
              <TableRow>
                <TableCell colSpan={visibleCols.length || 1} className="h-32 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}
            {!loading && rows && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleCols.length || 1} className="h-32 text-center text-muted-foreground">
                  No responses in this scope.
                </TableCell>
              </TableRow>
            )}
            {rows?.map((r) => (
              <TableRow
                key={r._id}
                className="cursor-pointer"
                onClick={() => setOpenId(r._id)}
              >
                {allColumns.filter((c) => visibleCols.includes(c.id)).map((c) => (
                  <TableCell key={c.id} className="align-top">
                    {renderCell(c, r)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 p-3 text-sm text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}–{Math.min(total, page * pageSize)}</span> of{" "}
            <span className="font-medium text-foreground">{total.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 gap-1">{pageSize} / page <ChevronDown className="h-3 w-3" /></Button>} />
              <DropdownMenuContent align="end" className="w-32">
                {[25, 50, 100, 200].map((n) => (
                  <DropdownMenuItem key={n} onClick={() => { setPageSize(n); setPage(1) }}>
                    {n} / page
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">Page <span className="font-medium text-foreground">{page}</span> of {pageCount}</span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ResponseDrawer
        responseId={openId}
        open={!!openId}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </Card>
  )
}

function renderCell(
  c: { id: string; label: string; kind: "system" | "field"; type?: string },
  r: ResponseRow,
) {
  if (c.id === "__agent") {
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
  }
  if (c.id === "__panchayat") {
    const p = (r.agent?.profile_data?.panchayat as string | undefined) || ""
    return <span className="text-xs text-muted-foreground">{p || "—"}</span>
  }
  if (c.id === "__submitted_at") {
    return <span className="text-xs text-muted-foreground">{new Date(r.submitted_at).toLocaleString("en-IN")}</span>
  }
  if (c.id === "__device") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        {r.device === "desktop" ? <Monitor className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
        {r.device || "mobile"}
      </span>
    )
  }
  const v = r.answers?.[c.id]
  return <AnswerCell value={v} type={c.type} />
}

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

function ColumnPicker({
  columns,
  visible,
  onToggle,
}: {
  columns: Array<{ id: string; label: string; kind: "system" | "field" }>
  visible: string[]
  onToggle: (id: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="outline" size="sm" className="h-8">
          <Columns3 className="h-3.5 w-3.5" /> Columns ({visible.length})
        </Button>
      } />
      <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            System
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {columns.filter((c) => c.kind === "system").map((c) => (
          <ColumnCheckItem key={c.id} id={c.id} label={c.label} checked={visible.includes(c.id)} onToggle={onToggle} />
        ))}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Form fields
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {columns.filter((c) => c.kind === "field").map((c) => (
          <ColumnCheckItem key={c.id} id={c.id} label={c.label} checked={visible.includes(c.id)} onToggle={onToggle} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ColumnCheckItem({
  id,
  label,
  checked,
  onToggle,
}: {
  id: string
  label: string
  checked: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className={cn(
        "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Checkbox checked={checked} onCheckedChange={() => onToggle(id)} />
      <span className="truncate">{label}</span>
    </button>
  )
}
