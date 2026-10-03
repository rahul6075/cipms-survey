import { NextRequest, NextResponse } from "next/server"
import { Types } from "mongoose"
import { auth } from "@/shared/lib/auth"
import { connectDB } from "@/shared/lib/mongodb"
import Form from "@/modules/survey/models/Form"
import Response from "@/modules/survey/models/Response"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await connectDB()
  const { id } = await params
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const r = await Response.findById(id)
    .populate("agent_id", "name email profile_data")
    .populate("assignment_id", "token pradhan_snapshot form_id")
    .lean<{
      _id: unknown; form_id: unknown; submitted_at: Date; device?: string;
      answers?: Record<string, unknown>; location?: Record<string, number> | null;
      agent_id?: Record<string, unknown> | null;
      assignment_id?: Record<string, unknown> | null;
    }>()
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Verify access to the form the response belongs to.
  const form = await Form.findById(r.form_id).select("created_by title fields").lean<{
    created_by: unknown; title: string; fields: Array<Record<string, unknown>>
  }>()
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 })
  if (session.user.role !== "super_admin" && String(form.created_by) !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  return NextResponse.json({
    _id: String(r._id),
    submitted_at: r.submitted_at,
    device: r.device,
    answers: r.answers || {},
    location: r.location || null,
    agent: r.agent_id || null,
    assignment: r.assignment_id || null,
    form: { title: form.title, fields: form.fields },
  })
}
