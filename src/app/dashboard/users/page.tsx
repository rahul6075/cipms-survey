import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { UsersViewNew, type Role } from "@/modules/users/components/UsersViewNew"

export default async function UsersPage() {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")
  return <UsersViewNew sessionRole={session.user.role as Role} />
}
