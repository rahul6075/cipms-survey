export type Role = "super_admin" | "admin" | "agent"

export type FieldType =
  | "short_text" | "long_text" | "number" | "email" | "phone"
  | "radio" | "checkbox" | "dropdown" | "yes_no"
  | "date" | "time" | "rating" | "photo" | "pdf" | "location"
  | "social_media" | "constituency"

export type SocialPlatform =
  | "instagram" | "facebook" | "twitter" | "youtube"
  | "whatsapp" | "linkedin" | "telegram" | "koo"

export interface FormField {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  options?: string[]
  platforms?: SocialPlatform[]   // for social_media fields
  constituency_config?: {        // for constituency fields
    show_state: boolean
    show_ls: boolean
    show_vs: boolean
  }
  maxFiles?: number
  order: number
}

export interface Constituency {
  lok_sabha_name: string
  lok_sabha_no: number
  vidhan_sabha_name: string
  vidhan_sabha_no: number
  state: string
}

export interface IForm {
  _id: string
  title: string
  description: string
  created_by: string
  status: "draft" | "active" | "closed"
  access_type: "public" | "private" | "restricted"
  constituency: Partial<Constituency>
  fields: FormField[]
  require_consent: boolean
  created_at: string
  updated_at: string
}

export interface IAssignment {
  _id: string
  form_id: string
  agent_id: { _id: string; name: string; email: string }
  token: string
  village: string
  status: "active" | "expired" | "revoked"
  total_submissions: number
  assigned_at: string
}

export interface IResponse {
  _id: string
  form_id: string
  assignment_id: string
  agent_id: string
  constituency: Partial<Constituency>
  submitter_info: { name?: string; phone?: string; village?: string }
  answers: Record<string, any>
  location?: { lat: number; lng: number }
  submitted_at: string
}

declare module "next-auth" {
  interface User { role: string }
  interface Session { user: { id: string; role: string; name: string; email: string } }
}
