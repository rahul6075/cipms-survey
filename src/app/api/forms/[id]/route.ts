import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Form from "@/models/Form"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await connectDB()
  const { id } = await params
  const form = await Form.findById(id).populate("created_by", "name email")
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(form)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDB()
  const { id } = await params
  const body = await req.json()
  const existing = await Form.findById(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (session.user.role !== "super_admin" && existing.created_by.toString() !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { title, description, status, fields, require_consent } = body
  const updated = await Form.findByIdAndUpdate(
    id,
    { $set: { title, description, status, fields, require_consent: !!require_consent } },
    { new: true, runValidators: false }
  )
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDB()
  const { id } = await params
  const form = await Form.findById(id)
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (session.user.role !== "super_admin" && form.created_by.toString() !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  // Soft delete — stamp deleted_at, close the form so public links show "closed"
  await Form.findByIdAndUpdate(id, { deleted_at: new Date(), status: "closed" })
  return NextResponse.json({ ok: true })
}
