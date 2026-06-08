import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Constituency from "@/models/Constituency"

export async function GET() {
  await connectDB()
  const data = await Constituency.find({}).sort({ lok_sabha_no: 1 })
  return NextResponse.json(data)
}
