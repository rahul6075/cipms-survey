import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/shared/lib/auth"
import { connectDB } from "@/shared/lib/mongodb"
import User, { USER_STATUSES } from "@/modules/users/models/User"
import { computeProfile } from "@/modules/users/profileSchemas"

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

  const q = (searchParams.get("q") || "").trim()
  const role = searchParams.get("role") || undefined
  const status = searchParams.get("status") || undefined
  const profile = searchParams.get("profile") || undefined // "complete" | "incomplete"
  const sortParam = searchParams.get("sort") || "-createdAt"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE))

  // Base scope: admins only see agents they created
  const scope: Record<string, unknown> =
    session.user.role === "admin"
      ? { created_by: session.user.id, role: "agent" }
      : {}

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
    User.aggregate([
      { $match: scope },
      {
        $facet: {
          total: [{ $count: "n" }],
          active: [{ $match: { is_active: true } }, { $count: "n" }],
          agents: [{ $match: { role: "agent" } }, { $count: "n" }],
          incomplete: [{ $match: { profile_complete: { $ne: true } } }, { $count: "n" }],
        },
      },
    ]),
  ])

  const c = counts[0] || {}
  const pick = (k: string) => (c[k]?.[0]?.n as number | undefined) || 0

  return NextResponse.json({
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    counts: {
      total: pick("total"),
      active: pick("active"),
      agents: pick("agents"),
      incompleteProfiles: pick("incomplete"),
    },
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
