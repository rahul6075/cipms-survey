import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/shared/lib/mongodb"
import Assignment from "@/modules/survey/models/Assignment"
import { ReportsView } from "@/modules/survey/dashboard/ReportsView"

export default async function ReportsPage() {
  const session = await auth()
  if (!session || session.user.role !== "super_admin") redirect("/dashboard")
  await connectDB()
  const leaderboard = await Assignment.aggregate([
    { $group: { _id: "$agent_id", totalSubmissions: { $sum: "$total_submissions" }, totalAssignments: { $sum: 1 } } },
    { $sort: { totalSubmissions: -1 } },
    { $limit: 20 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "agent" } },
    { $unwind: "$agent" },
    { $project: { name: "$agent.name", email: "$agent.email", totalSubmissions: 1, totalAssignments: 1 } },
  ])
  return <ReportsView leaderboard={JSON.parse(JSON.stringify(leaderboard))} />
}
