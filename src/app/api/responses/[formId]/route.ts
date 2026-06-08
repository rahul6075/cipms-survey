import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Response from "@/models/Response"
import mongoose from "mongoose"

export async function GET(req: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await connectDB()
  const { formId } = await params
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"))
  const skip = (page - 1) * limit

  if (session.user.role === "super_admin") {
    const [responses, total] = await Promise.all([
      Response.find({ form_id: formId })
        .populate("agent_id", "name email")
        .sort({ submitted_at: -1 })
        .skip(skip)
        .limit(limit),
      Response.countDocuments({ form_id: formId }),
    ])
    return NextResponse.json({ responses, total, page, pages: Math.ceil(total / limit) })
  }

  // Admin sees summary only — no raw response data
  const formObjectId = new mongoose.Types.ObjectId(formId)
  const [total, byAgent] = await Promise.all([
    Response.countDocuments({ form_id: formId }),
    Response.aggregate([
      { $match: { form_id: formObjectId } },
      { $group: { _id: "$agent_id", count: { $sum: 1 }, last: { $max: "$submitted_at" } } },
      { $sort: { count: -1 } },
    ]),
  ])
  return NextResponse.json({ total, byAgent, restricted: true })
}
