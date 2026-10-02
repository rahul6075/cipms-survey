import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/shared/lib/mongodb"
import Form from "@/modules/survey/models/Form"
import { FormBuilderView } from "@/modules/survey/components/FormBuilderView"

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")
  await connectDB()
  const { id } = await params
  const form = await Form.findById(id).lean()
  if (!form) redirect("/dashboard/forms")
  return <FormBuilderView initialData={JSON.parse(JSON.stringify(form))} />
}
