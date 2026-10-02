import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { FormBuilderView } from "@/modules/survey/components/FormBuilderView"

export default async function NewFormPage() {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")
  return <FormBuilderView />
}
