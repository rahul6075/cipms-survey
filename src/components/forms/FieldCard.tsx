"use client"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Trash2, ChevronUp, ChevronDown as ArrowDown, Type, Hash, Mail, Phone, List, CheckSquare, ToggleLeft, Calendar, Star, Image, FileText, MapPin, AlignLeft, Clock, Share2, Landmark } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { FormField, FieldType, SocialPlatform } from "@/types"

const FIELD_META: Record<FieldType, { label: string; icon: any; color: string; bg: string }> = {
  short_text:  { label: "Short Text",      icon: Type,        color: "text-blue-500",    bg: "bg-blue-50" },
  long_text:   { label: "Long Text",       icon: AlignLeft,   color: "text-indigo-500",  bg: "bg-indigo-50" },
  number:      { label: "Number",          icon: Hash,        color: "text-violet-500",  bg: "bg-violet-50" },
  email:       { label: "Email",           icon: Mail,        color: "text-cyan-500",    bg: "bg-cyan-50" },
  phone:       { label: "Phone",           icon: Phone,       color: "text-teal-500",    bg: "bg-teal-50" },
  radio:       { label: "Single Choice",   icon: List,        color: "text-orange-500",  bg: "bg-orange-50" },
  checkbox:    { label: "Multi Choice",    icon: CheckSquare, color: "text-amber-500",   bg: "bg-amber-50" },
  dropdown:    { label: "Dropdown",        icon: ChevronDown, color: "text-yellow-600",  bg: "bg-yellow-50" },
  yes_no:      { label: "Yes / No",        icon: ToggleLeft,  color: "text-green-500",   bg: "bg-green-50" },
  date:        { label: "Date",            icon: Calendar,    color: "text-rose-500",    bg: "bg-rose-50" },
  time:        { label: "Time",            icon: Clock,       color: "text-sky-500",     bg: "bg-sky-50" },
  rating:      { label: "Rating",          icon: Star,        color: "text-orange-400",  bg: "bg-orange-50" },
  photo:       { label: "Photo",           icon: Image,       color: "text-pink-500",    bg: "bg-pink-50" },
  pdf:         { label: "PDF",             icon: FileText,    color: "text-red-500",     bg: "bg-red-50" },
  location:    { label: "Location",        icon: MapPin,      color: "text-emerald-500", bg: "bg-emerald-50" },
  social_media: { label: "Social Media",   icon: Share2,      color: "text-fuchsia-500", bg: "bg-fuchsia-50" },
  constituency: { label: "Constituency",   icon: Landmark,    color: "text-saffron-500", bg: "bg-orange-50" },
}

