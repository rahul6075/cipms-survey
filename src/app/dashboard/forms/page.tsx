import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { FormsView, type Role } from "@/modules/survey/components/FormsView"

export default async function FormsPage() {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")
  return <FormsView sessionRole={session.user.role as Role} />
}
