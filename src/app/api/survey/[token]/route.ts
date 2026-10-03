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

type AssignmentLite = {
  _id: unknown
  form_id: unknown
  agent_id?: unknown
  pradhan_snapshot?: PradhanInfo
}
type PublicForm = {
  _id: unknown
  title: string
  description?: string
  status: string
  fields?: FieldLite[]
  require_consent?: boolean
  deleted_at?: Date | null
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  await connectDB()
  const { token } = await params
  const assignment = await Assignment.findOne({ token, status: "active" })
    .select("form_id agent_id pradhan_snapshot")
    .lean<AssignmentLite>()
  if (!assignment) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })

  // Public endpoint: only the fields the survey page renders.
  const [formDoc, u] = await Promise.all([
    Form.findById(assignment.form_id)
      .select("title description status fields require_consent deleted_at")
      .lean<PublicForm>(),
    assignment.agent_id
      ? User.findById(assignment.agent_id).select("name profile_data").lean<{
          name: string; profile_data?: Record<string, unknown>
        }>()
      : null,
  ])
  if (!formDoc || formDoc.status === "closed" || formDoc.deleted_at)
    return NextResponse.json({ error: "This survey has been closed." }, { status: 404 })
  const form = { ...formDoc, deleted_at: undefined }

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
    for (const f of form.fields || []) {
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

  return NextResponse.json({ form, pradhan, prefill })
}

// Stray spaces from mobile keyboards would otherwise split report groups ("थरौली" vs "थरौली ").
function trimAnswers(answers: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(answers)) {
    out[k] = typeof v === "string" ? v.trim()
      : Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x.trim() : x))
      : v
  }
  return out
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  await connectDB()
  const { token } = await params
  const assignment = await Assignment.findOne({ token, status: "active" })
    .select("form_id agent_id")
    .lean<AssignmentLite>()
  if (!assignment) return NextResponse.json({ error: "Invalid link" }, { status: 404 })
  const [form, body] = await Promise.all([
    Form.findById(assignment.form_id).select("constituency").lean<{ constituency?: unknown }>(),
    req.json(),
  ])
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 })
  const [response] = await Promise.all([
    Response.create({
      form_id: assignment.form_id,
      assignment_id: assignment._id,
      agent_id: assignment.agent_id,
      constituency: form.constituency,
      submitter_info: body.submitter_info || {},
      answers: trimAnswers(body.answers || {}),
      location: body.location,
      device: body.device || "mobile",
    }),
    Assignment.updateOne({ _id: assignment._id }, { $inc: { total_submissions: 1 } }),
  ])
  return NextResponse.json({ success: true, id: response._id }, { status: 201 })
}
