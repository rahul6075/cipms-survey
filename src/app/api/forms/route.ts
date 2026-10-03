import { NextRequest, NextResponse } from "next/server"
import { Types, type PipelineStage } from "mongoose"
import { auth } from "@/shared/lib/auth"
import { connectDB } from "@/shared/lib/mongodb"
import Form from "@/modules/survey/models/Form"

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

const SORTABLE: Record<string, string> = {
  title: "title",
  status: "status",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  responses_total: "responses_total",
  last_response_at: "last_response_at",
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)

  // When no pagination is requested we return the raw list (legacy behavior)
  // so existing callers (e.g. the intake form picker) keep working.
  const legacy = !searchParams.has("page") && !searchParams.has("q") &&
                 !searchParams.has("status") && !searchParams.has("sort")

  const q = (searchParams.get("q") || "").trim()
  const status = searchParams.get("status") || undefined
  const access = searchParams.get("access") || undefined
  const owner = searchParams.get("owner") || undefined
  const sortParam = searchParams.get("sort") || "-updatedAt"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE))

  // Base scope: non-super admins see only their own forms
  const scope: Record<string, unknown> =
    session.user.role === "super_admin"
      ? { deleted_at: null }
      : { deleted_at: null, created_by: new Types.ObjectId(session.user.id) }

  const filter: Record<string, unknown> = { ...scope }
  if (status && status !== "all") filter.status = status
  if (access && access !== "all") filter.access_type = access
  if (owner && owner !== "all" && session.user.role === "super_admin") {
    if (Types.ObjectId.isValid(owner)) filter.created_by = new Types.ObjectId(owner)
  }
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const rx = new RegExp(safe, "i")
    filter.$or = [{ title: rx }, { description: rx }]
  }

  // Legacy flat list for callers that still expect an array.
  if (legacy) {
    const forms = await Form.find(filter).sort({ createdAt: -1 }).populate("created_by", "name email").lean()
    return NextResponse.json(forms)
  }

  const sortField = sortParam.replace(/^-/, "")
  const sortDir: 1 | -1 = sortParam.startsWith("-") ? -1 : 1
  const sort: Record<string, 1 | -1> = SORTABLE[sortField]
    ? { [SORTABLE[sortField]]: sortDir }
    : { updatedAt: -1 }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  // Stats-derived sorts must run after the response lookup; plain field sorts run
  // first so only one page of forms gets looked up.
  const sortsOnStats = sortField === "responses_total" || sortField === "last_response_at"
  const page_ = [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }]
  const statsStages: PipelineStage[] = [
    {
      // One scan per form: per-day buckets for the last 7 days plus a single
      // bucket for everything older; totals are summed in JS.
      $lookup: {
        from: "responses",
        let: { fid: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$form_id", "$$fid"] } } },
          {
            $group: {
              _id: {
                $cond: [
                  { $gte: ["$submitted_at", sevenDaysAgo] },
                  { $dateToString: { format: "%Y-%m-%d", date: "$submitted_at" } },
                  "older",
                ],
              },
              n: { $sum: 1 },
              last: { $max: "$submitted_at" },
            },
          },
        ],
        as: "buckets",
      },
    },
    {
      $set: {
        responses_total: { $sum: "$buckets.n" },
        last_response_at: { $max: "$buckets.last" },
      },
    },
  ]

  type Row = Record<string, unknown> & {
    buckets?: Array<{ _id: string; n: number }>
    responses_total?: number
  }
  let rowsAgg: Row[] = []
  let countsAgg: { total: number; active: number; draft: number; closed: number } =
    { total: 0, active: 0, draft: 0, closed: 0 }
  try {
    const [rowsRes, countsRes] = await Promise.all([
      Form.aggregate<Row>([
        { $match: filter },
        ...(sortsOnStats
          ? [...statsStages, { $sort: sort }, ...page_]
          : [{ $sort: sort }, ...page_, ...statsStages]),
        {
          $lookup: {
            from: "users",
            localField: "created_by",
            foreignField: "_id",
            as: "created_by",
            pipeline: [{ $project: { name: 1, email: 1 } }],
          },
        },
        { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "assignments",
            let: { fid: "$_id" },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$form_id", "$$fid"] }, { $eq: ["$status", "active"] }] } } },
              { $count: "n" },
            ],
            as: "assignment_stats",
          },
        },
        {
          $project: {
            title: 1, description: 1, status: 1, access_type: 1,
            require_consent: 1, constituency: 1,
            created_by: 1, createdAt: 1, updatedAt: 1,
            field_count: { $size: { $ifNull: ["$fields", []] } },
            buckets: 1,
            responses_total: 1,
            last_response_at: 1,
            assigned_count: { $ifNull: [{ $arrayElemAt: ["$assignment_stats.n", 0] }, 0] },
          },
        },
      ]),
      Form.aggregate<typeof countsAgg>([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            draft: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
            closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          },
        },
        { $project: { _id: 0 } },
      ]),
    ])
    rowsAgg = rowsRes
    countsAgg = countsRes[0] || countsAgg
  } catch (e) {
    console.error("[/api/forms] aggregation failed:", (e as Error).message)
    return NextResponse.json({ error: "aggregation_failed" }, { status: 500 })
  }

  // Fill the 7-day sparkline with zeros so each row has a consistent array length.
  const rows = rowsAgg.map(({ buckets, ...r }) => {
    const map = new Map((buckets || []).map((d) => [d._id, d.n]))
    const days: number[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(map.get(d.toISOString().slice(0, 10)) || 0)
    }
    return {
      ...r,
      responses_total: r.responses_total || 0,
      last_response_at: r.last_response_at ?? null,
      responses_last_7d: days,
    }
  })

  const total = countsAgg.total

  return NextResponse.json({
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    counts: countsAgg,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDB()
  const { title, description, status, fields, require_consent } = await req.json()
  const form = await Form.create({
    title, description, status, fields,
    require_consent: !!require_consent,
    created_by: session.user.id,
  })
  return NextResponse.json(form, { status: 201 })
}
