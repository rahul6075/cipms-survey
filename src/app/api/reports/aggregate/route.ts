import { NextRequest, NextResponse } from "next/server"
import { Types } from "mongoose"
import { auth } from "@/shared/lib/auth"
import { connectDB } from "@/shared/lib/mongodb"
import Form from "@/modules/survey/models/Form"
import Response from "@/modules/survey/models/Response"

type Body = {
  formId: string
  from?: string | null
  to?: string | null
  filters?: Record<string, string | number | boolean | null>
}

/*
 * Breakdowns only make sense for fields with a bounded value space. Free-text,
 * phone, photo, date and time behave like per-response data (one row per
 * response, zero signal in aggregate) and belong in the raw table, not the
 * analytics tiles. We keep categorical + numeric only.
 */
/** Field types where we count value frequencies (bar/pie). */
const CATEGORICAL = new Set(["radio", "checkbox", "dropdown", "yes_no"])
/** Field types where we compute numeric distribution. */
const NUMERIC = new Set(["number", "rating"])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await connectDB()
  const body = (await req.json()) as Body

  if (!body.formId) return NextResponse.json({ error: "formId required" }, { status: 400 })

  // Load the form so we know how to interpret each answer field.
  const form = await Form.findById(body.formId).lean<{
    _id: unknown
    title: string
    status: string
    created_by: unknown
    fields: Array<{ id: string; label: string; type: string; options?: string[] }>
  }>()
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 })

  // Access control: admins can only run reports on their own forms.
  if (session.user.role !== "super_admin" && String(form.created_by) !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Build the base $match for responses in this form + optional date range + filters.
  const match: Record<string, unknown> = { form_id: new Types.ObjectId(body.formId) }
  if (body.from || body.to) {
    const dateFilter: Record<string, Date> = {}
    if (body.from) dateFilter.$gte = new Date(body.from)
    if (body.to) dateFilter.$lte = new Date(body.to)
    match.submitted_at = dateFilter
  }

  // Field filters: answers.<id> = value. (Mongo Map stores as answers.<id>.)
  const filterEntries = Object.entries(body.filters || {}).filter(([, v]) => v !== null && v !== "")
  for (const [key, value] of filterEntries) {
    // Hard-coded system filters.
    if (key === "__device") { match.device = value; continue }
    if (key === "__agent") {
      try { match.agent_id = new Types.ObjectId(String(value)) } catch { /* ignore */ }
      continue
    }
    match[`answers.${key}`] = value
  }

  // Pre-compute the span for timeseries bucketing (day vs hour).
  const now = new Date()
  const from = body.from ? new Date(body.from) : new Date(now.getTime() - 29 * 86400_000)
  const to = body.to ? new Date(body.to) : now
  const spanDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400_000))
  const bucket = spanDays <= 2
    ? { format: "%Y-%m-%d %H:00", unit: "hour" as const }
    : { format: "%Y-%m-%d", unit: "day" as const }

  // Compare-to-previous-period
  const prevSpan = to.getTime() - from.getTime()
  const prevFrom = new Date(from.getTime() - prevSpan)
  const prevTo = from

  // Build per-field breakdown facets dynamically.
  const facets: Record<string, unknown[]> = {
    overview: [
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          uniqueAgents: { $addToSet: "$agent_id" },
          mobile: { $sum: { $cond: [{ $eq: ["$device", "mobile"] }, 1, 0] } },
          desktop: { $sum: { $cond: [{ $eq: ["$device", "desktop"] }, 1, 0] } },
          firstAt: { $min: "$submitted_at" },
          lastAt: { $max: "$submitted_at" },
        },
      },
      {
        $project: {
          total: 1,
          mobile: 1,
          desktop: 1,
          uniqueAgents: { $size: "$uniqueAgents" },
          firstAt: 1,
          lastAt: 1,
        },
      },
    ],
    timeseries: [
      {
        $group: {
          _id: { $dateToString: { format: bucket.format, date: "$submitted_at" } },
          n: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ],
    byDeviceByDay: [
      {
        $group: {
          _id: {
            d: { $dateToString: { format: "%Y-%m-%d", date: "$submitted_at" } },
            device: "$device",
          },
          n: { $sum: 1 },
        },
      },
      { $sort: { "_id.d": 1 } },
    ],
    leaderboard: [
      { $match: { agent_id: { $ne: null } } },
      {
        $group: {
          _id: "$agent_id",
          submissions: { $sum: 1 },
          firstAt: { $min: "$submitted_at" },
          lastAt: { $max: "$submitted_at" },
        },
      },
      { $sort: { submissions: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "agent",
          pipeline: [{ $project: { name: 1, email: 1, profile_data: 1 } }],
        },
      },
      { $unwind: { path: "$agent", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          submissions: 1,
          firstAt: 1,
          lastAt: 1,
          agent: { name: 1, email: 1, profile_data: 1 },
        },
      },
    ],
    hourHistogram: [
      {
        $group: {
          _id: { $hour: "$submitted_at" },
          n: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ],
  }

  // Per-field facets, generated once per field.
  for (const f of form.fields || []) {
    const key = f.id
    if (!key) continue
    if (CATEGORICAL.has(f.type)) {
      // $unwind handles checkbox arrays; non-arrays are kept as-is.
      facets[`field:${key}`] = [
        { $match: { [`answers.${key}`]: { $exists: true, $ne: null, $nin: [""] } } },
        { $project: { v: `$answers.${key}` } },
        { $project: { v: { $cond: [{ $isArray: "$v" }, "$v", ["$v"]] } } },
        { $unwind: "$v" },
        { $group: { _id: "$v", n: { $sum: 1 } } },
        { $sort: { n: -1 } },
        { $limit: 30 },
      ]
    } else if (NUMERIC.has(f.type)) {
      facets[`field:${key}`] = [
        { $match: { [`answers.${key}`]: { $type: ["number", "string"] } } },
        {
          $project: {
            v: {
              $convert: { input: `$answers.${key}`, to: "double", onError: null, onNull: null },
            },
          },
        },
        { $match: { v: { $ne: null } } },
        {
          $group: {
            _id: null,
            n: { $sum: 1 },
            min: { $min: "$v" },
            max: { $max: "$v" },
            avg: { $avg: "$v" },
            values: { $push: "$v" },
          },
        },
        // Keep the raw values array small — client will bucket.
        { $project: { n: 1, min: 1, max: 1, avg: 1, values: { $slice: ["$values", 500] } } },
      ]
    }
    // Other field types (text, phone, email, photo, date, time, location,
    // constituency, social_media) deliberately produce no tile — their data
    // is still exposed via the Raw responses table and the response drawer.
  }

  let agg: Record<string, unknown> | undefined
  try {
    const [res] = await Response.aggregate([
      { $match: match },
      /* The $facet schema can't model dynamic per-field branches cleanly;
         Mongo evaluates them fine at runtime. */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $facet: facets as any },
    ])
    agg = res
  } catch (e) {
    console.error("[/api/reports/aggregate] failed:", (e as Error).message)
    return NextResponse.json({ error: "aggregation_failed", detail: (e as Error).message }, { status: 500 })
  }

  // Previous period overview for KPI deltas.
  let prevTotal = 0
  try {
    const prev = await Response.countDocuments({ ...match, submitted_at: { $gte: prevFrom, $lte: prevTo } })
    prevTotal = prev
  } catch { /* ignore */ }

  // Shape the output into something the client can render without translating.
  const ov = (agg?.overview as Array<Record<string, unknown>>)?.[0] || {}
  const total = Number(ov.total) || 0

  // Fill timeseries with zeros for missing buckets.
  const rawTs = (agg?.timeseries as Array<{ _id: string; n: number }>) || []
  const tsMap = new Map(rawTs.map((r) => [r._id, r.n]))
  const timeseries: Array<{ bucket: string; n: number }> = []
  if (bucket.unit === "hour") {
    for (let t = from.getTime(); t <= to.getTime(); t += 3600_000) {
      const d = new Date(t)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:00`
      timeseries.push({ bucket: k, n: tsMap.get(k) || 0 })
    }
  } else {
    for (let t = new Date(from).setHours(0, 0, 0, 0); t <= to.getTime(); t += 86400_000) {
      const d = new Date(t)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      timeseries.push({ bucket: k, n: tsMap.get(k) || 0 })
    }
  }

  // Reshape per-field facets by field id, carrying field metadata.
  const fields: Array<Record<string, unknown>> = []
  for (const f of form.fields || []) {
    const raw = (agg?.[`field:${f.id}`] as unknown) ?? null
    if (raw === null) continue
    fields.push({
      id: f.id,
      label: f.label,
      type: f.type,
      options: f.options || [],
      data: raw,
    })
  }

  return NextResponse.json({
    form: { _id: String(form._id), title: form.title, status: form.status, fields: form.fields || [] },
    scope: {
      from: from.toISOString(),
      to: to.toISOString(),
      filters: body.filters || {},
      bucket: bucket.unit,
    },
    overview: {
      total,
      previousTotal: prevTotal,
      deltaPct: prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null,
      uniqueAgents: Number(ov.uniqueAgents) || 0,
      mobile: Number(ov.mobile) || 0,
      desktop: Number(ov.desktop) || 0,
      firstAt: ov.firstAt || null,
      lastAt: ov.lastAt || null,
    },
    timeseries,
    leaderboard: ((agg?.leaderboard as Array<Record<string, unknown>>) || []).map((r) => ({
      agent_id: String(r._id),
      name: (r.agent as Record<string, unknown> | undefined)?.name || "Unknown",
      profile_data: (r.agent as Record<string, unknown> | undefined)?.profile_data || {},
      submissions: Number(r.submissions) || 0,
      firstAt: r.firstAt,
      lastAt: r.lastAt,
    })),
    hourHistogram: ((agg?.hourHistogram as Array<{ _id: number; n: number }>) || []),
    fields,
  })
}
