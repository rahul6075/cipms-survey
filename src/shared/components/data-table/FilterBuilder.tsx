"use client"

import * as React from "react"
import { Plus, Trash2, X } from "lucide-react"
import { v4 as uuid } from "uuid"

import { Button } from "@/shared/components/ui/button"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/components/ui/select"

import { OPS_BY_KIND, defaultOp, opDef } from "./operators"
import type { DataTableColumn, FilterItem, Op } from "./types"

/**
 * MUI-style row filter builder.
 *   • Per-row Columns / Operator / Value micro-labels
 *   • Combinator (And / Or) in the LEFT gutter — dropdown on row 2, muted echo on rows 3+
 *   • × remove on the far LEFT, before the combinator cell
 *   • + Add Filter at the bottom-left, Remove All (trash) at the bottom-right
 */
export function FilterBuilder<Row>({
  columns,
  filters,
  logic,
  onChange,
  footerSlot,
}: {
  columns: DataTableColumn<Row>[]
  filters: FilterItem[]
  logic: "and" | "or"
  onChange: (next: { filters: FilterItem[]; logic: "and" | "or" }) => void
  /** Rendered inside the footer bar, aligned to the left of Remove All. */
  footerSlot?: React.ReactNode
}) {
  const filterable = React.useMemo(
    () => columns.filter((c) => c.filterable !== false && c.kind !== "custom"),
    [columns],
  )

  function addRow() {
    const col = filterable[0]
    if (!col) return
    const row: FilterItem = { id: uuid(), column: col.id, op: defaultOp(col.kind) }
    onChange({ logic, filters: [...filters, row] })
  }
  function removeRow(id: string) {
    onChange({ logic, filters: filters.filter((f) => f.id !== id) })
  }
  function patchRow(id: string, patch: Partial<FilterItem>) {
    onChange({ logic, filters: filters.map((f) => f.id === id ? { ...f, ...patch } : f) })
  }
  function clearAll() { onChange({ logic: "and", filters: [] }) }

  // Grid: [× | And/Or cell | Columns | Operator | Value]
  // Columns/Operator/Value take fractional space so fields fill the pane width.
  const gridTemplate =
    "28px 84px minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.6fr)"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {filters.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 px-3 py-10 text-center text-xs text-muted-foreground">
            No filter rules yet. Click <span className="font-medium text-foreground">+ Add Filter</span> below to begin.
          </p>
        ) : (
          <ul className="space-y-4">
            {filters.map((f, i) => (
              <FilterRow<Row>
                key={f.id}
                index={i}
                row={f}
                logic={logic}
                columns={filterable}
                gridTemplate={gridTemplate}
                onPatch={(p) => patchRow(f.id, p)}
                onRemove={() => removeRow(f.id)}
                onLogicChange={(v) => onChange({ logic: v, filters })}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-[12px] font-semibold text-primary hover:bg-primary/5 hover:text-primary"
            onClick={addRow}
            disabled={filterable.length === 0}
          >
            <Plus className="h-3.5 w-3.5" /> Add Filter
          </Button>
          {footerSlot}
        </div>
        {filters.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-[12px] font-semibold text-primary hover:bg-primary/5 hover:text-primary"
            onClick={clearAll}
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove All
          </Button>
        )}
      </div>
    </div>
  )
}

/* ─── one row ────────────────────────────────────────────────── */

function FilterRow<Row>({
  index,
  row,
  logic,
  columns,
  gridTemplate,
  onPatch,
  onRemove,
  onLogicChange,
}: {
  index: number
  row: FilterItem
  logic: "and" | "or"
  columns: DataTableColumn<Row>[]
  gridTemplate: string
  onPatch: (p: Partial<FilterItem>) => void
  onRemove: () => void
  onLogicChange: (v: "and" | "or") => void
}) {
  const column = columns.find((c) => c.id === row.column) || columns[0]
  const ops = OPS_BY_KIND[column.kind] || []
  const def = opDef(column.kind, row.op) || ops[0]

  function pickColumn(id: string) {
    const next = columns.find((c) => c.id === id)
    if (!next) return
    const stillValid = (OPS_BY_KIND[next.kind] || []).some((o) => o.op === row.op)
    onPatch({
      column: next.id,
      op: stillValid ? row.op : defaultOp(next.kind),
      value: undefined,
      value2: undefined,
    })
  }

  return (
    <li className="grid items-end gap-2" style={{ gridTemplateColumns: gridTemplate }}>
      {/* × remove (always visible on the left) */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label={`Remove filter ${index + 1}`}
      >
        <X className="h-4 w-4" />
      </Button>

      {/* And / Or (combinator) — the left gutter */}
      <div className="flex h-9 items-end justify-center">
        {index === 0 ? (
          <span className="pb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">
            {/* intentionally blank — the first row has no combinator */}
          </span>
        ) : index === 1 ? (
          <Select value={logic} onValueChange={(v) => v && onLogicChange(v as "and" | "or")}>
            <SelectTrigger className="h-8 w-20 min-w-0 text-[11px] font-medium uppercase">
              <span className="truncate text-left">{logic === "and" ? "And" : "Or"}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">And</SelectItem>
              <SelectItem value="or">Or</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {logic}
          </span>
        )}
      </div>

      {/* Columns */}
      <LabeledField label="Columns">
        <Select value={column.id} onValueChange={(v) => v && pickColumn(v)}>
          <SelectTrigger className="h-8 w-full min-w-0">
            <span className="truncate text-left">{column.header}</span>
          </SelectTrigger>
          <SelectContent>
            {columns.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.header}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </LabeledField>

      {/* Operator */}
      <LabeledField label="Operator">
        <Select
          value={row.op}
          onValueChange={(v) => {
            const nd = opDef(column.kind, (v || row.op) as Op) || def
            onPatch({
              op: (v || row.op) as Op,
              value: nd.needsValue ? row.value : undefined,
              value2: nd.needsValue2 ? row.value2 : undefined,
            })
          }}
        >
          <SelectTrigger className="h-8 w-full min-w-0">
            <span className="truncate text-left">{def.label}</span>
          </SelectTrigger>
          <SelectContent>
            {ops.map((o) => <SelectItem key={o.op} value={o.op}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </LabeledField>

      {/* Value(s) */}
      <LabeledField label="Value">
        {def.needsValue ? (
          <div className="space-y-1">
            <ValueInput column={column} value={row.value} onChange={(v) => onPatch({ value: v })} input={def.input || "text"} />
            {def.needsValue2 && (
              <ValueInput column={column} value={row.value2} onChange={(v) => onPatch({ value2: v })} input={def.input || "text"} />
            )}
          </div>
        ) : (
          <span className="inline-block h-8 pt-2 text-[11px] italic text-muted-foreground">no value needed</span>
        )}
      </LabeledField>
    </li>
  )
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

/* ─── value inputs by kind ───────────────────────────────────── */

function ValueInput<Row>({
  column,
  value,
  onChange,
  input,
}: {
  column: DataTableColumn<Row>
  value: unknown
  onChange: (v: unknown) => void
  input: "text" | "number" | "date" | "enum" | "multienum"
}) {
  if (input === "enum") {
    const opts = column.enumOptions || []
    const selectedLabel = opts.find((o) => o.value === value)?.label
    return (
      <Select value={(value as string) || ""} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-full min-w-0">
          <span className={`truncate text-left ${selectedLabel ? "" : "text-muted-foreground"}`}>
            {selectedLabel || "Select…"}
          </span>
        </SelectTrigger>
        <SelectContent>
          {opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    )
  }
  if (input === "multienum") {
    const opts = column.enumOptions || []
    const selected = new Set(
      (Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : []) as string[],
    )
    return (
      <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-md border border-border/60 p-1.5">
        {opts.length === 0 && (
          <p className="px-1.5 py-2 text-center text-[11px] text-muted-foreground">No options</p>
        )}
        {opts.map((o) => {
          const on = selected.has(o.value)
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                const next = new Set(selected)
                if (on) next.delete(o.value); else next.add(o.value)
                onChange(Array.from(next))
              }}
              className={`flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-muted ${on ? "bg-primary/10 text-primary" : ""}`}
            >
              <Checkbox checked={on} />
              <span className="truncate">{o.label}</span>
            </button>
          )
        })}
      </div>
    )
  }
  if (input === "number") {
    return (
      <Input
        type="number"
        value={(value as number | string | undefined) ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="h-8"
        placeholder="Filter value"
      />
    )
  }
  if (input === "date") {
    const raw = typeof value === "string" ? value : ""
    return (
      <Input
        type="date"
        value={raw.slice(0, 10)}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
        className="h-8"
      />
    )
  }
  return (
    <Input
      type="text"
      value={(value as string) || ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-8"
      placeholder="Filter value"
    />
  )
}