interface Props {
  field: FormField
  index: number
  total: number
  isActive: boolean
  onToggle: () => void
  onUpdate: (updates: Partial<FormField>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

const ALL_PLATFORMS: { id: SocialPlatform; label: string; color: string; placeholder: string }[] = [
  { id: "instagram",  label: "Instagram",  color: "#E1306C", placeholder: "@username" },
  { id: "facebook",   label: "Facebook",   color: "#1877F2", placeholder: "facebook.com/page" },
  { id: "twitter",    label: "X (Twitter)",color: "#000000", placeholder: "@handle" },
  { id: "youtube",    label: "YouTube",    color: "#FF0000", placeholder: "youtube.com/channel" },
  { id: "whatsapp",   label: "WhatsApp",   color: "#25D366", placeholder: "+91 XXXXX XXXXX" },
  { id: "linkedin",   label: "LinkedIn",   color: "#0A66C2", placeholder: "linkedin.com/in/name" },
  { id: "telegram",   label: "Telegram",   color: "#229ED9", placeholder: "@username" },
  { id: "koo",        label: "Koo",        color: "#F7C948", placeholder: "@handle" },
]

export function FieldCard({ field, index, total, isActive, onToggle, onUpdate, onRemove, onMoveUp, onMoveDown }: Props) {
  const meta = FIELD_META[field.type] || FIELD_META.short_text
  const Icon = meta.icon
  const hasOptions = ["radio", "checkbox", "dropdown"].includes(field.type)
  const hasPlaceholder = ["short_text", "long_text", "number", "email", "phone"].includes(field.type)
  const isSocial = field.type === "social_media"
  const isConstituency = field.type === "constituency"

  const togglePlatform = (pid: SocialPlatform) => {
    const cur = field.platforms || []
    const next = cur.includes(pid) ? cur.filter(p => p !== pid) : [...cur, pid]
    onUpdate({ platforms: next })
  }

  const addOption = () => {
    onUpdate({ options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })
  }
  const updateOption = (i: number, val: string) => {
    const opts = [...(field.options || [])]
    opts[i] = val
    onUpdate({ options: opts })
  }
  const removeOption = (i: number) => {
    onUpdate({ options: (field.options || []).filter((_, idx) => idx !== i) })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
      className={cn(
        "rounded-2xl border transition-all duration-200 overflow-hidden",
        isActive
          ? "border-orange-300 shadow-[0_0_0_3px_rgba(249,115,22,0.1)] bg-white"
          : "border-gray-100 bg-white hover:border-gray-200 shadow-sm"
      )}
    >
      {/* Header — always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Active left bar */}
        {isActive && (
          <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-orange-500" />
        )}

        {/* Type icon */}
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", meta.bg)}>
          <Icon className={cn("w-4 h-4", meta.color)} />
        </div>

        {/* Label + type */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", isActive ? "text-gray-900" : "text-gray-700")}>
            {field.label || "Untitled field"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{meta.label} {field.required && "· Required"}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-0 transition-all"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-0 transition-all"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className={cn("w-5 h-5 flex items-center justify-center rounded-md transition-transform duration-200 text-gray-400", isActive && "rotate-180")}>
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Body — expanded editing area */}
      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
              {/* Label */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Question label</label>
                <input
                  value={field.label}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  placeholder="Type your question here..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                />
              </div>

              {/* Placeholder */}
              {hasPlaceholder && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Placeholder text</label>
                  <input
                    value={field.placeholder || ""}
                    onChange={(e) => onUpdate({ placeholder: e.target.value })}
                    placeholder="e.g. Enter your village name..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                  />
                </div>
              )}

              {/* Options */}
              {hasOptions && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Options</label>
                  <div className="space-y-1.5">
                    {(field.options || []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                        <input
                          value={opt}
                          onChange={(e) => updateOption(i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                        />
                        {(field.options?.length || 0) > 1 && (
                          <button
                            onClick={() => removeOption(i)}
                            className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addOption}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium px-1 py-0.5 flex items-center gap-1 transition-colors"
                    >
                      + Add option
                    </button>
                  </div>
                </div>
              )}

              {/* Social platform picker */}
              {isSocial && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Platforms to collect</label>
                    <button
                      onClick={() => onUpdate({ platforms: field.platforms?.length === ALL_PLATFORMS.length ? [] : ALL_PLATFORMS.map(p => p.id) })}
                      className="text-[10px] text-orange-500 hover:text-orange-600 font-medium transition-colors"
                    >
                      {field.platforms?.length === ALL_PLATFORMS.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ALL_PLATFORMS.map((p) => {
                      const active = (field.platforms || []).includes(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlatform(p.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-medium text-left transition-all",
                            active ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                          )}
                        >
                          <span
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{ backgroundColor: active ? p.color : "#d1d5db" }}
                          />
                          {p.label}
                          {active && (
                            <svg className="w-2.5 h-2.5 ml-auto shrink-0 text-orange-500" fill="none" viewBox="0 0 10 8">
                              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {(!field.platforms || field.platforms.length === 0) && (
                    <p className="text-xs text-amber-500">Select at least one platform</p>
                  )}
                </div>
              )}

              {/* Constituency sub-field config */}
              {isConstituency && (() => {
                const cfg = field.constituency_config || { show_state: true, show_ls: true, show_vs: true }
                const toggle = (key: keyof typeof cfg) =>
                  onUpdate({ constituency_config: { ...cfg, [key]: !cfg[key] } })
                const FIELDS: { key: keyof typeof cfg; label: string; hint: string }[] = [
                  { key: "show_state", label: "State",         hint: "36 states & UTs" },
                  { key: "show_ls",    label: "Lok Sabha",     hint: "No. + name (1-543)" },
                  { key: "show_vs",    label: "Vidhan Sabha",  hint: "No. + name (state-wise)" },
                ]
                return (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sub-fields to collect</label>
                    <div className="space-y-1.5">
                      {FIELDS.map(f => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => toggle(f.key)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-xl border-2 text-sm transition-all",
                            cfg[f.key]
                              ? "border-orange-400 bg-orange-50 text-orange-700"
                              : "border-gray-200 text-gray-400"
                          )}
                        >
                          <span className="font-medium">{f.label}</span>
                          <span className="text-xs opacity-70">{f.hint}</span>
                        </button>
                      ))}
                    </div>
                    {!cfg.show_state && !cfg.show_ls && !cfg.show_vs && (
                      <p className="text-xs text-amber-500">Enable at least one sub-field</p>
                    )}
                  </div>
                )
              })()}

              {/* Required toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">Required field</p>
                  <p className="text-xs text-gray-400">Villager must answer this</p>
                </div>
                <Switch
                  checked={field.required}
                  onCheckedChange={(v) => onUpdate({ required: v })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
