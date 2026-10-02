import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/shared/lib/mongodb"
import User from "@/modules/users/models/User"
import { UsersView } from "@/modules/users/components/UsersView"

export default async function UsersPage() {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")
  await connectDB()
  const query = session.user.role === "super_admin" ? {} : { created_by: session.user.id, role: "agent" }
  const users = await User.find(query).select("-password").sort({ createdAt: -1 }).lean()
  return <UsersView users={JSON.parse(JSON.stringify(users))} role={session.user.role} />
}
