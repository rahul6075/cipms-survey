import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"

export async function GET() {
  try {
    await connectDB()
    const mongoose = (await import("mongoose")).default
    const UserSchema = new mongoose.Schema({ name: String, email: String, role: String, is_active: Boolean }, { strict: false })
    const User = mongoose.models.User || mongoose.model("User", UserSchema)
    const user = await User.findOne({ email: "admin@cipms.in" }).select("name email role is_active")
    return NextResponse.json({ connected: true, user })
  } catch (e: any) {
    return NextResponse.json({ connected: false, error: e.message }, { status: 500 })
  }
}
