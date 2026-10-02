import { NextRequest, NextResponse } from "next/server"
import { Types } from "mongoose"
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
    try { filter.created_by = new Types.ObjectId(owner) } catch { /* ignore */ }
  }
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const rx = new RegExp(safe, "i")
    filter.$or = [{ title: rx }, { description: rx }]
  }

  // Legacy flat list for callers that still expect an array.
  if (legacy) {
    const forms = await Form.find(filter).sort({ createdAt: -1 }).populate("created_by", "name email")
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

  // Two aggregations in parallel. Can't combine via $facet because MongoDB
  // disallows $lookup inside $facet sub-pipelines.
  let rowsAgg: Array<Record<string, unknown> & { responses_by_day?: Array<{ _id: string; n: number }> }> = []
  let countsAgg: { total: Array<{ n: number }>; byStatus: Array<{ _id: string; n: number }> } = { total: [], byStatus: [] }
  try {
    const [rowsRes, countsRes] = await Promise.all([
      Form.aggregate([
        { $match: filter },
        { $sort: sort },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
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
            from: "responses",
            let: { fid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$form_id", "$$fid"] } } },
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  last_response_at: { $max: "$submitted_at" },
                },
              },
            ],
            as: "response_totals",
          },
        },
        {
          $lookup: {
            from: "responses",
            let: { fid: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$form_id", "$$fid"] },
                      { $gte: ["$submitted_at", sevenDaysAgo] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m-%d", date: "$submitted_at" } },
                  n: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
            as: "responses_by_day",
          },
        },
        {
          $lookup: {
            from: "assignments",
            let: { fid: "$_id" },
            pipeline: [
              { $match: { $expr: { $and: [
                { $eq: ["$form_id", "$$fid"] },
                { $eq: ["$status", "active"] },
              ]}}},
              { $count: "n" },
            ],
            as: "assignment_stats",
          },
        },
        {
          $project: {
            title: 1, description: 1, status: 1, access_type: 1,
            fields: 1, require_consent: 1, constituency: 1,
            created_by: 1, createdAt: 1, updatedAt: 1,
            responses_total: { $ifNull: [{ $arrayElemAt: ["$response_totals.total", 0] }, 0] },
            last_response_at: { $ifNull: [{ $arrayElemAt: ["$response_totals.last_response_at", 0] }, null] },
            responses_by_day: 1,
            assigned_count: { $ifNull: [{ $arrayElemAt: ["$assignment_stats.n", 0] }, 0] },
          },
        },
      ]),
      Form.aggregate([
        { $match: filter },
        {
          $facet: {
            total: [{ $count: "n" }],
            byStatus: [{ $group: { _id: "$status", n: { $sum: 1 } } }],
          },
        },
      ]),
    ])
    rowsAgg = rowsRes
    countsAgg = countsRes[0] || countsAgg
  } catch (e) {
    console.error("[/api/forms] aggregation failed:", (e as Error).message, (e as Error).stack)
    return NextResponse.json({ error: "aggregation_failed", detail: (e as Error).message }, { status: 500 })
  }

  const rawRows = rowsAgg

  // Fill the 7-day sparkline with zeros so each row has a consistent array length.
  const rows = rawRows.map((r) => {
    const days: number[] = []
    const map = new Map((r.responses_by_day || []).map((d) => [d._id, d.n]))
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(map.get(d.toISOString().slice(0, 10)) || 0)
    }
    return {
      _id: r._id,
      title: r.title,
      description: r.description,
      status: r.status,
      access_type: r.access_type,
      fields: Array.isArray(r.fields) ? r.fields : [],
      field_count: Array.isArray(r.fields) ? r.fields.length : 0,
      require_consent: r.require_consent,
      constituency: r.constituency,
      created_by: r.created_by,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      responses_total: r.responses_total || 0,
      last_response_at: r.last_response_at,
      responses_last_7d: days,
      assigned_count: r.assigned_count || 0,
    }
  })

  const total = countsAgg.total[0]?.n || 0
  const byStatus = countsAgg.byStatus.reduce<Record<string, number>>(
    (acc, row) => { acc[row._id] = row.n; return acc },
    {}
  )

  return NextResponse.json({
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    counts: {
      total,
      active: byStatus.active || 0,
      draft: byStatus.draft || 0,
      closed: byStatus.closed || 0,
    },
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
