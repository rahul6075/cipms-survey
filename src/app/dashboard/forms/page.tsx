import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/shared/lib/mongodb"
import Form from "@/modules/survey/models/Form"
import { FormsList } from "@/modules/survey/components/FormsList"

export default async function FormsPage() {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")
  await connectDB()
  const query = session.user.role === "super_admin" ? {} : { created_by: session.user.id }
  const forms = await Form.find({ ...query, deleted_at: null }).sort({ createdAt: -1 }).populate("created_by", "name").lean()
  return <FormsList forms={JSON.parse(JSON.stringify(forms))} role={session.user.role} />
}
