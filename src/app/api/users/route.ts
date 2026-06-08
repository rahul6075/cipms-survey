import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await connectDB()
  let query: any = {}
  if (session.user.role === "admin") query = { created_by: session.user.id, role: "agent" }
  const users = await User.find(query).select("-password").sort({ createdAt: -1 })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDB()
  const { name, email, password, role } = await req.json()
  if (session.user.role === "admin" && role !== "agent")
    return NextResponse.json({ error: "Admins can only create agents" }, { status: 403 })
  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, password: hashed, role, created_by: session.user.id })
  const { password: _, ...safe } = user.toObject()
  return NextResponse.json(safe, { status: 201 })
}
