import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import Form from "@/models/Form"
import User from "@/models/User"
import Assignment from "@/models/Assignment"
import { AssignForm } from "@/components/forms/AssignForm"

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
