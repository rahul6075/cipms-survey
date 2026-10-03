"use client"

import * as React from "react"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Filter as FilterIcon,
  Loader2,
  Search,
  X,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
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
import { Input } from "@/shared/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value"
import { DataTableColumnHeader } from "./DataTableColumnHeader"
import { FiltersPresetsDialog } from "./FiltersPresetsDialog"
import { defaultOp, opDef } from "./operators"
import type { DataTableColumn, DataTableState, FilterItem } from "./types"

export type DataTableBulkAction<Row> = {
  key: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  tone?: "default" | "destructive"
  onRun: (rows: Row[]) => void | Promise<void>
}

export function DataTable<Row extends { _id?: string | number }>({
  columns,
  rows,
  total,
  state,
  onStateChange,
  loading = false,
  error,
  rowKey = (r) => String((r as unknown as { _id?: string }). _id || ""),
  onRowClick,
  bulkActions,
  toolbarRight,
  searchPlaceholder = "Search…",
  emptyState,
  scope = "default",
}: {
  columns: DataTableColumn<Row>[]
  rows: Row[]
  total: number
  state: DataTableState
  onStateChange: (patch: Partial<DataTableState>) => void
  loading?: boolean
  error?: string | null
  rowKey?: (r: Row) => string
  onRowClick?: (r: Row) => void
  bulkActions?: DataTableBulkAction<Row>[]
  toolbarRight?: React.ReactNode
  searchPlaceholder?: string
  emptyState?: React.ReactNode
  /** Scopes saved presets so each table has its own list. */
  scope?: string
}) {
  const [searchInput, setSearchInput] = React.useState(state.q || "")
  const debouncedSearch = useDebouncedValue(searchInput, 300)

  React.useEffect(() => {
    if ((debouncedSearch || "") === (state.q || "")) return
    onStateChange({ q: debouncedSearch, page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // Visibility helpers.
  const isShown = React.useCallback((c: DataTableColumn<Row>) => {
    const ov = state.columnVisibility[c.id]
    if (ov === true) return false
    if (ov === false) return true
    return !c.defaultHidden
  }, [state.columnVisibility])

  const visibility: VisibilityState = React.useMemo(() => {
    const v: VisibilityState = {}
    for (const c of columns) v[c.id] = isShown(c)
    return v
  }, [columns, isShown])

  const colDefs = React.useMemo<ColumnDef<Row>[]>(() =>
    columns.map((c) => ({
      id: c.id,
      header: c.header,
      accessorFn: c.accessor,
      enableHiding: c.hideable !== false,
      enableSorting: c.sortable !== false,
    })),
    [columns],
  )

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  React.useEffect(() => { setRowSelection({}) }, [state.filters, state.q, state.page])

  const table = useReactTable({
    data: rows,
    columns: colDefs,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / state.pageSize)),
    state: {
      pagination: { pageIndex: state.page - 1, pageSize: state.pageSize },
      columnVisibility: visibility,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getRowId: (r) => rowKey(r as Row),
  })

  const visibleCols = columns.filter((c) => visibility[c.id] !== false)
  const selectedRows = rows.filter((r) => rowSelection[rowKey(r)])
  const pageCount = Math.max(1, Math.ceil(total / state.pageSize))

  const [filterOpen, setFilterOpen] = React.useState(false)

  function toggleVisibility(id: string) {
    const col = columns.find((c) => c.id === id)
    if (!col) return
    const shown = isShown(col)
    onStateChange({
      columnVisibility: { ...state.columnVisibility, [id]: shown ? true : false },
    })
  }

  return (
    <Card className="overflow-hidden p-0">
      {/* Toolbar — all table controls stack on the RIGHT; left is reserved for
          page-level actions callers pass via `toolbarRight`. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 p-3">
        <div className="flex items-center gap-2">{toolbarRight}</div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setFilterOpen(true)}
          >
            <FilterIcon className="h-3.5 w-3.5" />
            Filter{state.filters.length > 0 && ` (${state.filters.length})`}
          </Button>

          <ColumnVisibilityMenu
            columns={columns}
            visibility={visibility}
            onToggle={toggleVisibility}
          />

          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchPlaceholder}
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
        </div>
      </div>

      {/* Filters & Presets dialog — triggered by the Filter button above */}
      <FiltersPresetsDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        scope={scope}
        columns={columns}
        filters={state.filters}
        logic={state.logic}
        onChange={({ filters, logic }) => onStateChange({ filters, logic, page: 1 })}
      />

      {/* Chip bar — active filters at-a-glance */}
      {state.filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 bg-muted/30 px-3 py-2">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="rounded-full border border-primary/30 bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-primary hover:bg-primary/5"
          >
            Match {state.logic} · edit
          </button>
          {state.filters.map((f) => {
            const col = columns.find((c) => c.id === f.column)
            if (!col) return null
            const def = opDef(col.kind, f.op)
            return (
              <span key={f.id} className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px]">
                <span className="font-medium">{col.header}</span>
                <span className="text-muted-foreground">{def?.label || f.op}</span>
                {renderValueChip(f, col)}
                <button
                  type="button"
                  onClick={() => onStateChange({
                    filters: state.filters.filter((x) => x.id !== f.id),
                    page: 1,
                  })}
                  className="rounded p-0.5 text-muted-foreground opacity-70 hover:text-destructive"
                  aria-label="Remove filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] text-muted-foreground"
            onClick={() => onStateChange({ filters: [], page: 1 })}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Bulk-select bar */}
      {bulkActions && selectedRows.length > 0 && (
        <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{selectedRows.length} selected</span>
          <span className="text-muted-foreground">·</span>
          {bulkActions.map((a) => {
            const Icon = a.icon
            return (
              <Button
                key={a.key}
                type="button"
                size="sm"
                variant="ghost"
                className={cn("h-7", a.tone === "destructive" && "text-destructive")}
                onClick={() => a.onRun(selectedRows)}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />} {a.label}
              </Button>
            )
          })}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-7"
            onClick={() => setRowSelection({})}
          >
            <X className="h-3 w-3" /> Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {bulkActions && (
                <TableHead className="w-10 pr-0">
                  <Checkbox
                    checked={rows.length > 0 && rows.every((r) => rowSelection[rowKey(r)])}
                    onCheckedChange={(c) => {
                      if (c) {
                        const next: RowSelectionState = {}
                        for (const r of rows) next[rowKey(r)] = true
                        setRowSelection(next)
                      } else setRowSelection({})
                    }}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {visibleCols.map((c) => (
                <TableHead key={c.id} className={cn(c.align === "right" && "text-right")} style={c.width ? { width: c.width } : undefined}>
                  <DataTableColumnHeader
                    column={c}
                    sort={state.sort}
                    onSort={(dir) => onStateChange({ sort: dir ? { column: c.id, dir } : null, page: 1 })}
                    onHide={() => toggleVisibility(c.id)}
                    onFilter={() => {
                      // Add a filter row for THIS column with its default operator,
                      // then open the popover so the user can enter a value.
                      const newFilter: FilterItem = {
                        id: `h-${c.id}-${Date.now()}`,
                        column: c.id,
                        op: defaultOp(c.kind),
                      }
                      onStateChange({ filters: [...state.filters, newFilter], page: 1 })
                      setFilterOpen(true)
                    }}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleCols.length + (bulkActions ? 1 : 0)} className="h-32 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={visibleCols.length + (bulkActions ? 1 : 0)} className="h-32 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleCols.length + (bulkActions ? 1 : 0)} className="h-32 text-center text-sm text-muted-foreground">
                  {emptyState || "No matching rows."}
                </TableCell>
              </TableRow>
            )}
            {table.getRowModel().rows.map((r) => {
              const row = r.original
              const isSel = !!rowSelection[rowKey(row)]
              return (
                <TableRow
                  key={r.id}
                  className={cn(onRowClick && "cursor-pointer", isSel && "bg-primary/5")}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("[data-dt-no-rowclick]")) return
                    onRowClick?.(row)
                  }}
                >
                  {bulkActions && (
                    <TableCell className="pr-0" data-dt-no-rowclick>
                      <Checkbox
                        checked={isSel}
                        onCheckedChange={(c) => setRowSelection((prev) => {
                          const next = { ...prev }
                          if (c) next[rowKey(row)] = true; else delete next[rowKey(row)]
                          return next
                        })}
                      />
                    </TableCell>
                  )}
                  {visibleCols.map((c) => (
                    <TableCell key={c.id} className={cn(c.align === "right" && "text-right")}>
                      {c.cell ? c.cell(row) : formatPrimitive(c.accessor ? c.accessor(row) : (row as Record<string, unknown>)[c.id])}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 p-3 text-sm text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{(state.page - 1) * state.pageSize + 1}–{Math.min(total, state.page * state.pageSize)}</span>{" "}
            of <span className="font-medium text-foreground">{total.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 gap-1">{state.pageSize} / page <ChevronDown className="h-3 w-3" /></Button>} />
              <DropdownMenuContent align="end" className="w-32">
                {[10, 25, 50, 100, 200].map((n) => (
                  <DropdownMenuItem key={n} onClick={() => onStateChange({ pageSize: n, page: 1 })}>
                    {n} / page
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={state.page <= 1} onClick={() => onStateChange({ page: state.page - 1 })} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">
              Page <span className="font-medium text-foreground">{state.page}</span> of {pageCount}
            </span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={state.page >= pageCount} onClick={() => onStateChange({ page: state.page + 1 })} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

/* ─── helpers ────────────────────────────────────────────────── */

function ColumnVisibilityMenu<Row>({
  columns,
  visibility,
  onToggle,
}: {
  columns: DataTableColumn<Row>[]
  visibility: VisibilityState
  onToggle: (id: string) => void
}) {
  const hideable = columns.filter((c) => c.hideable !== false)
  const shown = hideable.filter((c) => visibility[c.id] !== false).length
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-8">
            <Columns3 className="h-3.5 w-3.5" /> Columns{" "}
            <span className="ml-1 text-[10px] text-muted-foreground">({shown}/{hideable.length})</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Toggle columns
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {hideable.map((c) => {
          const on = visibility[c.id] !== false
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <Checkbox checked={on} />
              <span className="truncate">{c.header}</span>
            </button>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatPrimitive(v: unknown): React.ReactNode {
  if (v === null || v === undefined || v === "") return <span className="text-xs text-muted-foreground">—</span>
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ")
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

function renderValueChip<Row>(f: FilterItem, col: DataTableColumn<Row>): React.ReactNode {
  if (f.value === undefined || f.value === null || f.value === "") return null
  const label = (v: unknown) => {
    if (col.kind === "date" && typeof v === "string") return new Date(v).toLocaleDateString("en-IN")
    return col.enumOptions?.find((o) => o.value === v)?.label ?? String(v)
  }
  const text = Array.isArray(f.value)
    ? f.value.map(label).join(", ")
    : f.value2 !== undefined ? `${label(f.value)} – ${label(f.value2)}` : label(f.value)
  return <span className="max-w-[160px] truncate font-semibold text-primary" title={text}>{text}</span>
}
