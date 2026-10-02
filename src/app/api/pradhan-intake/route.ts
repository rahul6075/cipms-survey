import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { auth } from "@/shared/lib/auth"
import { connectDB } from "@/shared/lib/mongodb"
import User from "@/modules/users/models/User"
import Form from "@/modules/survey/models/Form"
import Assignment from "@/modules/survey/models/Assignment"
import { computeProfile } from "@/modules/users/profileSchemas"

type IntakeBody = {
  name?: string
  photo?: string
  mobile: string
  whatsapp?: string
  email?: string
  state?: string
  district?: string
  block?: string
  panchayat: string
  form_id: string
}

function makeToken() {
  return crypto.randomBytes(16).toString("base64url")
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await connectDB()
  const body = (await req.json()) as IntakeBody

  const errors: string[] = []
  if (!body.mobile?.trim()) errors.push("mobile is required")
  if (!body.panchayat?.trim()) errors.push("panchayat is required")
  if (!body.form_id) errors.push("form_id is required")
  if (errors.length) return NextResponse.json({ error: errors.join(", ") }, { status: 400 })

  const form = await Form.findById(body.form_id).select("title status deleted_at").lean<{
    _id: unknown; title: string; status: string; deleted_at: Date | null
  }>()
  if (!form || form.status === "closed" || form.deleted_at)
    return NextResponse.json({ error: "Selected form is not available" }, { status: 400 })

  // Normalise profile data
  const profile_data = {
    photo: body.photo || "",
    phone: body.mobile.trim(),
    whatsapp: (body.whatsapp || body.mobile).trim(),
    email: body.email?.trim() || "",
    panchayat: body.panchayat.trim(),
    block: body.block?.trim() || "",
    district: body.district?.trim() || "",
    state: body.state?.trim() || "",
  }

  // Dedupe by phone (profile_data.phone). Match any user with same phone AND role=agent.
  let user = await User.findOne({ role: "agent", "profile_data.phone": profile_data.phone })
  let reused = false

  if (user) {
    reused = true
    // Merge new values on top of existing, but prefer the new photo/panchayat if provided.
    const merged = { ...(user.profile_data || {}), ...profile_data }
    const prof = computeProfile("agent", merged)
    user.profile_data = merged
    user.profile_complete = prof.complete
    user.profile_percent = prof.percent
    if (body.name && !user.name) user.name = body.name
    await user.save()
  } else {
    // Create a lightweight Pradhan user. No password login — placeholder bcrypt hash.
    const placeholder = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10)
    const displayName = (body.name || body.panchayat).trim() + (body.name ? "" : " Pradhan")
    const prof = computeProfile("agent", profile_data)
    user = await User.create({
      name: displayName,
      // Synthesize an email if none given, so unique index is satisfied without
      // claiming a real address. Field agents can edit later.
      email: body.email?.trim()?.toLowerCase() || `pradhan-${profile_data.phone.replace(/\D/g, "")}@intake.local`,
      password: placeholder,
      role: "agent",
      status: "invited",
      is_active: true,
      created_by: session.user.id,
      profile_data,
      profile_complete: prof.complete,
      profile_percent: prof.percent,
    })
  }

  // Create a fresh assignment for this (user, form). Each intake generates a
  // new unique link even if the Pradhan already existed, so sessions stay
  // distinguishable in reports.
  const token = makeToken()
  const assignment = await Assignment.create({
    form_id: form._id,
    agent_id: user._id,
    token,
    village: profile_data.panchayat,
    status: "active",
    assigned_by: session.user.id,
    created_via: "intake",
    pradhan_snapshot: {
      name: user.name,
      photo: profile_data.photo,
      panchayat: profile_data.panchayat,
      block: profile_data.block,
      district: profile_data.district,
      state: profile_data.state,
      phone: profile_data.phone,
      whatsapp: profile_data.whatsapp,
      email: profile_data.email,
    },
  })

  // URL priority: an explicit env var (NEXT_PUBLIC_APP_URL) > Vercel's deploy
  // URL > the request's origin. The client rebuilds the URL from
  // window.location.origin as a final belt-and-braces check — see
  // PradhanIntakeView.
  const envOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
  const origin = envOrigin || req.headers.get("origin") || `${req.nextUrl.protocol}//${req.nextUrl.host}`
  const url = `${origin}/survey/${token}`

  return NextResponse.json({
    reused,
    user: { _id: user._id, name: user.name, email: user.email, profile_data: user.profile_data },
    assignment: { _id: assignment._id, token: assignment.token, form_id: assignment.form_id },
    form: { _id: form._id, title: form.title },
    url,
  }, { status: 201 })
}
