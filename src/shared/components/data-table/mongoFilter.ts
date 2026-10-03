/**
 * Shared translator: DataTableState → Mongo filter + sort + skip/limit.
 * Imported server-side only. Uses a whitelisted ColumnMap so clients can't
 * filter on arbitrary field paths.
 */
import type { DataTableState, FilterItem, Op } from "./types"

export type ColumnMapEntry = {
  field?: string
  kind: "string" | "number" | "date" | "boolean" | "enum" | "arrayEnum"
  transform?: (v: unknown) => unknown
  /** Value assumed for documents where the field is missing/null (legacy records). */
  missingAs?: unknown
}
export type ColumnMap = Record<string, ColumnMapEntry>

type Clause = Record<string, unknown>

function esc(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") }

function coerce(entry: ColumnMapEntry, v: unknown): unknown {
  if (entry.transform) {
    const t = entry.transform(v)
    if (t === null) return undefined
    v = t
  }
  if (v === null || v === undefined || v === "") return undefined
  switch (entry.kind) {
    case "number": {
      const n = typeof v === "number" ? v : Number(v)
      return Number.isFinite(n) ? n : undefined
    }
    case "date":    return v instanceof Date ? v : new Date(String(v))
    case "boolean": return v === true || v === "true"
    default: return v
  }
}

function coerceList(entry: ColumnMapEntry, v: unknown): unknown[] {
  if (Array.isArray(v)) return v.map((x) => coerce(entry, x)).filter((x) => x !== undefined)
  if (typeof v === "string") {
    return v.split(",").map((s) => coerce(entry, s.trim())).filter((x) => x !== undefined)
  }
  const c = coerce(entry, v)
  return c === undefined ? [] : [c]
}

function comparesTrue(op: Op, d: unknown, value: unknown, value2: unknown): boolean {
  const n = d as number, v = value as number, v2 = value2 as number
  switch (op) {
    case "eq": case "equals": case "is": return d === value
    case "ne": case "isNot": return d !== value
    case "gt": return n > v
    case "gte": return n >= v
    case "lt": return n < v
    case "lte": return n <= v
    case "between": return n >= v && n <= v2
    default: return false
  }
}

export function filterItemToClause(item: FilterItem, columnMap: ColumnMap): Clause | null {
  const clause = rawClause(item, columnMap)
  const entry = columnMap[item.column]
  if (!clause || !entry || entry.missingAs === undefined) return clause
  const value = coerce(entry, item.value)
  const value2 = item.value2 !== undefined ? coerce(entry, item.value2) : undefined
  if (!comparesTrue(item.op, entry.missingAs, value, value2)) return clause
  const field = entry.field || item.column
  return { $or: [clause, { [field]: { $exists: false } }, { [field]: null }] }
}

function rawClause(item: FilterItem, columnMap: ColumnMap): Clause | null {
  const entry = columnMap[item.column]
  if (!entry) return null
  const field = entry.field || item.column
  const op: Op = item.op

  if (op === "isEmpty")    return { $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: "" }] }
  if (op === "isNotEmpty") return { [field]: { $exists: true, $nin: [null, ""] } }
  if (op === "isTrue")     return { [field]: true }
  if (op === "isFalse")    return { [field]: false }

  const value = coerce(entry, item.value)
  const value2 = item.value2 !== undefined ? coerce(entry, item.value2) : undefined

  if (value === undefined && !["isAnyOf", "includesAnyOf", "includesAllOf"].includes(op)) return null

  switch (op) {
    case "contains":    return { [field]: { $regex: esc(String(value)), $options: "i" } }
    case "equals":
    case "eq":
    case "is":          return { [field]: value }
    case "ne":
    case "isNot":       return { [field]: { $ne: value } }
    case "startsWith":  return { [field]: { $regex: `^${esc(String(value))}`, $options: "i" } }
    case "endsWith":    return { [field]: { $regex: `${esc(String(value))}$`, $options: "i" } }
    case "gt":          return { [field]: { $gt: value } }
    case "gte":         return { [field]: { $gte: value } }
    case "lt":          return { [field]: { $lt: value } }
    case "lte":         return { [field]: { $lte: value } }
    case "between": {
      if (value === undefined || value2 === undefined) return null
      return { [field]: { $gte: value, $lte: value2 } }
    }
    case "isAnyOf": {
      const list = coerceList(entry, item.value)
      if (!list.length) return null
      return { [field]: { $in: list } }
    }
    case "includes":        return { [field]: value }
    case "includesAnyOf": {
      const list = coerceList(entry, item.value)
      if (!list.length) return null
      return { [field]: { $in: list } }
    }
    case "includesAllOf": {
      const list = coerceList(entry, item.value)
      if (!list.length) return null
      return { [field]: { $all: list } }
    }
    default: return null
  }
}

export function stateToMongo(
  state: Partial<DataTableState>,
  columnMap: ColumnMap,
  opts?: {
    base?: Clause
    searchColumns?: string[]
    maxPageSize?: number
    defaultSort?: Record<string, 1 | -1>
  },
): { match: Clause; sort: Record<string, 1 | -1>; skip: number; limit: number } {
  const items = (state.filters || [])
    .map((f) => filterItemToClause(f, columnMap))
    .filter((c): c is Clause => !!c)

  const logic = state.logic === "or" ? "$or" : "$and"
  const filterClause: Clause | null = items.length > 0 ? { [logic]: items } : null

  const q = (state.q || "").trim()
  let qClause: Clause | null = null
  if (q && opts?.searchColumns?.length) {
    const safe = esc(q)
    qClause = { $or: opts.searchColumns.map((c) => ({ [c]: { $regex: safe, $options: "i" } })) }
  }

  const combined: Clause[] = []
  if (opts?.base) combined.push(opts.base)
  if (filterClause) combined.push(filterClause)
  if (qClause) combined.push(qClause)
  const match: Clause = combined.length === 0 ? {} : combined.length === 1 ? combined[0] : { $and: combined }

  const sort = state.sort
    ? { [columnMap[state.sort.column]?.field || state.sort.column]: (state.sort.dir === "asc" ? 1 : -1) as 1 | -1 }
    : (opts?.defaultSort || { _id: -1 as const })

  const page = Math.max(1, state.page || 1)
  const pageSize = Math.min(opts?.maxPageSize || 100, Math.max(1, state.pageSize || 25))
  return { match, sort, skip: (page - 1) * pageSize, limit: pageSize }
}
