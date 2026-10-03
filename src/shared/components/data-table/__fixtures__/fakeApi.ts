import type { DataTableState, FilterItem } from "../types"

/* Deterministic PRNG so stories are reproducible across refreshes. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type DemoPradhan = {
  _id: string
  name: string
  email: string
  phone: string
  role: "super_admin" | "admin" | "agent"
  status: "active" | "inactive" | "invited" | "suspended"
  profile_percent: number
  state: string
  district: string
  tags: string[]
  created_at: string   // ISO
  verified: boolean
  monthly_submissions: number
}

const STATES = ["Uttar Pradesh", "Bihar", "Madhya Pradesh", "Rajasthan", "Maharashtra"]
const DISTRICTS = ["Lucknow", "Barabanki", "Patna", "Gaya", "Bhopal", "Indore", "Jaipur", "Pune", "Nagpur"]
const FIRST = ["Ramesh", "Suresh", "Mahesh", "Dinesh", "Ganesh", "Kailash", "Prakash", "Rakesh", "Mukesh", "Umesh"]
const LAST = ["Kumar", "Yadav", "Singh", "Pandey", "Chaudhary", "Shukla", "Mishra", "Tiwari", "Verma", "Gupta"]
const TAGS = ["high-engagement", "needs-training", "data-steward", "key-contact", "pilot", "prefers-whatsapp"]

export function makeDemoRows(count = 1000, seed = 42): DemoPradhan[] {
  const rand = mulberry32(seed)
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[Math.floor(rand() * FIRST.length)]
    const last = LAST[Math.floor(rand() * LAST.length)]
    const roleRoll = rand()
    const role: DemoPradhan["role"] = roleRoll < 0.03 ? "super_admin" : roleRoll < 0.15 ? "admin" : "agent"
    const statusRoll = rand()
    const status: DemoPradhan["status"] =
      statusRoll < 0.72 ? "active" : statusRoll < 0.86 ? "invited" : statusRoll < 0.95 ? "inactive" : "suspended"
    const tagCount = Math.floor(rand() * 3)
    const tagsPool = [...TAGS].sort(() => rand() - 0.5)
    const tags = tagsPool.slice(0, tagCount)
    return {
      _id: `u-${i + 1}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.in`,
      phone: `+91 9${Math.floor(rand() * 100000000).toString().padStart(8, "0")}`,
      role,
      status,
      profile_percent: Math.min(100, Math.floor(rand() * 110)),
      state: STATES[Math.floor(rand() * STATES.length)],
      district: DISTRICTS[Math.floor(rand() * DISTRICTS.length)],
      tags,
      created_at: new Date(now - Math.floor(rand() * 365 * 86400_000)).toISOString(),
      verified: rand() > 0.4,
      monthly_submissions: Math.floor(rand() * 240),
    }
  })
}

/* ─── mock server-side query (applies filters, sort, paginates) ─── */

function readValue(row: DemoPradhan, column: string): unknown {
  return (row as unknown as Record<string, unknown>)[column]
}

function match(row: DemoPradhan, f: FilterItem): boolean {
  const v = readValue(row, f.column)

  if (f.op === "isEmpty")    return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)
  if (f.op === "isNotEmpty") return !(v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))
  if (f.op === "isTrue")     return v === true
  if (f.op === "isFalse")    return v === false

  const s = String(v ?? "").toLowerCase()
  const needle = String(f.value ?? "").toLowerCase()

  switch (f.op) {
    case "contains":    return s.includes(needle)
    case "equals":      return s === needle
    case "startsWith":  return s.startsWith(needle)
    case "endsWith":    return s.endsWith(needle)
    case "isAnyOf": {
      const list = Array.isArray(f.value) ? f.value.map(String) : String(f.value || "").split(",").map((x) => x.trim())
      return list.length > 0 && list.includes(String(v))
    }
    case "eq":          return Number(v) === Number(f.value)
    case "ne":          return Number(v) !== Number(f.value)
    case "gt":          return Number(v) > Number(f.value)
    case "gte":         return Number(v) >= Number(f.value)
    case "lt":          return Number(v) < Number(f.value)
    case "lte":         return Number(v) <= Number(f.value)
    case "between": {
      const a = Number(f.value); const b = Number(f.value2)
      const n = Number(v)
      return n >= Math.min(a, b) && n <= Math.max(a, b)
    }
    case "is":          return String(v) === String(f.value)
    case "isNot":       return String(v) !== String(f.value)
    case "includes":    return Array.isArray(v) && v.includes(f.value)
    case "includesAnyOf": {
      const list = Array.isArray(f.value) ? f.value : [f.value]
      return Array.isArray(v) && list.some((x) => v.includes(x))
    }
    case "includesAllOf": {
      const list = Array.isArray(f.value) ? f.value : [f.value]
      return Array.isArray(v) && list.every((x) => v.includes(x))
    }
    default: return true
  }
}

export function queryDemo(
  all: DemoPradhan[],
  state: DataTableState,
  opts?: { searchColumns?: Array<keyof DemoPradhan> },
): { rows: DemoPradhan[]; total: number } {
  let rows = all

  // Global search
  if (state.q && opts?.searchColumns) {
    const needle = state.q.toLowerCase()
    rows = rows.filter((r) =>
      opts.searchColumns!.some((k) => String(r[k] ?? "").toLowerCase().includes(needle)),
    )
  }

  // Filters
  if (state.filters.length > 0) {
    const logic = state.logic || "and"
    rows = rows.filter((r) => logic === "and" ? state.filters.every((f) => match(r, f)) : state.filters.some((f) => match(r, f)))
  }

  // Sort
  if (state.sort) {
    const col = state.sort.column
    const dir = state.sort.dir === "asc" ? 1 : -1
    rows = [...rows].sort((a, b) => {
      const av = readValue(a, col) as string | number
      const bv = readValue(b, col) as string | number
      if (av == null) return 1
      if (bv == null) return -1
      return av > bv ? dir : av < bv ? -dir : 0
    })
  }

  const total = rows.length
  const start = (state.page - 1) * state.pageSize
  return { rows: rows.slice(start, start + state.pageSize), total }
}
