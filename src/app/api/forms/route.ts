import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Form from "@/models/Form"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await connectDB()
  const query = session.user.role === "super_admin" ? {} : { created_by: session.user.id }
  const forms = await Form.find({ ...query, deleted_at: null }).sort({ createdAt: -1 }).populate("created_by", "name email")
  return NextResponse.json(forms)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDB()
  const { title, description, status, fields, require_consent } = await req.json()
  const form = await Form.create({ title, description, status, fields, require_consent: !!require_consent, created_by: session.user.id })
  return NextResponse.json(form, { status: 201 })
}
