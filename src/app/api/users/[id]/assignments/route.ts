import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/shared/lib/auth"
import { connectDB } from "@/shared/lib/mongodb"
import Assignment from "@/modules/survey/models/Assignment"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await connectDB()
  const { id } = await params
  const rows = await Assignment.find({ agent_id: id })
    .sort({ createdAt: -1 })
    .populate("form_id", "title status")
    .lean()

  return NextResponse.json(rows.map((a: Record<string, unknown>) => ({
    _id: String(a._id),
    token: a.token,
    status: a.status,
    total_submissions: a.total_submissions || 0,
    created_via: a.created_via || "manual",
    createdAt: a.createdAt,
    form: a.form_id
      ? { _id: String((a.form_id as { _id: unknown })._id), title: (a.form_id as { title: string }).title, status: (a.form_id as { status: string }).status }
      : null,
  })))
}
