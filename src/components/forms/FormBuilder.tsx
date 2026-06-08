"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { v4 as uuid } from "uuid"
import { Plus, Save, Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { FieldCard } from "./FieldCard"
import { AddFieldSheet } from "./AddFieldSheet"
import { PhonePreview } from "./PhonePreview"
import type { FormField, FieldType } from "@/types"

export function FormBuilder({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [status, setStatus] = useState(initialData?.status || "draft")
  const [requireConsent, setRequireConsent] = useState<boolean>(initialData?.require_consent ?? false)
  const [fields, setFields] = useState<FormField[]>(initialData?.fields || [])
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [showSheet, setShowSheet] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: uuid(),
      label: "",
      type,
      required: false,
      placeholder: "",
      options: ["radio", "checkbox", "dropdown"].includes(type) ? ["Option 1", "Option 2"] : [],
      platforms: type === "social_media" ? ["instagram", "facebook", "whatsapp"] : undefined,
      constituency_config: type === "constituency"
        ? { show_state: true, show_ls: true, show_vs: true }
        : undefined,
      order: fields.length,
    }
    setFields((prev) => [...prev, newField])
    setActiveFieldId(newField.id)
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
    if (activeFieldId === id) setActiveFieldId(null)
  }

  const moveField = (id: string, dir: "up" | "down") => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === id)
      if (idx === -1) return prev
      const next = [...prev]
      const swapIdx = dir === "up" ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= next.length) return prev
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Form title is required"); return }
    setSaving(true)
    const method = initialData ? "PUT" : "POST"
    const url = initialData ? `/api/forms/${initialData._id}` : "/api/forms"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, status, fields, require_consent: requireConsent }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success(initialData ? "Form updated!" : "Form created!")
      router.push("/dashboard/forms")
    } else {
      toast.error("Failed to save form")
    }
  }

  return (
    <div className="flex flex-col h-full -m-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between gap-4 max-w-[1400px] mx-auto">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/dashboard/forms")}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Survey Form"
                className="text-base font-semibold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 w-full min-w-[200px] truncate"
              />
              <p className="text-xs text-gray-400 leading-none mt-0.5">
                {fields.length} field{fields.length !== 1 ? "s" : ""} · {initialData ? "Editing" : "New form"}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Preview toggle — mobile */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="lg:hidden flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:border-gray-300 transition-all"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              Preview
            </button>

            {/* Status */}
            <Select value={status} onValueChange={(v) => setStatus(v ?? "draft")}>
              <SelectTrigger className={`h-9 w-28 text-xs font-medium rounded-xl border transition-all ${
                status === "active" ? "border-emerald-300 text-emerald-700 bg-emerald-50" :
                status === "closed" ? "border-red-300 text-red-600 bg-red-50" :
                "border-gray-200 text-gray-500 bg-gray-50"
              }`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <span className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />Draft
                  </span>
                </SelectItem>
                <SelectItem value="active">
                  <span className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />Active
                  </span>
                </SelectItem>
                <SelectItem value="closed">
                  <span className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-red-500" />Closed
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Save */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-[0_2px_8px_rgba(249,115,22,0.25)] hover:shadow-[0_4px_16px_rgba(249,115,22,0.35)] disabled:opacity-60 transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Split Body */}
      <div className="flex flex-1 overflow-hidden max-w-[1400px] mx-auto w-full">

        {/* LEFT — Builder */}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-w-0">
          <div className="max-w-[620px] mx-auto space-y-4">

            {/* Form meta */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Form title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Village Survey 2026 — Lucknow West"
                  className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 leading-snug"
                />
              </div>
              <div className="h-px bg-gray-100" />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly explain what this survey is about..."
                  rows={2}
                  className="w-full text-sm text-gray-600 bg-transparent border-none outline-none placeholder-gray-300 resize-none leading-relaxed"
                />
              </div>

              <div className="h-px bg-gray-100" />

              {/* Consent toggle */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${requireConsent ? "bg-green-50" : "bg-gray-50"}`}>
                    <ShieldCheck className={`w-4 h-4 transition-colors ${requireConsent ? "text-green-500" : "text-gray-300"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 leading-none">Require Consent</p>
                    <p className="text-xs text-gray-400 mt-0.5">Show legal consent checkbox — form won't submit without it</p>
                  </div>
                </div>
                <Switch
                  checked={requireConsent}
                  onCheckedChange={setRequireConsent}
                />
              </div>
            </motion.div>

            {/* Fields */}
            <div className="space-y-2">
              {fields.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-orange-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">No fields yet</p>
                  <p className="text-xs text-gray-400">Click "Add Field" below to start building your survey</p>
                </motion.div>
              )}

              <AnimatePresence mode="popLayout">
                {fields.map((field, idx) => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    index={idx}
                    total={fields.length}
                    isActive={activeFieldId === field.id}
                    onToggle={() => setActiveFieldId(activeFieldId === field.id ? null : field.id)}
                    onUpdate={(updates) => updateField(field.id, updates)}
                    onRemove={() => removeField(field.id)}
                    onMoveUp={() => moveField(field.id, "up")}
                    onMoveDown={() => moveField(field.id, "down")}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Add Field button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowSheet(true)}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </motion.button>

            {/* Bottom padding */}
            <div className="h-16" />
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div className={`shrink-0 border-l border-gray-100 bg-gray-50/50 overflow-y-auto px-6 py-6 transition-all duration-300 ${showPreview ? "w-[360px]" : "w-0 px-0 overflow-hidden"} hidden lg:block`}>
          <PhonePreview title={title} description={description} fields={fields} />
        </div>

        {/* Mobile preview overlay */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              className="lg:hidden fixed inset-0 z-20 bg-gray-50 overflow-y-auto px-4 py-6"
            >
              <button
                onClick={() => setShowPreview(false)}
                className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" /> Back to builder
              </button>
              <PhonePreview title={title} description={description} fields={fields} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Field type sheet */}
      <AddFieldSheet open={showSheet} onClose={() => setShowSheet(false)} onAdd={addField} />
    </div>
  )
}
