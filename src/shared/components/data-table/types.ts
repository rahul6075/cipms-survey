import * as React from "react"

export type ColumnKind =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "enum"
  | "arrayEnum"
  | "custom"

export type Op =
  // text
  | "contains" | "equals" | "startsWith" | "endsWith" | "isAnyOf"
  // numeric / date
  | "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "between"
  // common
  | "isEmpty" | "isNotEmpty"
  // enum / array
  | "is" | "isNot" | "includes" | "includesAnyOf" | "includesAllOf"
  // boolean
  | "isTrue" | "isFalse"

export type FilterItem = {
  id: string
  column: string
  op: Op
  value?: unknown
  value2?: unknown
}

export type SortState = { column: string; dir: "asc" | "desc" } | null

export type DataTableState = {
  page: number
  pageSize: number
  sort: SortState
  filters: FilterItem[]
  logic: "and" | "or"
  q?: string
  columnVisibility: Record<string, boolean>  // true = user explicitly hid; false = user explicitly showed; absent = defaultHidden rules
  columnOrder: string[]
}

export const DEFAULT_STATE: DataTableState = {
  page: 1,
  pageSize: 25,
  sort: null,
  filters: [],
  logic: "and",
  q: "",
  columnVisibility: {},
  columnOrder: [],
}

export type DataTableColumn<Row> = {
  id: string
  header: string
  accessor?: (row: Row) => unknown
  cell?: (row: Row) => React.ReactNode
  kind: ColumnKind
  enumOptions?: Array<{ value: string; label: string }>
  sortable?: boolean
  filterable?: boolean
  hideable?: boolean
  defaultHidden?: boolean
  width?: number | string
  align?: "left" | "right" | "center"
  field?: string
  searchable?: boolean
}
