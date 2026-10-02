import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/shared/lib/mongodb"
import Form from "@/modules/survey/models/Form"
import { ReportsWorkbench, type ReportForm } from "@/modules/survey/reports/ReportsWorkbench"

export default async function ReportsPage() {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")

  await connectDB()
  const query = session.user.role === "super_admin"
    ? { deleted_at: null }
    : { deleted_at: null, created_by: session.user.id }

  const forms = await Form.find(query)
    .select("title status")
    .sort({ updatedAt: -1 })
    .lean<Array<{ _id: unknown; title: string; status: string }>>()

  const initialForms: ReportForm[] = forms.map((f) => ({
    _id: String(f._id),
    title: f.title,
    status: f.status,
  }))

  return <ReportsWorkbench initialForms={initialForms} />
}
