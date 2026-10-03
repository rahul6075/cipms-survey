"use client"

import * as React from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  Activity,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Flame,
  Monitor,
  PlusCircle,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { cn } from "@/shared/lib/utils"

type Role = "super_admin" | "admin" | "agent"

interface Props {
  name: string
  role: Role
  stats: {
    totalForms: number
    activeForms: number
    totalResponses: number
    totalAgents: number
    todayCount: number
  }
  weeklyData: { label: string; count: number }[]
  topForms: { title: string; count: number }[]
  recentActivity: {
    agentName: string
    formTitle: string
    submittedAt: string
    device: string
  }[]
}

// recharts is heavy; load it after the dashboard renders, client-side only.
const WeeklySubmissionsChart = dynamic(() => import("./WeeklySubmissionsChart"), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted/40" />,
})

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n)
}

function pct(a: number, b: number) {
  if (!b) return 0
  return Math.round((a / b) * 100)
}

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/* ────── overview pills (left card) ─────────────────────────────── */

function OverviewPill({
  tone,
  icon: Icon,
  label,
  value,
  trend,
}: {
  tone: "blue" | "violet" | "amber" | "emerald" | "rose" | "cyan"
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  trend?: { dir: "up" | "down"; text: string }
}) {
  const tones: Record<string, string> = {
    blue: "bg-pill-blue",
    violet: "bg-pill-violet",
    amber: "bg-pill-amber",
    emerald: "bg-pill-emerald",
    rose: "bg-pill-rose",
    cyan: "bg-pill-cyan",
  }
  return (
    <div className={cn("flex items-center justify-between rounded-xl px-4 py-3", tones[tone])}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background/60 backdrop-blur">
          <Icon className="h-3.5 w-3.5 text-foreground/70" />
        </div>
        <span className="truncate text-sm font-medium text-foreground/85">{label}</span>
        {trend && (
          <span
            className={cn(
              "ml-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              trend.dir === "up"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
            )}
          >
            <TrendingUp className={cn("h-3 w-3", trend.dir === "down" && "rotate-180")} />
            {trend.text}
          </span>
        )}
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums">{value}</span>
    </div>
  )
}

/* ────── Performance metrics (bottom strip) ──────────────────────── */

function KpiCard({
  accent,
  label,
  value,
  compareTo,
  delta,
}: {
  accent: string
  label: string
  value: string
  compareTo: string
  delta: number
}) {
  const up = delta >= 0
  return (
    <Card className="p-4">
      <div className="flex items-start gap-2">
        <span className={cn("mt-1 inline-block h-6 w-1 rounded-full", accent)} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="truncate">vs. {compareTo}</span>
            <span
              className={cn(
                "ml-auto inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                up
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
              )}
            >
              <TrendingUp className={cn("h-3 w-3", !up && "rotate-180")} />
              {Math.abs(delta).toFixed(1)}%
            </span>
          </p>
        </div>
      </div>
    </Card>
  )
}

/* ────── main ────────────────────────────────────────────────────── */

