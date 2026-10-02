import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/shared/lib/mongodb"
import ResponseModel from "@/modules/survey/models/Response"
import Form from "@/modules/survey/models/Form"
import { ResponsesView } from "@/modules/survey/components/ResponsesView"

export default async function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")
  await connectDB()
  const { id } = await params
  const form = await Form.findById(id).lean()
  if (!form) redirect("/dashboard/forms")

  let data: any
  if (session.user.role === "super_admin") {
    const responses = await ResponseModel.find({ form_id: id })
      .populate("agent_id", "name email").sort({ submitted_at: -1 }).lean()
    data = { responses: JSON.parse(JSON.stringify(responses)), restricted: false }
  } else {
    const total = await ResponseModel.countDocuments({ form_id: id })
    data = { total, restricted: true }
  }

  return <ResponsesView form={JSON.parse(JSON.stringify(form))} data={data} role={session.user.role} />
}
