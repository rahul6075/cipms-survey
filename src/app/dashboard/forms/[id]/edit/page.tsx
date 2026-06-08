import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import Form from "@/models/Form"
import { FormBuilder } from "@/components/forms/FormBuilder"

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")
  await connectDB()
  const { id } = await params
  const form = await Form.findById(id).lean()
  if (!form) redirect("/dashboard/forms")
  return <FormBuilder initialData={JSON.parse(JSON.stringify(form))} />
}
