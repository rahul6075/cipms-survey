"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { v4 as uuid } from "uuid"
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  Loader2,
  Save,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Input } from "@/shared/components/ui/input"
import type { FieldType, FormField } from "@/shared/types"

import { BuilderCanvas } from "./builder/BuilderCanvas"
import { BuilderInspector } from "./builder/BuilderInspector"
import { BuilderPalette, FIELD_TYPE_META, type FieldTypeMeta } from "./builder/BuilderPalette"
import { BuilderPreviewDrawer } from "./builder/BuilderPreviewDrawer"

/* ─── types ──────────────────────────────────────────────────── */

export type BuilderForm = {
  _id?: string
  title: string
  description?: string
  status: "draft" | "active" | "closed"
  access_type?: "public" | "private" | "restricted"
  require_consent?: boolean
  fields: FormField[]
}

export type FieldError = { fieldId: string | null; message: string }

/* ─── defaults ───────────────────────────────────────────────── */

function makeField(type: FieldType, order: number): FormField {
  return {
    id: uuid(),
    label: "",
    type,
    required: false,
    placeholder: "",
    options: ["radio", "checkbox", "dropdown"].includes(type) ? ["Option 1", "Option 2"] : [],
    platforms: type === "social_media" ? ["instagram", "facebook", "whatsapp"] : undefined,
    constituency_config: type === "constituency"
      ? { show_state: true, show_ls: true, show_vs: true, show_block: false }
      : undefined,
    order,
  }
}

const DRAFT_KEY = (id?: string) => `cipms_form_draft_${id || "new"}`

/* ─── main ───────────────────────────────────────────────────── */

