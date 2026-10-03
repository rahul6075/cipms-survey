"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart"

const chartConfig = {
  count: { label: "Responses", color: "var(--chart-1)" },
} satisfies ChartConfig

export default function WeeklySubmissionsChart({ data }: { data: Array<{ label: string; count: number }> }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
        <YAxis tickLine={false} axisLine={false} width={32} className="text-xs" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} fill="url(#dashFill)" />
      </AreaChart>
    </ChartContainer>
  )
}
