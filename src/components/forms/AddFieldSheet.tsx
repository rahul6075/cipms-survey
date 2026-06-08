"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X, Type, Hash, Mail, Phone, List, CheckSquare, ToggleLeft, Calendar, Star, Image, FileText, MapPin, AlignLeft, ChevronDown, Clock, Share2, Landmark } from "lucide-react"
import type { FieldType } from "@/types"

const CATEGORIES = [
  {
    label: "Text",
    color: "text-blue-600",
    bg: "bg-blue-50",
    fields: [
      { type: "short_text" as FieldType, label: "Short Text",  icon: Type,      desc: "Name, village, single line" },
      { type: "long_text"  as FieldType, label: "Long Text",   icon: AlignLeft, desc: "Feedback, multi-line answer" },
      { type: "number"     as FieldType, label: "Number",      icon: Hash,      desc: "Age, count, quantity" },
      { type: "email"      as FieldType, label: "Email",       icon: Mail,      desc: "Email address" },
      { type: "phone"      as FieldType, label: "Phone",       icon: Phone,     desc: "Mobile number" },
    ],
  },
  {
    label: "Choice",
    color: "text-orange-600",
    bg: "bg-orange-50",
    fields: [
      { type: "radio"    as FieldType, label: "Single Choice",  icon: List,        desc: "Pick one from options" },
      { type: "checkbox" as FieldType, label: "Multi Choice",   icon: CheckSquare, desc: "Pick multiple options" },
      { type: "dropdown" as FieldType, label: "Dropdown",       icon: ChevronDown, desc: "Select from long list" },
      { type: "yes_no"   as FieldType, label: "Yes / No",       icon: ToggleLeft,  desc: "Simple binary question" },
    ],
  },
  {
    label: "Date & Scale",
    color: "text-rose-600",
    bg: "bg-rose-50",
    fields: [
      { type: "date"   as FieldType, label: "Date",   icon: Calendar, desc: "Date picker" },
      { type: "time"   as FieldType, label: "Time",   icon: Clock,    desc: "Time picker" },
      { type: "rating" as FieldType, label: "Rating", icon: Star,     desc: "1–5 star rating" },
    ],
  },
  {
    label: "Upload & Location",
    color: "text-violet-600",
    bg: "bg-violet-50",
    fields: [
      { type: "photo"    as FieldType, label: "Photo",    icon: Image,    desc: "Camera or gallery upload" },
      { type: "pdf"      as FieldType, label: "PDF",      icon: FileText, desc: "Document upload" },
      { type: "location" as FieldType, label: "Location", icon: MapPin,   desc: "GPS coordinates" },
    ],
  },
  {
    label: "Social & Contact",
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
    fields: [
      { type: "social_media"  as FieldType, label: "Social Media",  icon: Share2,   desc: "Instagram, Facebook, Twitter…" },
    ],
  },
  {
    label: "Political",
    color: "text-orange-700",
    bg: "bg-orange-50",
    fields: [
      { type: "constituency" as FieldType, label: "Constituency",  icon: Landmark, desc: "State, Lok Sabha & Vidhan Sabha" },
    ],
  },
]

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (type: FieldType) => void
}

export function AddFieldSheet({ open, onClose, onAdd }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">Add a field</h3>
                <p className="text-xs text-gray-400 mt-0.5">Choose what type of question to add</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Categories */}
            <div className="px-5 py-4 space-y-5 pb-8">
              {CATEGORIES.map((cat) => (
                <div key={cat.label}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2.5 ${cat.color}`}>
                    {cat.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.fields.map((f) => {
                      const Icon = f.icon
                      return (
                        <motion.button
                          key={f.type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { onAdd(f.type); onClose() }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-orange-200 hover:shadow-sm text-left transition-all group"
                        >
                          <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0 transition-colors`}>
                            <Icon className={`w-4 h-4 ${cat.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900 leading-none">{f.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{f.desc}</p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
