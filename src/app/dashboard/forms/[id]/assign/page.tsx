import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { Types } from "mongoose"
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
  if (!Types.ObjectId.isValid(id)) redirect("/dashboard/forms")
  const isSuper = session.user.role === "super_admin"
  const [form, agents, assignments] = await Promise.all([
    Form.findById(id).select("title created_by").lean<{ _id: unknown; title: string; created_by: unknown }>(),
    // Admins can only assign the Pradhans they manage.
    User.find(isSuper ? { role: "agent" } : { role: "agent", created_by: session.user.id })
      .select("name email").sort({ name: 1 }).lean(),
    Assignment.find({ form_id: id })
      .select("token status village total_submissions agent_id createdAt")
      .populate("agent_id", "name email").sort({ createdAt: -1 }).lean(),
  ])
  if (!form || (!isSuper && String(form.created_by) !== session.user.id)) redirect("/dashboard/forms")
  return (
    <AssignForm
      form={{ _id: String(form._id), title: form.title }}
      agents={JSON.parse(JSON.stringify(agents))}
      assignments={JSON.parse(JSON.stringify(assignments))}
    />
  )
}
