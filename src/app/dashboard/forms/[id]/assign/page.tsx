import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/shared/lib/mongodb"
import Form from "@/modules/survey/models/Form"
import User from "@/modules/users/models/User"
import Assignment from "@/modules/survey/models/Assignment"
import { AssignForm } from "@/modules/survey/components/AssignForm"

export default async function AssignPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "agent") redirect("/dashboard")
  await connectDB()
  const { id } = await params
  const [form, agents, assignments] = await Promise.all([
    Form.findById(id).lean(),
    User.find({ role: "agent" }).select("name email").lean(),
    Assignment.find({ form_id: id }).populate("agent_id", "name email").lean(),
  ])
  if (!form) redirect("/dashboard/forms")
  return (
    <AssignForm
      form={JSON.parse(JSON.stringify(form))}
      agents={JSON.parse(JSON.stringify(agents))}
      assignments={JSON.parse(JSON.stringify(assignments))}
    />
  )
}
