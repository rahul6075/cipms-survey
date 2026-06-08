"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  FileText, CheckCircle, Users, TrendingUp, Plus, ArrowRight,
  Smartphone, Monitor, Activity, BarChart2, Zap, Clock, PieChart,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart as RPieChart, Pie, Cell, Legend,
} from "recharts"
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart"

// ── Types ──────────────────────────────────────────────────────────────────────
interface Props {
  name: string
  role: string
  stats: {
    totalForms: number
    activeForms: number
    totalResponses: number
    totalAgents: number
    todayCount: number
  }
  weeklyData: { label: string; count: number }[]
  topForms: { title: string; count: number }[]
  recentActivity: { agentName: string; formTitle: string; submittedAt: string; device: string }[]
}

// ── Chart configs ──────────────────────────────────────────────────────────────
const barConfig: ChartConfig = {
  count: { label: "Responses", color: "hsl(24 95% 53%)" },
}

const areaConfig: ChartConfig = {
  count: { label: "Responses", color: "hsl(24 95% 53%)" },
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, highlight, delay }: {
  label: string; value: number; sub: string; icon: any
  iconColor: string; iconBg: string; highlight?: boolean; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className={`relative bg-white rounded-2xl p-6 border-2 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
        ${highlight ? "border-orange-200" : "border-gray-100 hover:border-gray-200"}`}
    >
      {highlight && (
        <div className="absolute top-0 right-0 w-28 h-28 bg-orange-50 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
      )}
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-3xl font-bold text-gray-900 tabular-nums tracking-tight">
        {value.toLocaleString("en-IN")}
      </p>
      <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </motion.div>
  )
}

// ── 7-day bar chart ────────────────────────────────────────────────────────────
function WeeklyBarChart({ data }: { data: Props["weeklyData"] }) {
  return (
    <ChartContainer config={barConfig} className="h-52 w-full">
      <BarChart data={data} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          cursor={{ fill: "#fff7ed", radius: 8 }}
        />
        <Bar
          dataKey="count"
          name="Responses"
          radius={[6, 6, 0, 0]}
          fill="hsl(24 95% 53%)"
          maxBarSize={48}
        />
      </BarChart>
    </ChartContainer>
  )
}

