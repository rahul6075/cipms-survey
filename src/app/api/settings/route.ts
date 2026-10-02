import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/shared/lib/auth"
import { connectDB } from "@/shared/lib/mongodb"
import Settings from "@/shared/models/Settings"
import Form from "@/modules/survey/models/Form"

async function getOrCreate() {
  let doc = await Settings.findOne({ key: "global" })
  if (!doc) doc = await Settings.create({ key: "global" })
  return doc
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await connectDB()
  const doc = await getOrCreate()
  // Also return the resolved form for convenience (title + id).
  let defaultIntakeForm: { _id: string; title: string } | null = null
  if (doc.default_intake_form_id) {
    const f = await Form.findById(doc.default_intake_form_id).select("title status deleted_at").lean<{ _id: unknown; title: string; status: string; deleted_at: Date | null }>()
    if (f && f.status !== "closed" && !f.deleted_at) {
      defaultIntakeForm = { _id: String(f._id), title: f.title }
    }
  }
  return NextResponse.json({
    default_intake_form_id: doc.default_intake_form_id ? String(doc.default_intake_form_id) : null,
    default_intake_form: defaultIntakeForm,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDB()
  const body = await req.json()
  const update: Record<string, unknown> = {}
  if ("default_intake_form_id" in body) {
    update.default_intake_form_id = body.default_intake_form_id || null
  }
  const doc = await Settings.findOneAndUpdate({ key: "global" }, update, { new: true, upsert: true })
  return NextResponse.json(doc)
}
