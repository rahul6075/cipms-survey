"use client"

import * as React from "react"
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  Clock,
  FileText,
  Hash,
  Image as ImageIcon,
  Landmark,
  List,
  Mail,
  MapPin,
  Phone,
  Share2,
  Star,
  ToggleLeft,
  Type,
} from "lucide-react"
import type { FieldType } from "@/shared/types"
import { cn } from "@/shared/lib/utils"

export type FieldTypeMeta = {
  label: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  group: "Basics" | "Choice" | "Media" | "Date & time" | "Identity"
}

export const FIELD_TYPE_META: Record<FieldType, FieldTypeMeta> = {
  short_text:   { label: "Short text",   desc: "Single-line", icon: Type,       group: "Basics" },
  long_text:    { label: "Long text",    desc: "Paragraph",   icon: AlignLeft,  group: "Basics" },
  number:       { label: "Number",       desc: "Age, count",  icon: Hash,       group: "Basics" },
  email:        { label: "Email",        desc: "Email",       icon: Mail,       group: "Basics" },
  phone:        { label: "Phone",        desc: "Mobile",      icon: Phone,      group: "Basics" },

  radio:        { label: "Single choice", desc: "Pick one",   icon: List,       group: "Choice" },
  checkbox:     { label: "Multi choice",  desc: "Pick many",  icon: CheckSquare, group: "Choice" },
  dropdown:     { label: "Dropdown",      desc: "Long list",  icon: ChevronDown, group: "Choice" },
  yes_no:       { label: "Yes / No",      desc: "Binary",     icon: ToggleLeft,  group: "Choice" },
  rating:       { label: "Rating",        desc: "1–5 stars",  icon: Star,        group: "Choice" },

  photo:        { label: "Photo",        desc: "Upload",      icon: ImageIcon,  group: "Media" },
  pdf:          { label: "PDF",          desc: "Upload",      icon: FileText,   group: "Media" },

  date:         { label: "Date",         desc: "Date picker", icon: Calendar,   group: "Date & time" },
  time:         { label: "Time",         desc: "Time picker", icon: Clock,      group: "Date & time" },

  social_media: { label: "Social media", desc: "Handles",     icon: Share2,     group: "Identity" },
  location:     { label: "Location",     desc: "GPS",         icon: MapPin,     group: "Identity" },
  constituency: { label: "Constituency", desc: "State · LS · VS · Block", icon: Landmark, group: "Identity" },
}

const GROUP_ORDER: FieldTypeMeta["group"][] = ["Basics", "Choice", "Date & time", "Media", "Identity"]

export function BuilderPalette({
  onAdd,
  compact,
}: {
  onAdd: (type: FieldType) => void
  compact?: boolean
}) {
  const grouped = React.useMemo(() => {
    const map = new Map<string, Array<{ type: FieldType; meta: FieldTypeMeta }>>()
    for (const [k, v] of Object.entries(FIELD_TYPE_META)) {
      ;(map.get(v.group) || map.set(v.group, []).get(v.group))!.push({ type: k as FieldType, meta: v })
    }
    return map
  }, [])

  return (
    <div className={cn("rounded-xl border border-border/60 bg-card", compact ? "" : "flex flex-col")}>
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Field types</p>
      </div>
      <div className={cn("space-y-3 p-2", compact ? "max-h-[320px] overflow-y-auto" : "")}>
        {GROUP_ORDER.map((g) => {
          const items = grouped.get(g)
          if (!items) return null
          return (
            <section key={g}>
              <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{g}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map(({ type, meta }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onAdd(type)}
                    className="group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-xs hover:border-border/60 hover:bg-muted/60"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted group-hover:bg-background">
                      <meta.icon className="h-3 w-3 text-foreground/70" />
                    </span>
                    <span className="truncate font-medium">{meta.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