export function FormBuilderView({ initialData }: { initialData?: Partial<BuilderForm> & { _id?: string } }) {
  const router = useRouter()

  const [form, setForm] = React.useState<BuilderForm>(() => ({
    _id: initialData?._id,
    title: initialData?.title || "",
    description: initialData?.description || "",
    status: (initialData?.status as BuilderForm["status"]) || "draft",
    access_type: (initialData?.access_type as BuilderForm["access_type"]) || "public",
    require_consent: initialData?.require_consent ?? false,
    fields: (initialData?.fields as FormField[]) || [],
  }))

  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [autosaveAt, setAutosaveAt] = React.useState<Date | null>(null)
  const [draftFound, setDraftFound] = React.useState<null | { savedAt: number }>(null)

  // Try to restore a localStorage draft on first mount for this form id.
  // We only prompt — never auto-overwrite — so the user is in control.
  const hydrated = React.useRef(false)
  React.useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    try {
      const raw = localStorage.getItem(DRAFT_KEY(initialData?._id))
      if (!raw) return
      const parsed = JSON.parse(raw) as { form: BuilderForm; savedAt: number }
      // Only prompt if the draft differs from the initial payload.
      const same = JSON.stringify(parsed.form.fields) === JSON.stringify(form.fields) &&
                   parsed.form.title === form.title
      // localStorage only exists after hydration, so this can't be initial state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!same) setDraftFound({ savedAt: parsed.savedAt })
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced localStorage autosave. 500ms after the last change we write a
  // local draft so a reload/crash never costs more than half a second of work.
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY(initialData?._id),
          JSON.stringify({ form, savedAt: Date.now() })
        )
        setAutosaveAt(new Date())
      } catch { /* ignore quota */ }
    }, 500)
    return () => clearTimeout(t)
  }, [form, initialData?._id])

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY(initialData?._id))
      if (!raw) return
      const parsed = JSON.parse(raw) as { form: BuilderForm }
      setForm({ ...parsed.form, _id: initialData?._id })
      toast.success("Draft restored")
    } catch { toast.error("Could not restore draft") }
    setDraftFound(null)
  }
  function dismissDraft() {
    try { localStorage.removeItem(DRAFT_KEY(initialData?._id)) } catch { /* ignore */ }
    setDraftFound(null)
  }

  /* mutations ---------------------------------------------------- */

  const addField = React.useCallback((type: FieldType, index?: number) => {
    setForm((prev) => {
      const next = [...prev.fields]
      const field = makeField(type, next.length)
      if (typeof index === "number") next.splice(index, 0, field)
      else next.push(field)
      // Normalise order values after insertion.
      next.forEach((f, i) => { f.order = i })
      setSelectedId(field.id)
      return { ...prev, fields: next }
    })
  }, [])

  const updateField = React.useCallback((id: string, patch: Partial<FormField>) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => f.id === id ? { ...f, ...patch } : f),
    }))
  }, [])

  const removeField = React.useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })),
    }))
    setSelectedId((cur) => cur === id ? null : cur)
  }, [])

  const duplicateField = React.useCallback((id: string) => {
    setForm((prev) => {
      const idx = prev.fields.findIndex((f) => f.id === id)
      if (idx < 0) return prev
      const original = prev.fields[idx]
      const copy: FormField = { ...original, id: uuid(), label: original.label ? `${original.label} (copy)` : "" }
      const next = [...prev.fields]
      next.splice(idx + 1, 0, copy)
      setSelectedId(copy.id)
      return { ...prev, fields: next.map((f, i) => ({ ...f, order: i })) }
    })
  }, [])

  const reorder = React.useCallback((fromIndex: number, toIndex: number) => {
    setForm((prev) => {
      if (fromIndex === toIndex) return prev
      const next = [...prev.fields]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { ...prev, fields: next.map((f, i) => ({ ...f, order: i })) }
    })
  }, [])

  /* validation --------------------------------------------------- */

  const errors = React.useMemo(() => validate(form), [form])
  const canSave = form.title.trim().length > 0 && errors.length === 0

  /* save --------------------------------------------------------- */

  async function handleSave() {
    if (!canSave) {
      toast.error("Fix the highlighted errors first")
      return
    }
    setSaving(true)
    const method = initialData?._id ? "PUT" : "POST"
    const url = initialData?._id ? `/api/forms/${initialData._id}` : "/api/forms"
    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          status: form.status,
          fields: form.fields,
          require_consent: !!form.require_consent,
        }),
      })
      if (!r.ok) throw new Error("Save failed")
      toast.success(initialData?._id ? "Form updated" : "Form created")
      try { localStorage.removeItem(DRAFT_KEY(initialData?._id)) } catch { /* ignore */ }
      router.push("/dashboard/forms")
    } catch (e) { toast.error((e as Error).message) }
    finally { setSaving(false) }
  }

  /* keyboard ----------------------------------------------------- */

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inEditable = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
      const meta = e.metaKey || e.ctrlKey

      if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); handleSave(); return }
      if (meta && e.key.toLowerCase() === "e") { e.preventDefault(); setPreviewOpen((o) => !o); return }
      if (inEditable || !selectedId) return

      if (meta && e.key.toLowerCase() === "d") { e.preventDefault(); duplicateField(selectedId); return }
      if ((e.key === "Backspace" || e.key === "Delete") && meta) {
        e.preventDefault(); removeField(selectedId); return
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        const idx = form.fields.findIndex((f) => f.id === selectedId)
        const next = e.key === "ArrowDown" ? idx + 1 : idx - 1
        if (next >= 0 && next < form.fields.length) setSelectedId(form.fields[next].id)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, form.fields, canSave])

  const selected = form.fields.find((f) => f.id === selectedId) || null

  return (
    <div className="-m-4 flex min-h-[calc(100vh-7rem)] flex-col sm:-m-6 lg:-m-8">
      {/*
       * Builder header sticks to the top of its own scroll container (the
       * dashboard layout's SidebarInset body) — which already sits below the
       * global AppHeader. So we use top-0 here; using top-14 left a 56px gap.
       */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            nativeButton={false}
            render={<Link href="/dashboard/forms" />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Untitled Survey Form"
              className="h-8 border-none bg-transparent px-0 text-base font-semibold tracking-tight shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{form.fields.length} field{form.fields.length !== 1 && "s"}</span>
              <span>·</span>
              <span>{initialData?._id ? "Editing" : "New form"}</span>
              <span>·</span>
              <AutosaveLabel at={autosaveAt} />
              {errors.length > 0 && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.length} issue{errors.length !== 1 && "s"}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusMenu value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !canSave}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </div>
      </header>

      {draftFound && (
        <div className="border-b border-border/60 bg-primary/5 px-4 py-2 sm:px-6">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 text-xs">
            <span className="font-medium">Unsaved draft from {new Date(draftFound.savedAt).toLocaleString("en-IN")} found.</span>
            <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={restoreDraft}>Restore</Button>
            <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={dismissDraft}>Dismiss</Button>
          </div>
        </div>
      )}

      {/* Three-pane layout */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <aside className="hidden w-[240px] shrink-0 flex-col gap-4 lg:flex">
          <OutlineTree
            fields={form.fields}
            selectedId={selectedId}
            onSelect={setSelectedId}
            errors={errors}
          />
          <BuilderPalette onAdd={(type) => addField(type)} />
        </aside>

        <main className="min-w-0 flex-1">
          <BuilderCanvas
            form={form}
            onFormHeader={(patch) => setForm((p) => ({ ...p, ...patch }))}
            fields={form.fields}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={(type, index) => addField(type, index)}
            onReorder={reorder}
            onDuplicate={duplicateField}
            onRemove={removeField}
            onPatch={updateField}
            errors={errors}
          />
        </main>

        <aside className="hidden w-[340px] shrink-0 xl:block">
          {/* Sticks just below the builder's own sticky header. */}
          <div className="sticky top-[72px]">
            <BuilderInspector
              form={form}
              onForm={(patch) => setForm((p) => ({ ...p, ...patch }))}
              field={selected}
              onFieldPatch={(patch) => selected && updateField(selected.id, patch)}
              onDeselect={() => setSelectedId(null)}
            />
          </div>
        </aside>
      </div>

      <BuilderPreviewDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        form={form}
      />
    </div>
  )
}

/* ─── outline tree ───────────────────────────────────────────── */

function OutlineTree({
  fields,
  selectedId,
  onSelect,
  errors,
}: {
  fields: FormField[]
  selectedId: string | null
  onSelect: (id: string) => void
  errors: FieldError[]
}) {
  const errById = React.useMemo(() => {
    const m = new Map<string, number>()
    for (const e of errors) if (e.fieldId) m.set(e.fieldId, (m.get(e.fieldId) || 0) + 1)
    return m
  }, [errors])

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Outline</p>
        <span className="text-[10px] text-muted-foreground">{fields.length}</span>
      </div>
      {fields.length === 0 ? (
        <p className="p-3 text-xs text-muted-foreground">No fields yet. Pick one from the palette below.</p>
      ) : (
        <ul className="max-h-[300px] overflow-y-auto p-1">
          {fields.map((f, i) => {
            const meta = FIELD_TYPE_META[f.type as FieldType]
            const errCount = errById.get(f.id) || 0
            const Icon = meta?.icon
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onSelect(f.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition",
                    selectedId === f.id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-muted/60",
                  )}
                >
                  <span className="w-4 shrink-0 text-[10px] text-muted-foreground tabular-nums">{i + 1}</span>
                  {Icon && <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 flex-1 truncate">
                    {f.label || <span className="italic text-muted-foreground">Untitled {meta?.label || f.type}</span>}
                  </span>
                  {errCount > 0 && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" title={`${errCount} issue(s)`} />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ─── status menu ────────────────────────────────────────────── */

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  draft:  { label: "Draft",  cls: "bg-muted text-foreground border-border", dot: "bg-muted-foreground/50" },
  active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", dot: "bg-emerald-500" },
  closed: { label: "Closed", cls: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
}

function StatusMenu({ value, onChange }: { value: string; onChange: (v: BuilderForm["status"]) => void }) {
  const meta = STATUS_META[value]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className={cn("h-8 gap-1.5 border", meta.cls)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label}
            <ChevronRight className="h-3 w-3 rotate-90 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-32">
        {(Object.keys(STATUS_META) as Array<BuilderForm["status"]>).map((s) => (
          <DropdownMenuItem key={s} onClick={() => onChange(s)}>
            <span className={cn("mr-2 h-1.5 w-1.5 rounded-full", STATUS_META[s].dot)} />
            {STATUS_META[s].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AutosaveLabel({ at }: { at: Date | null }) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  if (!at) return <span className="inline-flex items-center gap-1 opacity-60"><Loader2 className="h-2.5 w-2.5 animate-spin" /> saving locally…</span>
  const secs = Math.max(0, Math.round((now - at.getTime()) / 1000))
  const label = secs < 5 ? "just now" : secs < 60 ? `${secs}s ago` : `${Math.round(secs / 60)}m ago`
  return (
    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
      <Check className="h-2.5 w-2.5" /> saved locally {label}
    </span>
  )
}

/* ─── validation ─────────────────────────────────────────────── */

function validate(form: BuilderForm): FieldError[] {
  const out: FieldError[] = []
  if (!form.title.trim()) out.push({ fieldId: null, message: "Form title is required" })

  const seenLabels = new Map<string, number>()
  for (const f of form.fields) {
    if (!f.label?.trim()) out.push({ fieldId: f.id, message: "Label is required" })
    else {
      const k = f.label.trim().toLowerCase()
      seenLabels.set(k, (seenLabels.get(k) || 0) + 1)
    }
    if (["radio", "checkbox", "dropdown"].includes(f.type)) {
      const opts = (f.options || []).filter((o) => o.trim())
      if (opts.length < 2) out.push({ fieldId: f.id, message: "Choice fields need at least 2 options" })
    }
  }
  for (const [k, n] of seenLabels) {
    if (n > 1) out.push({ fieldId: null, message: `Duplicate label “${k}” — labels should be unique` })
  }
  return out
}

/* Re-export field meta so callers (palette) share one source of truth. */
export { FIELD_TYPE_META, type FieldTypeMeta }
