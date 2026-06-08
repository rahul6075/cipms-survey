import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDB()
  const { id } = await params
  const body = await req.json()
  const allowed = ["is_active", "name"]
  const update: Record<string, any> = {}
  for (const key of allowed) if (key in body) update[key] = body[key]
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
