import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Types } from "mongoose"
import { auth } from "@/shared/lib/auth"
import { connectDB } from "@/shared/lib/mongodb"
import User, { USER_STATUSES } from "@/modules/users/models/User"
import { computeProfile } from "@/modules/users/profileSchemas"
import { decodeState } from "@/shared/components/data-table/urlState"
import { stateToMongo, type ColumnMap } from "@/shared/components/data-table/mongoFilter"
import type { DataTableState } from "@/shared/components/data-table/types"

/**
 * Column whitelist for the DataTable filter model. Any column id not listed
 * here is silently dropped by stateToMongo, so clients can't filter on
 * arbitrary field paths.
 *
 * Note on status: new records are kept in sync with `is_active` via the User
 * pre-save hook. Legacy records that only have `is_active` won't match a
 * `status: "active"` filter — document that as a known migration gap and
 * surface a one-shot backfill in a later pass.
 */
const USERS_COLUMN_MAP: ColumnMap = {
  name:            { field: "name",            kind: "string" },
  email:           { field: "email",           kind: "string" },
  role:            { field: "role",            kind: "enum" },
  status:          { field: "status",          kind: "enum" },
  profile_percent: { field: "profile_percent", kind: "number", missingAs: 0 },
  createdAt:       { field: "createdAt",       kind: "date" },
  is_active:       { field: "is_active",       kind: "boolean" },
}

// Legacy records may lack `status`, so active/inactive must resolve via `is_active`
// (same semantics as the legacy ?status= path). invited/suspended stay on `status`.
function rewriteStatusFilters(state: DataTableState): DataTableState {
  return {
    ...state,
    filters: state.filters.map((f) => {
      if (f.column !== "status" || (f.op !== "is" && f.op !== "isNot")) return f
      if (f.value !== "active" && f.value !== "inactive") return f
      const wantActive = (f.value === "active") === (f.op === "is")
      return { ...f, column: "is_active", op: wantActive ? "isTrue" : "isFalse", value: undefined }
    }),
  }
}

/** KPI tile counts in one pass over the scope. */
async function userCounts(scope: Record<string, unknown>) {
  const [c] = await User.aggregate<{ total: number; active: number; agents: number; incompleteProfiles: number }>([
    { $match: scope },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$is_active", true] }, 1, 0] } },
        agents: { $sum: { $cond: [{ $eq: ["$role", "agent"] }, 1, 0] } },
        incompleteProfiles: { $sum: { $cond: [{ $ne: ["$profile_complete", true] }, 1, 0] } },
      },
    },
    { $project: { _id: 0 } },
  ])
  return c ?? { total: 0, active: 0, agents: 0, incompleteProfiles: 0 }
}

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

const SORTABLE: Record<string, string> = {
  name: "name",
  email: "email",
  role: "role",
  status: "status",
  createdAt: "createdAt",
  profile_percent: "profile_percent",
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await connectDB()
  const { searchParams } = new URL(req.url)

  // Base scope: admins only see agents they created. ObjectId (not string) because
  // aggregate() doesn't cast like find() does.
  const scope: Record<string, unknown> =
    session.user.role === "admin"
      ? { created_by: new Types.ObjectId(session.user.id), role: "agent" }
      : {}

  /* ─── New DataTable path (?dt=…) — takes precedence ──────────
   * Shares its translator with /api/responses + any future table.
   */
  const dt = searchParams.get("dt")
  if (dt !== null) {
    try {
      const state = rewriteStatusFilters(decodeState(dt))
      const { match, sort: dtSort, skip, limit } = stateToMongo(state, USERS_COLUMN_MAP, {
        base: scope,
        searchColumns: ["name", "email"],
        maxPageSize: MAX_PAGE_SIZE,
        defaultSort: { createdAt: -1 },
      })
      const [rows, total, counts] = await Promise.all([
        User.find(match)
          .select("-password")
          .populate("created_by", "name")
          .sort(dtSort)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(match),
        userCounts(scope),
      ])
      return NextResponse.json({
        rows, total, counts,
        page: state.page, pageSize: state.pageSize,
        pageCount: Math.max(1, Math.ceil(total / state.pageSize)),
      })
    } catch (e) {
      console.error("[/api/users dt] failed:", (e as Error).message)
      return NextResponse.json({ error: "dt_failed", detail: (e as Error).message }, { status: 500 })
    }
  }

  /* ─── Legacy path (back-compat) ─────────────────────────────── */
  const q = (searchParams.get("q") || "").trim()
  const role = searchParams.get("role") || undefined
  const status = searchParams.get("status") || undefined
  const profile = searchParams.get("profile") || undefined // "complete" | "incomplete"
  const sortParam = searchParams.get("sort") || "-createdAt"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE))

  const filter: Record<string, unknown> = { ...scope }
  if (role && role !== "all") filter.role = role
  if (status && status !== "all" && (USER_STATUSES as readonly string[]).includes(status)) {
    // Treat `is_active` as source of truth for active/inactive so legacy records
    // (no `status` field) are still filterable. invited/suspended are new-only.
    if (status === "active") filter.is_active = true
    else if (status === "inactive") filter.is_active = false
    else filter.status = status
  }
  if (profile === "complete") filter.profile_complete = true
  if (profile === "incomplete") filter.profile_complete = { $ne: true }

  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const rx = new RegExp(safe, "i")
    filter.$or = [{ name: rx }, { email: rx }]
  }

  const sortField = sortParam.replace(/^-/, "")
  const sortDir: 1 | -1 = sortParam.startsWith("-") ? -1 : 1
  const sort: Record<string, 1 | -1> = SORTABLE[sortField]
    ? { [SORTABLE[sortField]]: sortDir }
    : { createdAt: -1 }

  const [rows, total, counts] = await Promise.all([
    User.find(filter)
      .select("-password")
      .populate("created_by", "name")
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    User.countDocuments(filter),
    userCounts(scope),
  ])

  return NextResponse.json({
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    counts,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await connectDB()
  const body = await req.json()
  const { name, email, password, role, profile_data } = body

  if (!name || !email || !password || !role)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

  if (session.user.role === "admin" && role !== "agent")
    return NextResponse.json({ error: "Admins can only create agents" }, { status: 403 })

  const hashed = await bcrypt.hash(password, 10)
  const prof = computeProfile(role, profile_data)
  const user = await User.create({
    name,
    email,
    password: hashed,
    role,
    created_by: session.user.id,
    profile_data: profile_data || {},
    profile_complete: prof.complete,
    profile_percent: prof.percent,
  })

  const { password: _pw, ...safe } = user.toObject()
  return NextResponse.json(safe, { status: 201 })
}
