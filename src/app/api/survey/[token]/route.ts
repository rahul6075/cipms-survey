import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Assignment from "@/models/Assignment"
import Form from "@/models/Form"
import Response from "@/models/Response"

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  await connectDB()
  const { token } = await params
  const assignment = await Assignment.findOne({ token, status: "active" })
  if (!assignment) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
  const form = await Form.findById(assignment.form_id)
  if (!form || form.status === "closed" || form.deleted_at)
    return NextResponse.json({ error: "This survey has been closed." }, { status: 404 })
  return NextResponse.json({ form, assignment })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  await connectDB()
  const { token } = await params
  const assignment = await Assignment.findOne({ token, status: "active" })
  if (!assignment) return NextResponse.json({ error: "Invalid link" }, { status: 404 })
  const form = await Form.findById(assignment.form_id)
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 })
  const body = await req.json()
  const response = await Response.create({
    form_id: assignment.form_id,
    assignment_id: assignment._id,
    agent_id: assignment.agent_id,
    constituency: form.constituency,
    submitter_info: body.submitter_info || {},
    answers: body.answers || {},
    location: body.location,
    device: body.device || "mobile",
  })
  await Assignment.findByIdAndUpdate(assignment._id, { $inc: { total_submissions: 1 } })
  return NextResponse.json({ success: true, id: response._id }, { status: 201 })
}