// ── Area trend chart (same data, different look) ───────────────────────────────
function AreaTrendChart({ data }: { data: Props["weeklyData"] }) {
  return (
    <ChartContainer config={areaConfig} className="h-52 w-full">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor="hsl(24 95% 53%)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="hsl(24 95% 53%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="count"
          name="Responses"
          stroke="hsl(24 95% 53%)"
          strokeWidth={2.5}
          fill="url(#areaGrad)"
          dot={{ fill: "hsl(24 95% 53%)", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "hsl(24 95% 53%)", strokeWidth: 2, stroke: "#fff" }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

// ── Top forms horizontal bar list ──────────────────────────────────────────────
const BAR_COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#f43f5e"]

function TopFormsList({ forms }: { forms: Props["topForms"] }) {
  const max = Math.max(...forms.map(f => f.count), 1)
  if (forms.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <BarChart2 className="w-8 h-8 text-gray-200" />
      <p className="text-sm text-gray-400">No responses yet</p>
    </div>
  )
  return (
    <div className="space-y-4">
      {forms.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 + i * 0.07 }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
              />
              <p className="text-xs font-semibold text-gray-700 truncate">{f.title}</p>
            </div>
            <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}>
              {f.count}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(f.count / max) * 100}%` }}
              transition={{ delay: 0.35 + i * 0.07, duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Form status donut ──────────────────────────────────────────────────────────
function FormStatusDonut({ active, total }: { active: number; total: number }) {
  const draft = Math.max(total - active, 0)
  const closed = 0
  const data = [
    { name: "Active",  value: active,        color: "#10b981" },
    { name: "Draft",   value: draft - closed, color: "#f97316" },
    { name: "Closed",  value: closed,         color: "#e5e7eb" },
  ].filter(d => d.value > 0)

  if (total === 0) return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <PieChart className="w-8 h-8 text-gray-200" />
      <p className="text-sm text-gray-400">No forms yet</p>
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs font-medium text-gray-600">{value}</span>}
            />
            <Tooltip
              formatter={(val, name) => [val, name]}
              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", fontSize: 12 }}
            />
          </RPieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: 24 }}>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{total}</p>
          <p className="text-[11px] text-gray-400 font-medium">total</p>
        </div>
      </div>
    </div>
  )
}

// ── Activity feed ──────────────────────────────────────────────────────────────
function ActivityFeed({ items }: { items: Props["recentActivity"] }) {
  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10">
      <Activity className="w-8 h-8 text-gray-200 mb-2" />
      <p className="text-sm text-gray-400">No submissions yet</p>
    </div>
  )

  return (
    <div className="divide-y divide-gray-50">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 + i * 0.04 }}
          className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-xs font-bold text-white">
              {item.agentName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{item.agentName}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              submitted <span className="text-gray-600 font-medium">{item.formTitle}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo(item.submittedAt)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-300">
              {item.device === "mobile" ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
              {item.device}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, sub, icon: Icon, action, children, delay = 0 }: {
  title: string; sub?: string; icon?: any; action?: React.ReactNode; children: React.ReactNode; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-orange-500" />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{title}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export function CommandCenter({ name, role, stats, weeklyData, topForms, recentActivity }: Props) {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
  const weekTotal = weeklyData.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Namaste, {name.split(" ")[0]} 🙏
          </h1>
          <p className="text-gray-400 text-sm mt-1">{today}</p>
        </div>
        {role !== "agent" && (
          <div className="flex items-center gap-2">
            <Link href="/dashboard/users">
              <motion.button whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-sm font-medium text-gray-600 shadow-sm transition-all">
                <Users className="w-4 h-4" /> Add Agent
              </motion.button>
            </Link>
            <Link href="/dashboard/forms/new">
              <motion.button whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-[0_2px_10px_rgba(249,115,22,0.3)] transition-all">
                <Plus className="w-4 h-4" /> New Form
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Forms"     value={stats.totalForms}     sub="all time"       icon={FileText}    iconColor="text-blue-500"    iconBg="bg-blue-50"    delay={0.05} />
        <StatCard label="Active Forms"    value={stats.activeForms}    sub="currently live" icon={CheckCircle} iconColor="text-emerald-500" iconBg="bg-emerald-50" delay={0.1} />
        <StatCard label="Total Responses" value={stats.totalResponses} sub="collected"      icon={TrendingUp}  iconColor="text-orange-500"  iconBg="bg-orange-50"  delay={0.15} highlight />
        <StatCard label="Gram Pradhans"   value={stats.totalAgents}    sub="field agents"   icon={Users}       iconColor="text-violet-500"  iconBg="bg-violet-50"  delay={0.2} />
      </div>

      {/* Today banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.22 }}
        className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl px-6 py-4 shadow-[0_4px_24px_rgba(249,115,22,0.25)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg tabular-nums">
              {stats.todayCount} response{stats.todayCount !== 1 ? "s" : ""} today
            </p>
            <p className="text-orange-100 text-xs mt-0.5">Keep the momentum going 🚀</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-xs uppercase tracking-wide">This week</p>
          <p className="text-white font-bold text-2xl tabular-nums">{weekTotal}</p>
        </div>
      </motion.div>

      {/* Charts row: Bar + Area side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Daily Responses" sub="Last 7 days — bar view" icon={BarChart2} delay={0.28}
          action={
            <Link href="/dashboard/forms" className="text-xs font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1">
              All forms <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <WeeklyBarChart data={weeklyData} />
        </Section>

        <Section title="Response Trend" sub="Last 7 days — area view" icon={TrendingUp} delay={0.32}>
          <AreaTrendChart data={weeklyData} />
        </Section>
      </div>

      {/* Bottom row: Top forms + Donut + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px_1fr] gap-6">

        <Section title="Top Forms" sub="by total response count" icon={BarChart2} delay={0.36}>
          <TopFormsList forms={topForms} />
        </Section>

        <Section title="Form Status" sub="distribution" icon={PieChart} delay={0.4}>
          <FormStatusDonut active={stats.activeForms} total={stats.totalForms} />
        </Section>

        <Section
          title="Recent Activity"
          sub="Latest submissions"
          icon={Activity}
          delay={0.44}
          action={
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400 font-medium">Live</span>
            </div>
          }
        >
          <ActivityFeed items={recentActivity} />
        </Section>

      </div>
    </div>
  )
}
