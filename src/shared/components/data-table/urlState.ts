/**
 * URL state codec — safe for both server and client. No React, no hooks, no
 * "use client" directive so API routes can import it.
 */
import { DEFAULT_STATE, type DataTableState } from "./types"

export function encodeState(state: DataTableState): string {
  const slim: Partial<DataTableState> = {}
  if (state.page !== 1) slim.page = state.page
  if (state.pageSize !== 25) slim.pageSize = state.pageSize
  if (state.sort) slim.sort = state.sort
  if (state.filters.length) slim.filters = state.filters
  if (state.logic !== "and") slim.logic = state.logic
  if (state.q) slim.q = state.q
  if (Object.keys(state.columnVisibility).length) slim.columnVisibility = state.columnVisibility
  if (state.columnOrder.length) slim.columnOrder = state.columnOrder

  const json = JSON.stringify(slim)
  if (json === "{}") return ""

  if (typeof TextEncoder !== "undefined" && typeof btoa === "function") {
    const bytes = new TextEncoder().encode(json)
    let s = ""
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  }
  return Buffer.from(json, "utf-8").toString("base64url")
}

export function decodeState(raw: string | null | undefined): DataTableState {
  if (!raw) return { ...DEFAULT_STATE }
  try {
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/")
    const padded = b64 + "===".slice((b64.length + 3) % 4)
    let json: string
    if (typeof atob === "function") {
      const bin = atob(padded)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      json = new TextDecoder().decode(bytes)
    } else {
      json = Buffer.from(padded, "base64").toString("utf-8")
    }
    return { ...DEFAULT_STATE, ...JSON.parse(json) }
  } catch {
    return { ...DEFAULT_STATE }
  }
}
