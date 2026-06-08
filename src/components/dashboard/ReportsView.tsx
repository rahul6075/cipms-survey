"use client"
import { motion } from "framer-motion"
import { Trophy, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function ReportsView({ leaderboard }: { leaderboard: any[] }) {
  const max = leaderboard[0]?.totalSubmissions || 1
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Gram Pradhan effort leaderboard</p>
      </motion.div>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-400" /> Agent Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {leaderboard.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet. Assign forms to agents to see results.</p>
          ) : leaderboard.map((a, idx) => (
            <motion.div key={a._id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.07 }}>
              <div className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                    <p className="text-sm font-bold text-orange-600">{a.totalSubmissions}</p>
                  </div>
                  <Progress value={(a.totalSubmissions / max) * 100} className="h-1.5" />
                  <p className="text-xs text-gray-400 mt-1">{a.totalAssignments} form{a.totalAssignments !== 1 ? "s" : ""} assigned</p>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
