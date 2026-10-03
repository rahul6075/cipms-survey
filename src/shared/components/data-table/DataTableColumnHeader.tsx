"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  EyeOff,
  Filter as FilterIcon,
  MoreVertical,
  Pin,
  Settings2,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import type { DataTableColumn, SortState } from "./types"

export function DataTableColumnHeader<Row>({
  column,
  sort,
  onSort,
  onHide,
  onFilter,
  onManageColumns,
}: {
  column: DataTableColumn<Row>
  sort: SortState
  onSort: (dir: "asc" | "desc" | null) => void
  onHide?: () => void
  onFilter?: () => void
  onManageColumns?: () => void
}) {
  const active = sort?.column === column.id
  const dir = active ? sort?.dir : null
  const SortIcon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown

  const sortable = column.sortable !== false
  const hideable = column.hideable !== false
  const filterable = column.filterable !== false && column.kind !== "custom"

  // Nothing to put in the menu? Render a plain label.
  const anyAction = sortable || hideable || filterable || !!onManageColumns
  if (!anyAction) {
    return (
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {column.header}
      </span>
    )
  }

  return (
    <div className="group/dt-head inline-flex items-center gap-1">
      {/* Clicking the label still toggles sort — the common case stays one click. */}
      <button
        type="button"
        onClick={() => sortable && onSort(dir === "asc" ? "desc" : dir === "desc" ? null : "asc")}
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide transition",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          !sortable && "cursor-default",
        )}
        aria-label={sortable ? `Sort by ${column.header}` : undefined}
      >
        {column.header}
        {sortable && <SortIcon className="h-3 w-3 opacity-70" />}
      </button>

      {/* 3-dot menu — appears on row hover or when the menu is open. */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-5 w-5 p-0 text-muted-foreground opacity-0 transition",
                "group-hover/dt-head:opacity-100 focus:opacity-100 data-[popup-open]:opacity-100",
                "hover:bg-muted hover:text-foreground",
              )}
              aria-label={`${column.header} column menu`}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-48">
          {sortable && (
            <>
              <DropdownMenuItem
                onClick={() => onSort(dir === "asc" ? null : "asc")}
                className={dir === "asc" ? "bg-accent text-accent-foreground" : undefined}
              >
                <ArrowUp className="h-3.5 w-3.5" /> Sort by ASC
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSort(dir === "desc" ? null : "desc")}
                className={dir === "desc" ? "bg-accent text-accent-foreground" : undefined}
              >
                <ArrowDown className="h-3.5 w-3.5" /> Sort by DESC
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Pin options are visual placeholders for now — hooked up when the
              DataTable gains column-pinning state (phase 2). */}
          <DropdownMenuItem disabled>
            <Pin className="h-3.5 w-3.5" /> Pin to left
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Pin className="h-3.5 w-3.5 rotate-45" /> Pin to right
          </DropdownMenuItem>

          {filterable && onFilter && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onFilter}>
                <FilterIcon className="h-3.5 w-3.5" /> Filter
              </DropdownMenuItem>
            </>
          )}

          {hideable && onHide && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onHide}>
                <EyeOff className="h-3.5 w-3.5" /> Hide column
              </DropdownMenuItem>
            </>
          )}

          {onManageColumns && (
            <DropdownMenuItem onClick={onManageColumns}>
              <Settings2 className="h-3.5 w-3.5" /> Manage columns
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
