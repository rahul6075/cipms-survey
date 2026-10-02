"use client"

import * as React from "react"
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlertCircle,
  Copy,
  GripVertical,
  Plus,
  Settings,
  Trash2,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import type { FieldType, FormField } from "@/shared/types"

import type { BuilderForm, FieldError } from "../FormBuilderView"
import { FIELD_TYPE_META } from "./BuilderPalette"

export function BuilderCanvas({
  form,
  onFormHeader,
  fields,
  selectedId,
  onSelect,
  onAdd,
  onReorder,
  onDuplicate,
  onRemove,
  onPatch,
  errors,
}: {
  form: BuilderForm
  onFormHeader: (patch: Partial<BuilderForm>) => void
  fields: FormField[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (type: FieldType, index?: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onPatch: (id: string, patch: Partial<FormField>) => void
  errors: FieldError[]
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const errByField = React.useMemo(() => {
    const m = new Map<string, string[]>()
    for (const e of errors) if (e.fieldId) {
      const list = m.get(e.fieldId) || []
      list.push(e.message)
      m.set(e.fieldId, list)
    }
    return m
  }, [errors])

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = fields.findIndex((f) => f.id === active.id)
    const to = fields.findIndex((f) => f.id === over.id)
    if (from === -1 || to === -1) return
    onReorder(from, to)
  }

  return (
    <div className="space-y-3">
      {/* Form header card */}
      <section
        className={cn(
          "rounded-xl border bg-card p-4 transition",
          selectedId === null ? "border-primary/40 ring-1 ring-primary/15" : "border-border/60"
        )}
        onClick={() => onSelect("")}
      >
        <Input
          value={form.title}
          onChange={(e) => onFormHeader({ title: e.target.value })}
          placeholder="Form title"
          className="h-9 border-none bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
        />
        <Textarea
          value={form.description || ""}
          onChange={(e) => onFormHeader({ description: e.target.value })}
          placeholder="Description (shown to respondents)"
          rows={2}
          className="mt-1 min-h-[36px] resize-none border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
        />
      </section>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {fields.map((f, idx) => (
              <React.Fragment key={f.id}>
                <InsertRail onAdd={(t) => onAdd(t, idx)} />
                <SortableFieldCard
                  field={f}
                  index={idx}
                  selected={selectedId === f.id}
                  errors={errByField.get(f.id) || []}
                  onSelect={() => onSelect(f.id)}
                  onDuplicate={() => onDuplicate(f.id)}
                  onRemove={() => onRemove(f.id)}
                  onPatch={(p) => onPatch(f.id, p)}
                />
              </React.Fragment>
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      {/* Final + rail or empty state */}
      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 p-10 text-center">
          <p className="text-sm font-medium">No fields yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Pick a field type from the left palette, or use the quick-add button below.</p>
          <div className="mt-4 inline-flex">
            <QuickAddMenu onPick={(t) => onAdd(t)}>
              <Button type="button" size="sm">
                <Plus className="h-4 w-4" /> Add your first field
              </Button>
            </QuickAddMenu>
          </div>
        </div>
      ) : (
        <InsertRail onAdd={(t) => onAdd(t, fields.length)} />
      )}
    </div>
  )
}

/* ─── +rail between cards ────────────────────────────────────── */

function InsertRail({ onAdd }: { onAdd: (t: FieldType) => void }) {
  return (
    <div className="group/rail relative mx-auto flex h-5 items-center justify-center">
      <div className="h-px w-full bg-transparent transition group-hover/rail:bg-primary/30" />
      <div className="absolute">
        <QuickAddMenu onPick={onAdd}>
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 bg-background text-primary opacity-0 shadow-sm transition hover:bg-primary hover:text-primary-foreground group-hover/rail:opacity-100 data-[popup-open]:opacity-100"
            aria-label="Insert field"
          >
            <Plus className="h-3 w-3" />
          </button>
        </QuickAddMenu>
      </div>
    </div>
  )
}

function QuickAddMenu({
  onPick,
  children,
}: {
  onPick: (t: FieldType) => void
  children: React.ReactElement
}) {
  const [q, setQ] = React.useState("")
  const entries = React.useMemo(
    () => (Object.entries(FIELD_TYPE_META) as Array<[FieldType, (typeof FIELD_TYPE_META)[FieldType]]>)
      .filter(([, m]) => m.label.toLowerCase().includes(q.toLowerCase()) || m.desc.toLowerCase().includes(q.toLowerCase())),
    [q]
  )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={children} />
      <DropdownMenuContent align="center" className="w-64 p-1" sideOffset={8}>
        <div className="px-1 pb-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search field type…"
            className="h-7 text-xs"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Insert
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          {entries.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matches</p>
          ) : (
            entries.map(([type, meta]) => (
              <DropdownMenuItem key={type} onClick={() => { onPick(type); setQ("") }}>
                <meta.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{meta.label}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{meta.group}</span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ─── sortable field card ────────────────────────────────────── */

function SortableFieldCard({
  field,
  index,
  selected,
  errors,
  onSelect,
  onDuplicate,
  onRemove,
  onPatch,
}: {
  field: FormField
  index: number
  selected: boolean
  errors: string[]
  onSelect: () => void
  onDuplicate: () => void
  onRemove: () => void
  onPatch: (p: Partial<FormField>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  const meta = FIELD_TYPE_META[field.type as FieldType]
  const Icon = meta?.icon

  const [editing, setEditing] = React.useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/card relative rounded-lg border bg-card transition",
        selected ? "border-primary/50 ring-1 ring-primary/15" : "border-border/60 hover:border-border",
        errors.length > 0 && !selected && "border-destructive/40",
      )}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-no-select]")) return
        onSelect()
      }}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          data-no-select
          className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground opacity-0 transition group-hover/card:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <span className="mt-1 text-[11px] font-semibold tabular-nums text-muted-foreground">{index + 1}.</span>

        {Icon && (
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
            <Icon className="h-3 w-3 text-foreground/70" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              value={field.label}
              onChange={(e) => onPatch({ label: e.target.value })}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setEditing(false) } }}
              autoFocus
              className="h-7 text-sm"
              data-no-select
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => setEditing(true)}
              className="block w-full truncate text-left text-sm font-medium"
            >
              {field.label || <span className="italic text-muted-foreground">Untitled {meta?.label || field.type}</span>}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </button>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] font-normal">{meta?.label || field.type}</Badge>
            {field.required && <Badge variant="outline" className="text-[10px]">required</Badge>}
            {field.prefill_from && (
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                autofill · {field.prefill_from.replace("pradhan.", "")}
              </Badge>
            )}
            {errors.map((e, i) => (
              <Badge key={i} variant="outline" className="gap-1 text-[10px] text-destructive border-destructive/40">
                <AlertCircle className="h-2.5 w-2.5" /> {e}
              </Badge>
            ))}
          </div>
        </div>

        <div
          className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover/card:opacity-100"
          data-no-select
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setEditing(true)}
            aria-label="Rename"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onDuplicate}
            aria-label="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  )
}
