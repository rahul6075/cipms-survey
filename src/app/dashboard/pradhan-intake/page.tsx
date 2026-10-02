import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { PradhanIntakeView } from "@/modules/survey/components/PradhanIntakeView"

export default async function PradhanIntakePage() {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")
  return <PradhanIntakeView sessionRole={session.user.role as "super_admin" | "admin"} />
}
