import { NextRequest, NextResponse } from "next/server"
import { Types } from "mongoose"
import { auth } from "@/shared/lib/auth"
import { connectDB } from "@/shared/lib/mongodb"
import Form from "@/modules/survey/models/Form"
import Response from "@/modules/survey/models/Response"
import "@/modules/users/models/User"
import "@/modules/survey/models/Assignment"
import { decodeState } from "@/shared/components/data-table/urlState"
import { stateToMongo, type ColumnMap } from "@/shared/components/data-table/mongoFilter"

/** System column map for responses — form-field columns are added at request time. */
const RESPONSE_SYSTEM_COLUMNS: ColumnMap = {
  __submitted_at: { field: "submitted_at", kind: "date" },
  __device:       { field: "device",       kind: "enum" },
  __agent:        {
    field: "agent_id",
    kind: "string",
    transform: (v) => { try { return new Types.ObjectId(String(v)) } catch { return null } },
  },
}

function buildResponsesColumnMap(form: { fields?: Array<{ id?: string; type?: string }> }): ColumnMap {
  const map: ColumnMap = { ...RESPONSE_SYSTEM_COLUMNS }
  for (const f of form.fields || []) {
    if (!f.id) continue
    let kind: ColumnMap[string]["kind"] = "string"
    if (f.type === "number" || f.type === "rating") kind = "number"
    else if (f.type === "date" || f.type === "time") kind = "date"
    else if (f.type === "yes_no") kind = "boolean"
    else if (f.type === "radio" || f.type === "dropdown") kind = "enum"
    else if (f.type === "checkbox") kind = "arrayEnum"
    map[f.id] = { field: `answers.${f.id}`, kind }
  }
  return map
}

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 200

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "agent")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await connectDB()
  const sp = req.nextUrl.searchParams
  const formId = sp.get("formId")
  if (!formId) return NextResponse.json({ error: "formId required" }, { status: 400 })

  // Verify access to the form (and pull fields so dt= can build its column map).
  const form = await Form.findById(formId).select("created_by fields").lean<{
    created_by: unknown
    fields?: Array<{ id?: string; type?: string }>
  }>()
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 })
  if (session.user.role !== "super_admin" && String(form.created_by) !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  /* ─── DataTable path (?dt=…) — takes precedence when non-empty ─── */
  const dt = sp.get("dt")
  if (dt !== null && dt !== "") {
    try {
      const state = decodeState(dt)
      const colMap = buildResponsesColumnMap(form)
      const { match, sort, skip, limit } = stateToMongo(state, colMap, {
        base: { form_id: new Types.ObjectId(formId) },
        maxPageSize: MAX_PAGE_SIZE,
        defaultSort: { submitted_at: -1 },
      })
      const [rows, total] = await Promise.all([
        Response.find(match)
          .populate("agent_id", "name email profile_data")
          .populate("assignment_id", "token pradhan_snapshot")
          .sort(sort).skip(skip).limit(limit).lean(),
        Response.countDocuments(match),
      ])
      return NextResponse.json({
        rows: rows.map((r: Record<string, unknown>) => ({
          _id: String(r._id),
          submitted_at: r.submitted_at,
          device: r.device,
          answers: r.answers || {},
          location: r.location || null,
          agent: r.agent_id || null,
          assignment: r.assignment_id || null,
        })),
        total,
        page: state.page,
        pageSize: state.pageSize,
        pageCount: Math.max(1, Math.ceil(total / state.pageSize)),
      })
    } catch (e) {
      console.error("[/api/responses dt] failed:", (e as Error).message)
      return NextResponse.json({ error: "dt_failed", detail: (e as Error).message }, { status: 500 })
    }
  }

  /* ─── Legacy path (back-compat) ───────────────────────────────── */
  const from = sp.get("from")
  const to = sp.get("to")
  const sortParam = sp.get("sort") || "-submitted_at"
  const page = Math.max(1, Number(sp.get("page")) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(sp.get("pageSize")) || DEFAULT_PAGE_SIZE))

  const match: Record<string, unknown> = { form_id: new Types.ObjectId(formId) }
  if (from || to) {
    const d: Record<string, Date> = {}
    if (from) d.$gte = new Date(from)
    if (to) d.$lte = new Date(to)
    match.submitted_at = d
  }

  // Field filters passed as `filter.<id>=value`
  for (const [key, value] of sp.entries()) {
    if (!key.startsWith("filter.")) continue
    const field = key.slice("filter.".length)
    if (!value) continue
    if (field === "__device") match.device = value
    else if (field === "__agent") {
      try { match.agent_id = new Types.ObjectId(value) } catch { /* ignore */ }
    } else {
      match[`answers.${field}`] = value
    }
  }

  const sortField = sortParam.replace(/^-/, "")
  const sortDir: 1 | -1 = sortParam.startsWith("-") ? -1 : 1
  const sort: Record<string, 1 | -1> = { [sortField]: sortDir }

  const [rows, total] = await Promise.all([
    Response.find(match)
      .populate("agent_id", "name email profile_data")
      .populate("assignment_id", "token pradhan_snapshot")
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Response.countDocuments(match),
  ])

  return NextResponse.json({
    rows: rows.map((r: Record<string, unknown>) => ({
      _id: String(r._id),
      submitted_at: r.submitted_at,
      device: r.device,
      answers: r.answers || {},
      location: r.location || null,
      agent: r.agent_id || null,
      assignment: r.assignment_id || null,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  })
}
