import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Assignment from "@/models/Assignment"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDB()
  const { id } = await params
  const { agents } = await req.json() // [{ agent_id, village }]
  const assignments = await Promise.all(
    agents.map((a: { agent_id: string; village?: string }) =>
      Assignment.create({
        form_id: id,
        agent_id: a.agent_id,
        village: a.village || "",
        token: randomUUID(),
        assigned_by: session.user.id,
      })
    )
  )
  return NextResponse.json(assignments, { status: 201 })
}
