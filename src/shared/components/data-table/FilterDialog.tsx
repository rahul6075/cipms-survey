"use client"

import { X } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog"

import { FilterBuilder } from "./FilterBuilder"
import type { DataTableColumn, FilterItem } from "./types"

export function FilterDialog<Row>({
  open,
  onOpenChange,
  columns,
  filters,
  logic,
  onChange,
  hint,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  columns: DataTableColumn<Row>[]
  filters: FilterItem[]
  logic: "and" | "or"
  onChange: (next: { filters: FilterItem[]; logic: "and" | "or" }) => void
  /** One line under the title, e.g. how text matching behaves for this table. */
  hint?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* showCloseButton={false}: the header below has the only close button. */}
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-5 py-3">
          <div className="min-w-0">
            <DialogTitle className="text-sm font-semibold">Filters</DialogTitle>
            {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
          </div>
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

        <FilterBuilder columns={columns} filters={filters} logic={logic} onChange={onChange} />
      </DialogContent>
    </Dialog>
  )
}