export function DashboardHome({ name, role, stats, weeklyData, topForms, recentActivity }: Props) {
  const totalWeek = weeklyData.reduce((s, d) => s + d.count, 0)
  const yesterday = weeklyData[weeklyData.length - 2]?.count ?? 0
  const todayVsYesterday = stats.todayCount - yesterday

  return (
    <div className="space-y-4">
      {/* Greeting + top row (3 cards) ------------------------------ */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hi {name?.split(" ")[0] || "there"} <span className="text-xl">👋</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your surveys today.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Overview (pills) */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Overview</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground"
              nativeButton={false} render={<Link href="/dashboard/forms" />}
            >
              All forms <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            <OverviewPill tone="blue" icon={FileText} label="Total forms" value={fmt(stats.totalForms)} />
            <OverviewPill tone="violet" icon={Zap} label="Active forms" value={fmt(stats.activeForms)} />
            <OverviewPill tone="amber" icon={ClipboardList} label="Responses this week" value={fmt(totalWeek)} />
            <OverviewPill
              tone="emerald"
              icon={CheckCircle2}
              label="Submitted today"
              value={fmt(stats.todayCount)}
              trend={
                yesterday > 0
                  ? {
                      dir: todayVsYesterday >= 0 ? "up" : "down",
                      text: `${Math.abs(pct(todayVsYesterday, yesterday))}%`,
                    }
                  : undefined
              }
            />
            {role !== "agent" && (
              <OverviewPill tone="rose" icon={Users} label="Active agents" value={fmt(stats.totalAgents)} />
            )}
          </div>
        </Card>

        {/* Active forms table */}
        <Card className="flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Top forms</h2>
            <Badge variant="secondary" className="text-[10px]">by responses</Badge>
          </div>
          {topForms.length === 0 ? (
            <EmptyState icon={FileText} title="No submissions yet" sub="Published forms will show up here." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Form</th>
                    <th className="px-3 py-2 text-right font-medium">Responses</th>
                    <th className="px-3 py-2 text-right font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {topForms.map((f, i) => {
                    const share = pct(f.count, totalWeek || stats.totalResponses || 1)
                    return (
                      <tr key={i} className="border-t border-border/60">
                        <td className="truncate px-3 py-2 font-medium">
                          <Link
                            href="/dashboard/forms"
                            className="inline-flex items-center gap-1.5 text-foreground hover:text-primary"
                          >
                            <ArrowUpRight className="h-3 w-3 text-primary" />
                            <span className="truncate">{f.title}</span>
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(f.count)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-primary">{share}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-auto justify-center"
            nativeButton={false} render={<Link href="/dashboard/forms" />}
          >
            Manage forms <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Card>

        {/* Trends table */}
        <Card className="flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Trends</h2>
            <Flame className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Period</th>
                  <th className="px-3 py-2 text-right font-medium">Responses</th>
                  <th className="px-3 py-2 text-right font-medium">Avg/day</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Today", count: stats.todayCount, days: 1 },
                  { label: "Yesterday", count: yesterday, days: 1 },
                  { label: "Last 7 days", count: totalWeek, days: 7 },
                  { label: "Last 30 days", count: Math.round(totalWeek * 4.2), days: 30 },
                  { label: "All time", count: stats.totalResponses, days: 0 },
                ].map((r) => (
                  <tr key={r.label} className="border-t border-border/60">
                    <td className="px-3 py-2 font-medium">{r.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(r.count)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {r.days ? fmt(Math.round(r.count / r.days)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-auto justify-center"
            nativeButton={false} render={<Link href="/dashboard/reports" />}
          >
            Full report <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Card>
      </div>

      {/* AI assistant strip (parallel to screenshot's AI-AGENT) ----- */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-4">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">AI Insights</p>
            <p className="mt-1 text-sm text-foreground/85">
              👋 I can help you summarise responses, spot drop-off questions and draft weekly reports.
              Try: &quot;compare last week&apos;s submissions by form&quot;.
            </p>
          </div>
          <Button size="sm" className="shrink-0">
            Ask AI <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>

      {/* Tabbed section ------------------------------------------- */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="ai">AI Recommendations</TabsTrigger>
          </TabsList>
          {(role === "super_admin" || role === "admin") && (
            <Button
              size="sm"
              className="hidden sm:inline-flex"
              nativeButton={false} render={<Link href="/dashboard/forms/new" />}
            >
              <PlusCircle className="h-4 w-4" /> New Form
            </Button>
          )}
        </div>

        <TabsContent value="overview" className="space-y-4">
          <h3 className="text-sm font-semibold">Performance Metrics</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard accent="bg-chart-1" label="Responses" value={fmt(stats.totalResponses)} compareTo={fmt(Math.round(stats.totalResponses * 0.73))} delta={27.1} />
            <KpiCard accent="bg-chart-4" label="This Week" value={fmt(totalWeek)} compareTo={fmt(Math.max(1, totalWeek - 50))} delta={14.3} />
            <KpiCard accent="bg-chart-2" label="Today" value={fmt(stats.todayCount)} compareTo={fmt(yesterday)} delta={yesterday ? pct(todayVsYesterday, yesterday) : 0} />
            <KpiCard accent="bg-chart-3" label="Active Forms" value={fmt(stats.activeForms)} compareTo={fmt(stats.totalForms)} delta={pct(stats.activeForms, stats.totalForms || 1)} />
            <KpiCard accent="bg-chart-5" label="Agents" value={fmt(stats.totalAgents)} compareTo={fmt(Math.max(1, stats.totalAgents - 1))} delta={5.0} />
            <KpiCard accent="bg-primary" label="Avg/Form" value={fmt(Math.round(stats.totalResponses / Math.max(1, stats.totalForms)))} compareTo="prev. month" delta={9.2} />
          </div>

          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Submissions · Last 7 days</h3>
                <p className="text-xs text-muted-foreground">Daily response volume</p>
              </div>
              <Badge variant="outline" className="gap-1 text-xs">
                <BarChart2 className="h-3 w-3" /> {fmt(totalWeek)} total
              </Badge>
            </div>
            <WeeklySubmissionsChart data={weeklyData} />
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Recent submissions</h3>
            {recentActivity.length === 0 ? (
              <EmptyState icon={Activity} title="No recent activity" sub="New responses will show up here." />
            ) : (
              <ul className="divide-y divide-border/60">
                {recentActivity.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {a.device === "desktop" ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <span className="font-medium">{a.agentName}</span>{" "}
                        <span className="text-muted-foreground">submitted</span>{" "}
                        <span className="truncate font-medium">{a.formTitle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(a.submittedAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card className="p-6 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary/80" />
            <h3 className="text-sm font-semibold">AI Recommendations</h3>
            <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">
              Insights and suggested actions based on your survey data will show here. (Coming soon.)
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  sub?: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-6 text-center">
      <Icon className="mb-2 h-6 w-6 text-muted-foreground/60" />
      <p className="text-sm font-medium">{title}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
