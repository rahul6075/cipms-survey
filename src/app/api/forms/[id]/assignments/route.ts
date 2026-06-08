import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Assignment from "@/models/Assignment"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await connectDB()
  const { id } = await params
  const assignments = await Assignment.find({ form_id: id })
    .populate("agent_id", "name email")
    .sort({ createdAt: -1 })
  return NextResponse.json(assignments)
}
