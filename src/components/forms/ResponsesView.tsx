"use client"
import { motion } from "framer-motion"
import { BarChart3, User, MapPin, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Props { form: any; data: any; role: string }

export function ResponsesView({ form, data, role }: Props) {
  if (data.restricted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-gray-900">Responses</h1>
          <p className="text-gray-500 mt-1">{form.title}</p>
        </motion.div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-12 h-12 text-orange-300 mx-auto mb-4" />
            <p className="text-3xl font-bold text-gray-900">{data.total}</p>
            <p className="text-gray-500 mt-1">Total Responses</p>
            <p className="text-xs text-gray-400 mt-4">Full response data is visible to Super Admin only.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Responses</h1>
          <p className="text-gray-500 mt-1">{form.title} · {data.responses?.length || 0} total</p>
        </div>
      </motion.div>

      <motion.div
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        className="space-y-4"
      >
        {data.responses?.map((r: any, idx: number) => (
          <motion.div key={r._id} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{r.submitter_info?.name || "Anonymous"}</p>
                      <p className="text-xs text-gray-400">{r.submitter_info?.phone || "—"} · {r.submitter_info?.village || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {r.agent_id && <Badge variant="outline" className="text-xs">{r.agent_id.name}</Badge>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.submitted_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <Badge className="bg-blue-50 text-blue-600 text-xs">{r.device}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {Object.entries(r.answers || {}).map(([fieldId, val]: [string, any]) => {
                    const field = form.fields?.find((f: any) => f.id === fieldId)
                    if (!field) return null
                    return (
                      <div key={fieldId} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1 truncate">{field.label}</p>
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {Array.isArray(val) ? val.join(", ") : typeof val === "object" ? JSON.stringify(val) : String(val || "—")}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
