import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import Assignment from "@/models/Assignment"
import { ReportsView } from "@/components/dashboard/ReportsView"

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
