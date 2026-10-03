"use client"

import * as React from "react"
import { Check, Plus, Trash2, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"

import { FilterBuilder } from "./FilterBuilder"
import {
  deletePreset,
  listPresets,
  savePreset,
  statesEqual,
  updatePreset,
  type FilterPreset,
} from "./presets"
import type { DataTableColumn, FilterItem } from "./types"

export function FiltersPresetsDialog<Row>({
  open,
  onOpenChange,
  scope,
  columns,
  filters,
  logic,
  onChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  scope: string
  columns: DataTableColumn<Row>[]
  filters: FilterItem[]
  logic: "and" | "or"
  onChange: (next: { filters: FilterItem[]; logic: "and" | "or" }) => void
}) {
  const [presets, setPresets] = React.useState<FilterPreset[]>([])
  const [loadedId, setLoadedId] = React.useState<string | null>(null)
  const [showNameInput, setShowNameInput] = React.useState(false)
  const [newName, setNewName] = React.useState("")

  // Refresh presets whenever the dialog opens so edits made in another tab show up.
  React.useEffect(() => {
    if (open) setPresets(listPresets(scope))
  }, [open, scope])

  // Clear the "loaded" marker whenever the current state diverges from it.
  const loadedPreset = presets.find((p) => p.id === loadedId) || null
  const dirty = loadedPreset
    ? !statesEqual(loadedPreset.state, { filters, logic })
    : filters.length > 0

  function load(p: FilterPreset) {
    onChange(p.state)
    setLoadedId(p.id)
    setShowNameInput(false)
  }
  function remove(p: FilterPreset) {
    if (!confirm(`Delete preset "${p.name}"?`)) return
    deletePreset(scope, p.id)
    setPresets(listPresets(scope))
    if (loadedId === p.id) setLoadedId(null)
  }
  function startSaveNew() {
    setShowNameInput(true)
    setNewName(deriveNameFromFilters(filters, columns) || "")
  }
  function confirmSave() {
    const trimmed = newName.trim()
    if (!trimmed || filters.length === 0) return
    const p = savePreset(scope, { name: trimmed, state: { filters, logic } })
    setPresets(listPresets(scope))
    setLoadedId(p.id)
    setShowNameInput(false)
    setNewName("")
  }
  function updateLoaded() {
    if (!loadedPreset) return
    const next = updatePreset(scope, loadedPreset.id, { state: { filters, logic } })
    if (next) setPresets(listPresets(scope))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        /*
         * Wider dialog. `showCloseButton={false}` suppresses the built-in × from
         * shadcn's DialogContent so our header's × is the only one visible.
         */
        showCloseButton={false}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[920px]"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
          <DialogTitle className="text-sm font-semibold">Filters &amp; Presets</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 shrink-0 p-0 text-muted-foreground"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr]">
          {/* ─── LEFT: Saved Presets ─────────────────────────── */}
          <aside className="flex min-h-0 flex-col border-r border-border/60">
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <p className="text-sm font-semibold">Saved Presets</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[12px] font-semibold text-primary hover:bg-primary/5 hover:text-primary"
                onClick={startSaveNew}
                disabled={filters.length === 0}
              >
                <Plus className="h-3.5 w-3.5" /> Save New
              </Button>
            </div>

            {showNameInput && (
              <form
                onSubmit={(e) => { e.preventDefault(); confirmSave() }}
                className="mx-3 mb-2 flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 p-1"
              >
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Preset name"
                  className="h-7 border-transparent bg-transparent px-2 text-xs shadow-none focus-visible:ring-0"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={!newName.trim()}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground"
                  onClick={() => { setShowNameInput(false); setNewName("") }}
                  aria-label="Cancel"
                >
                  <X className="h-3 w-3" />
                </Button>
              </form>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              {presets.length === 0 ? (
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  <p className="font-medium text-foreground/80">No saved presets</p>
                  <p className="mt-1 opacity-80">Save your current filters to create a preset</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {presets.map((p) => {
                    const isLoaded = loadedId === p.id
                    return (
                      <li
                        key={p.id}
                        className={cn(
                          "group/preset flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm transition",
                          isLoaded
                            ? "border-primary/40 bg-primary/5 text-primary"
                            : "border-transparent hover:border-border hover:bg-muted/50",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => load(p)}
                          className="min-w-0 flex-1 truncate text-left text-[12px] font-medium"
                        >
                          {p.name}
                          {isLoaded && (
                            <span className="ml-1.5 text-[10px] font-normal text-primary/70">
                              {dirty ? "· modified" : "· loaded"}
                            </span>
                          )}
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 shrink-0 p-0 text-muted-foreground opacity-0 transition hover:text-destructive group-hover/preset:opacity-100"
                          onClick={() => remove(p)}
                          aria-label={`Delete preset ${p.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* ─── RIGHT: Filter builder ───────────────────────── */}
          <div className="flex min-h-0 flex-col">
            <FilterBuilder
              columns={columns}
              filters={filters}
              logic={logic}
              onChange={onChange}
              footerSlot={
                loadedPreset && dirty && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-[12px]"
                    onClick={updateLoaded}
                  >
                    <Check className="h-3.5 w-3.5" /> Update &ldquo;{loadedPreset.name}&rdquo;
                  </Button>
                )
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function deriveNameFromFilters<Row>(
  filters: FilterItem[],
  columns: DataTableColumn<Row>[],
): string {
  if (filters.length === 0) return ""
  const first = filters[0]
  const col = columns.find((c) => c.id === first.column)
  const label = col?.header || first.column
  const value = first.value !== undefined && first.value !== null && first.value !== ""
    ? String(first.value)
    : null
  const extra = filters.length > 1 ? ` +${filters.length - 1}` : ""
  return value ? `${label} ${first.op} ${value}${extra}` : `${label} ${first.op}${extra}`
}
