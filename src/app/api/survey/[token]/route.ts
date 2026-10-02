import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/shared/lib/mongodb"
import Assignment from "@/modules/survey/models/Assignment"
import Form from "@/modules/survey/models/Form"
import Response from "@/modules/survey/models/Response"
import User from "@/modules/users/models/User"

type PradhanInfo = {
  name?: string
  photo?: string
  panchayat?: string
  block?: string
  district?: string
  state?: string
  phone?: string
  whatsapp?: string
  email?: string
}

type FieldLite = { id?: string; prefill_from?: string }

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  await connectDB()
  const { token } = await params
  const assignment = await Assignment.findOne({ token, status: "active" })
  if (!assignment) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })

  const form = await Form.findById(assignment.form_id)
  if (!form || form.status === "closed" || form.deleted_at)
    return NextResponse.json({ error: "This survey has been closed." }, { status: 404 })

  // Build a lightweight Pradhan view. The intake snapshot keeps names and
  // location stable even if the user is later edited, but photos legitimately
  // change (Pradhan uploads one later from the Users drawer, re-shoots a bad
  // crop, etc.) — so overlay the live user record for fields the snapshot is
  // missing or empty for.
  let pradhan: PradhanInfo | null = null
  const snap = (assignment.pradhan_snapshot && Object.keys(assignment.pradhan_snapshot).length > 0)
    ? (assignment.pradhan_snapshot as PradhanInfo)
    : null

  let live: PradhanInfo | null = null
  if (assignment.agent_id) {
    const u = await User.findById(assignment.agent_id).select("name profile_data").lean<{
      name: string; profile_data?: Record<string, unknown>
    }>()
    if (u) {
      const p = (u.profile_data || {}) as Record<string, string | undefined>
      live = {
        name: u.name,
        photo: p.photo,
        panchayat: p.panchayat,
        block: p.block,
        district: p.district,
        state: p.state,
        phone: p.phone,
        whatsapp: p.whatsapp,
        email: p.email,
      }
    }
  }

  if (snap || live) {
    const pick = (k: keyof PradhanInfo) => {
      const s = snap?.[k]
      if (s !== undefined && s !== null && String(s).trim() !== "") return s
      return live?.[k]
    }
    pradhan = {
      name: pick("name"),
      photo: pick("photo"),
      panchayat: pick("panchayat"),
      block: pick("block"),
      district: pick("district"),
      state: pick("state"),
      phone: pick("phone"),
      whatsapp: pick("whatsapp"),
      email: pick("email"),
    }
  }

  // Compute prefill map: field.id → { value, locked }
  const prefill: Record<string, { value: unknown; locked: boolean; source: string }> = {}
  if (pradhan) {
    for (const f of (form.fields as FieldLite[]) || []) {
      if (!f.id || !f.prefill_from) continue
      // Only pradhan.* keys supported today.
      if (!f.prefill_from.startsWith("pradhan.")) continue
      const key = f.prefill_from.slice("pradhan.".length) as keyof PradhanInfo
      const v = pradhan[key]
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        prefill[f.id] = { value: v, locked: true, source: f.prefill_from }
      }
    }
  }

  return NextResponse.json({ form, assignment, pradhan, prefill })
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
