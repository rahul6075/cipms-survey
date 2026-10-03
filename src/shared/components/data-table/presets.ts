/**
 * Filter presets — tiny localStorage CRUD, scoped per table (`scope`).
 *
 * Phase 1 is intentionally client-only so there's no backend coupling. When
 * we later want presets to sync across devices/users, swap this file's four
 * exports for an API-backed implementation — the dialog + hook signatures
 * stay the same.
 */
import type { FilterItem } from "./types"

export type FilterPreset = {
  id: string
  name: string
  state: { filters: FilterItem[]; logic: "and" | "or" }
  createdAt: number
  updatedAt: number
}

function key(scope: string) {
  return `cipms_filter_presets_${scope}`
}

function safeRead(scope: string): FilterPreset[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(key(scope))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as FilterPreset[]) : []
  } catch {
    return []
  }
}

function safeWrite(scope: string, list: FilterPreset[]) {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(key(scope), JSON.stringify(list)) } catch { /* ignore quota */ }
}

export function listPresets(scope: string): FilterPreset[] {
  return safeRead(scope).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function savePreset(scope: string, input: { name: string; state: FilterPreset["state"] }): FilterPreset {
  const now = Date.now()
  const preset: FilterPreset = {
    id: `p-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim() || "Untitled preset",
    state: input.state,
    createdAt: now,
    updatedAt: now,
  }
  const next = [preset, ...safeRead(scope)]
  safeWrite(scope, next)
  return preset
}

export function updatePreset(
  scope: string,
  id: string,
  patch: Partial<Pick<FilterPreset, "name" | "state">>,
): FilterPreset | null {
  const list = safeRead(scope)
  const idx = list.findIndex((p) => p.id === id)
  if (idx < 0) return null
  const next: FilterPreset = { ...list[idx], ...patch, updatedAt: Date.now() }
  list[idx] = next
  safeWrite(scope, list)
  return next
}

export function deletePreset(scope: string, id: string) {
  const next = safeRead(scope).filter((p) => p.id !== id)
  safeWrite(scope, next)
}

/** Shallow equality — tells the dialog whether the current state matches a loaded preset. */
export function statesEqual(a: FilterPreset["state"], b: FilterPreset["state"]) {
  if (a.logic !== b.logic) return false
  if (a.filters.length !== b.filters.length) return false
  for (let i = 0; i < a.filters.length; i++) {
    const f = a.filters[i], g = b.filters[i]
    if (f.column !== g.column || f.op !== g.op) return false
    if (JSON.stringify(f.value ?? null) !== JSON.stringify(g.value ?? null)) return false
    if (JSON.stringify(f.value2 ?? null) !== JSON.stringify(g.value2 ?? null)) return false
  }
  return true
}
