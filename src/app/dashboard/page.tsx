import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import Form from "@/models/Form"
import Response from "@/models/Response"
import User from "@/models/User"
import { CommandCenter } from "@/components/dashboard/CommandCenter"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  await connectDB()
  const role = session.user.role
  const userId = session.user.id
  const formQuery = role === "super_admin" ? {} : { created_by: userId }
  const responseMatch: any = role === "super_admin" ? {} : { agent_id: userId }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [totalForms, activeForms, totalResponses, totalAgents, weeklyRaw, topFormsRaw, recentRaw, todayCount] =
    await Promise.all([
      Form.countDocuments({ ...formQuery, deleted_at: null }),
      Form.countDocuments({ ...formQuery, status: "active", deleted_at: null }),
      Response.countDocuments(responseMatch),
      role !== "agent"
        ? User.countDocuments(role === "super_admin" ? { role: "agent" } : { created_by: userId, role: "agent" })
        : Promise.resolve(0),

      Response.aggregate([
        { $match: { ...responseMatch, submitted_at: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$submitted_at" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      Response.aggregate([
        { $match: responseMatch },
        { $group: { _id: "$form_id", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "forms", localField: "_id", foreignField: "_id", as: "form" } },
        { $unwind: { path: "$form", preserveNullAndEmptyArrays: true } },
        { $project: { title: "$form.title", count: 1 } },
      ]),

      Response.aggregate([
        { $match: responseMatch },
        { $sort: { submitted_at: -1 } },
        { $limit: 10 },
        { $lookup: { from: "users", localField: "agent_id", foreignField: "_id", as: "agent" } },
        { $lookup: { from: "forms", localField: "form_id", foreignField: "_id", as: "form" } },
        { $project: {
          submitted_at: 1,
          agentName: { $ifNull: [{ $arrayElemAt: ["$agent.name", 0] }, "Anonymous"] },
          formTitle:  { $ifNull: [{ $arrayElemAt: ["$form.title", 0] }, "Unknown form"] },
          device: 1,
        }},
      ]),

      Response.countDocuments({ ...responseMatch, submitted_at: { $gte: todayStart } }),
    ])

  // Fill missing days with 0 so chart always shows 7 bars
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString("en-IN", { weekday: "short" })
    return { label, count: (weeklyRaw as any[]).find(r => r._id === key)?.count || 0 }
  })

  return (
    <CommandCenter
      name={session.user.name}
      role={role}
      stats={{ totalForms, activeForms, totalResponses, totalAgents, todayCount }}
      weeklyData={weeklyData}
      topForms={(topFormsRaw as any[]).map(f => ({ title: f.title || "Untitled", count: f.count }))}
      recentActivity={(recentRaw as any[]).map(r => ({
        agentName: r.agentName,
        formTitle: r.formTitle,
        submittedAt: r.submitted_at?.toISOString?.() ?? new Date().toISOString(),
        device: r.device || "mobile",
      }))}
    />
  )
}
