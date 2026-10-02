import { NextResponse } from "next/server"
import { connectDB } from "@/shared/lib/mongodb"
import Constituency from "@/shared/models/Constituency"

export async function GET() {
  await connectDB()
  const data = await Constituency.find({}).sort({ lok_sabha_no: 1 })
  return NextResponse.json(data)
}
