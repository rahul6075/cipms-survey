import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { FormBuilder } from "@/modules/survey/components/FormBuilder"

export default async function NewFormPage() {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")
  return <FormBuilder />
}
