import { NextRequest, NextResponse } from "next/server"
import type { PipelineStage } from "mongoose"
import { auth } from "@/shared/lib/auth"
import { connectDB } from "@/shared/lib/mongodb"
import Response from "@/modules/survey/models/Response"
import "@/modules/users/models/User"
import { buildScopeMatch, loadReportForm, type ScopeInput } from "@/modules/survey/reports/reportScope"

type Body = ScopeInput & {
  formId: string
  row: string
  col?: string | null
  metricField?: string | null
}

export type PivotCell = { r: unknown; c: unknown; n: number; agents: number; sum: number; numeric: number }

const AGENT_DIMS: Record<string, string> = {
  __panchayat: "$__agent.profile_data.panchayat",
  __state: "$__agent.profile_data.state",
}
const MAX_CELLS = 5000

// "थरौली " and "थरौली" must land in the same bucket.
const trimmed = (path: string) => ({
  $cond: [{ $eq: [{ $type: path }, "string"] }, { $trim: { input: path } }, path],
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await connectDB()
  const body = (await req.json()) as Body
  if (!body.formId || !body.row) return NextResponse.json({ error: "formId and row required" }, { status: 400 })

  const loaded = await loadReportForm(session, body.formId)
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  const { form } = loaded
  const fieldIds = new Set(form.fields.map((f) => f.id))

  // Dimension ids become field paths, so only known ids are accepted.
  const dimExpr = (id: string): string | null => {
    if (id === "__device") return "$device"
    if (AGENT_DIMS[id]) return AGENT_DIMS[id]
    return fieldIds.has(id) ? `$answers.${id}` : null
  }
  const rowExpr = dimExpr(body.row)
  const colExpr = body.col && body.col !== "__none" ? dimExpr(body.col) : null
  if (!rowExpr || (body.col && body.col !== "__none" && !colExpr))
    return NextResponse.json({ error: "Unknown dimension" }, { status: 400 })
  const metricField = body.metricField && fieldIds.has(body.metricField) ? body.metricField : null

  const needsAgent = [body.row, body.col].some((d) => d && AGENT_DIMS[d])
  const numeric = metricField
    ? { $convert: { input: `$answers.${metricField}`, to: "double", onError: null, onNull: null } }
    : null

  const pipeline: PipelineStage[] = [{ $match: buildScopeMatch(form, body) }]
  if (needsAgent) {
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "agent_id",
          foreignField: "_id",
          as: "__agent",
          pipeline: [{ $project: { "profile_data.panchayat": 1, "profile_data.state": 1 } }],
        },
      },
      { $set: { __agent: { $first: "$__agent" } } },
    )
  }
  pipeline.push(
    {
      $project: {
        agent_id: 1,
        r: rowExpr,
        c: colExpr ?? null,
        ...(numeric ? { num: numeric } : {}),
      },
    },
    // Checkbox answers are arrays: count the response under each selected option.
    { $unwind: { path: "$r", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$c", preserveNullAndEmptyArrays: true } },
    { $set: { r: trimmed("$r"), c: trimmed("$c") } },
    {
      $group: {
        _id: { r: "$r", c: "$c" },
        n: { $sum: 1 },
        agents: { $addToSet: "$agent_id" },
        sum: { $sum: numeric ? "$num" : 0 },
        numeric: { $sum: numeric ? { $cond: [{ $ne: ["$num", null] }, 1, 0] } : 0 },
      },
    },
    { $limit: MAX_CELLS },
    { $project: { _id: 0, r: "$_id.r", c: "$_id.c", n: 1, sum: 1, numeric: 1, agents: { $size: "$agents" } } },
  )

  try {
    const cells = await Response.aggregate<PivotCell>(pipeline).option({ allowDiskUse: true })
    return NextResponse.json({ cells })
  } catch (e) {
    console.error("[/api/reports/pivot] failed:", (e as Error).message)
    return NextResponse.json({ error: "pivot_failed" }, { status: 500 })
  }
}
