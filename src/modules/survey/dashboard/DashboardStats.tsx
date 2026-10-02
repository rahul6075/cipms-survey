"use client"
import { motion } from "framer-motion"
import { FileText, CheckCircle, Users, BarChart3, ArrowRight, Plus, TrendingUp } from "lucide-react"
import Link from "next/link"

interface Props {
  totalForms: number
  activeForms: number
  totalResponses: number
  totalAgents: number
  role: string
  name: string
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const card = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
}

export function DashboardStats({ totalForms, activeForms, totalResponses, totalAgents, role, name }: Props) {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })

  const stats = [
    {
      label: "Total Forms",
      value: totalForms,
      sub: "all time",
      icon: FileText,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
      accent: "group-hover:shadow-blue-100",
    },
    {
      label: "Active Forms",
      value: activeForms,
      sub: "currently live",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50",
      accent: "group-hover:shadow-emerald-100",
    },
    {
      label: "Total Responses",
      value: totalResponses,
      sub: "collected so far",
      icon: TrendingUp,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-50",
      accent: "group-hover:shadow-orange-100",
    },
    ...(role !== "agent"
      ? [{
        label: "Gram Pradhans",
        value: totalAgents,
        sub: "field agents",
        icon: Users,
        iconColor: "text-violet-500",
        iconBg: "bg-violet-50",
        accent: "group-hover:shadow-violet-100",
      }]
      : []),
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Namaste, {name.split(" ")[0]}
          </h1>
          <p className="text-gray-400 mt-1 text-sm">{today}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={card}>
            <div className={`group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md ${s.accent} transition-all duration-200`}>
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-5`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{s.value.toLocaleString()}</p>
              <p className="text-sm font-medium text-gray-600 mt-1">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      {role !== "agent" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Quick Actions</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/forms/new">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 h-10 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-[0_2px_10px_rgba(249,115,22,0.25)] hover:shadow-[0_4px_16px_rgba(249,115,22,0.35)] transition-all"
              >
                <Plus className="w-4 h-4" />
                New Form
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </Link>
            <Link href="/dashboard/users">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 h-10 px-5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 text-sm font-medium transition-all shadow-sm"
              >
                <Users className="w-4 h-4" />
                Add Gram Pradhan
              </motion.button>
            </Link>
            <Link href="/dashboard/forms">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 h-10 px-5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 text-sm font-medium transition-all shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                View All Forms
              </motion.button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
