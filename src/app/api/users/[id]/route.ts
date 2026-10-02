import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/shared/lib/auth"
import { connectDB } from "@/shared/lib/mongodb"
import User, { USER_STATUSES } from "@/modules/users/models/User"
import { computeProfile } from "@/modules/users/profileSchemas"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDB()
  const { id } = await params
  const user = await User.findById(id).select("-password").populate("created_by", "name email").lean()
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDB()
  const { id } = await params
  const body = await req.json()

  const update: Record<string, unknown> = {}
  for (const key of ["name", "is_active"]) if (key in body) update[key] = body[key]
  if ("status" in body && (USER_STATUSES as readonly string[]).includes(body.status)) {
    update.status = body.status
    update.is_active = body.status === "active"
  }

  if ("profile_data" in body) {
    const current = await User.findById(id).select("role profile_data").lean<{ role: string; profile_data?: Record<string, unknown> }>()
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const merged = { ...(current.profile_data || {}), ...(body.profile_data as Record<string, unknown>) }
    const prof = computeProfile(current.role, merged)
    update.profile_data = merged
    update.profile_complete = prof.complete
    update.profile_percent = prof.percent
  }

  const user = await User.findByIdAndUpdate(id, update, { new: true }).select("-password")
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(user)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDB()
  const { id } = await params
  const target = await User.findById(id).select("role")
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (target.role === "super_admin")
    return NextResponse.json({ error: "Super admin cannot be deleted" }, { status: 403 })
  await User.findByIdAndDelete(id)
  return NextResponse.json({ ok: true })
}
