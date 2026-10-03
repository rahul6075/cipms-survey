import { Types } from "mongoose"
import type { Session } from "next-auth"
import Form from "@/modules/survey/models/Form"

export type ReportForm = {
  _id: unknown
  title: string
  status: string
  created_by: unknown
  fields: Array<{ id: string; label: string; type: string; options?: string[] }>
}

export type ScopeInput = {
  from?: string | null
  to?: string | null
  filters?: Record<string, string | number | boolean | null>
}

/** Loads a form for reporting, enforcing that admins only see their own forms. */
export async function loadReportForm(
  session: Session,
  formId: string,
): Promise<{ form: ReportForm } | { error: string; status: number }> {
  if (!Types.ObjectId.isValid(formId)) return { error: "Invalid formId", status: 400 }
  const form = await Form.findById(formId).select("title status created_by fields").lean<ReportForm>()
  if (!form) return { error: "Form not found", status: 404 }
  if (session.user.role !== "super_admin" && String(form.created_by) !== session.user.id)
    return { error: "Forbidden", status: 403 }
  return { form }
}

/** $match for responses of `form` within the workbench date range + cross-filters. */
export function buildScopeMatch(form: ReportForm, scope: ScopeInput): Record<string, unknown> {
  const match: Record<string, unknown> = { form_id: new Types.ObjectId(String(form._id)) }
  if (scope.from || scope.to) {
    const range: Record<string, Date> = {}
    if (scope.from) range.$gte = new Date(scope.from)
    if (scope.to) range.$lte = new Date(scope.to)
    match.submitted_at = range
  }
  const fieldIds = new Set(form.fields.map((f) => f.id))
  for (const [key, value] of Object.entries(scope.filters || {})) {
    if (value === null || value === "") continue
    if (key === "__device") match.device = value
    else if (key === "__agent") {
      if (Types.ObjectId.isValid(String(value))) match.agent_id = new Types.ObjectId(String(value))
    } else if (fieldIds.has(key)) match[`answers.${key}`] = matchValue(value)
  }
  return match
}

// Breakdowns group on trimmed text, so a filter on "थरौली" must also match "थरौली ".
function matchValue(value: string | number | boolean) {
  if (typeof value !== "string") return value
  const escaped = value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return { $regex: `^\\s*${escaped}\\s*$` }
}
