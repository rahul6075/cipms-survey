/**
 * Role-specific profile schemas.
 * Add a field here and it shows up in the user drawer + counts toward
 * profile completion. No component changes needed.
 */

export type ProfileFieldType = "text" | "tel" | "email" | "select" | "textarea" | "photo"

export type ProfileField = {
  key: string
  label: string
  type: ProfileFieldType
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  group?: string
}

export const ROLE_PROFILE_SCHEMA: Record<string, { title: string; fields: ProfileField[] }> = {
  agent: {
    title: "Gram Pradhan profile",
    fields: [
      { key: "photo", label: "Profile photo", type: "photo", group: "Identity" },
      { key: "phone", label: "Phone number", type: "tel", required: true, placeholder: "+91 ...", group: "Contact" },
      { key: "whatsapp", label: "WhatsApp number", type: "tel", placeholder: "+91 ...", group: "Contact" },
      { key: "state", label: "State", type: "text", required: true, group: "Jurisdiction" },
      { key: "district", label: "District", type: "text", required: true, group: "Jurisdiction" },
      { key: "block", label: "Block", type: "text", group: "Jurisdiction" },
      { key: "panchayat", label: "Gram Panchayat", type: "text", required: true, group: "Jurisdiction" },
      {
        key: "party",
        label: "Party affiliation",
        type: "select",
        group: "Political",
        options: [
          { value: "bjp", label: "BJP" },
          { value: "inc", label: "INC" },
          { value: "sp", label: "SP" },
          { value: "bsp", label: "BSP" },
          { value: "aap", label: "AAP" },
          { value: "independent", label: "Independent" },
          { value: "other", label: "Other" },
        ],
      },
      { key: "tenure_start", label: "Tenure started", type: "text", placeholder: "YYYY-MM", group: "Political" },
      { key: "languages", label: "Languages spoken", type: "text", placeholder: "Hindi, Awadhi", group: "Other" },
      { key: "notes", label: "Notes", type: "textarea", group: "Other" },
    ],
  },
  admin: {
    title: "Admin profile",
    fields: [
      { key: "photo", label: "Profile photo", type: "photo", group: "Identity" },
      { key: "phone", label: "Phone number", type: "tel", required: true, group: "Contact" },
      { key: "department", label: "Department / team", type: "text", group: "Role" },
      { key: "region", label: "Region responsible for", type: "text", group: "Role" },
    ],
  },
  super_admin: {
    title: "Super Admin profile",
    fields: [
      { key: "photo", label: "Profile photo", type: "photo", group: "Identity" },
      { key: "phone", label: "Phone number", type: "tel", group: "Contact" },
    ],
  },
}

export function computeProfile(role: string, data: Record<string, unknown> | null | undefined) {
  const schema = ROLE_PROFILE_SCHEMA[role]
  if (!schema) return { percent: 0, complete: false, missing: [] as string[] }
  const required = schema.fields.filter((f) => f.required)
  if (required.length === 0) return { percent: 100, complete: true, missing: [] }
  const d = data || {}
  const filled = required.filter((f) => {
    const v = (d as Record<string, unknown>)[f.key]
    return v !== undefined && v !== null && String(v).trim() !== ""
  })
  const percent = Math.round((filled.length / required.length) * 100)
  return {
    percent,
    complete: filled.length === required.length,
    missing: required.filter((f) => !filled.includes(f)).map((f) => f.key),
  }
}
