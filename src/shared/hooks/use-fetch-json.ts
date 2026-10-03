"use client"
import { useCallback, useEffect, useState } from "react"

type Settled<T> = { key: string; data?: T; error?: string }

/**
 * Fetches JSON for `url` (null = skip); passing `body` sends a JSON POST.
 * Aborts superseded requests and keeps the previous data while the next one is
 * in flight (`stale` = true), so tables don't flicker between pages.
 */
export function useFetchJson<T>(url: string | null, body?: unknown) {
  const [nonce, setNonce] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const bodyJson = body === undefined ? undefined : JSON.stringify(body)
  const key = url === null ? null : `${nonce}|${url}|${bodyJson ?? ""}`

  useEffect(() => {
    if (url === null || key === null) return
    const ctrl = new AbortController()
    const init: RequestInit = bodyJson === undefined
      ? { signal: ctrl.signal }
      : { signal: ctrl.signal, method: "POST", headers: { "Content-Type": "application/json" }, body: bodyJson }
    fetch(url, init)
      .then(async (r) => {
        if (r.ok) return r.json() as Promise<T>
        const err = await r.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || `Request failed (${r.status})`)
      })
      .then((data) => setSettled({ key, data }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setSettled((prev) => ({ key, data: prev?.data, error: e.message }))
      })
    return () => ctrl.abort()
  }, [url, bodyJson, key])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  const current = key !== null && settled?.key === key

  return {
    data: settled?.data,
    error: current ? settled?.error ?? null : null,
    loading: key !== null && !current,
    stale: !current,
    reload,
  }
}
