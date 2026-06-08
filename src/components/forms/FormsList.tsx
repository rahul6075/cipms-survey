"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, FileText, Users, Eye, Pencil, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const STATUS_META: Record<string, { label: string; classes: string; dot: string }> = {
  draft:  { label: "Draft",  classes: "bg-gray-100 text-gray-600",   dot: "bg-gray-400" },
  active: { label: "Active", classes: "bg-green-100 text-green-700", dot: "bg-green-500" },
  closed: { label: "Closed", classes: "bg-red-100 text-red-600",     dot: "bg-red-400" },
}

interface Props { forms: any[]; role: string }

function DeleteModal({ form, onClose, onConfirm }: {
  form: any; onClose: () => void; onConfirm: () => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const handleConfirm = async () => { setDeleting(true); await onConfirm(); setDeleting(false) }

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !deleting) onClose() }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <div className="bg-red-50 border-b border-red-100 px-6 pt-6 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <DialogHeader className="p-0 space-y-1">
              <DialogTitle className="text-base font-bold text-gray-900 text-left">Delete this form?</DialogTitle>
              <p className="text-sm text-gray-500 text-left leading-relaxed">
                <span className="font-semibold text-gray-800">"{form.title}"</span> will be hidden from your dashboard and its public links will stop working.
              </p>
            </DialogHeader>
          </div>
        </div>
        <div className="px-6 py-4 bg-white">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <span className="text-amber-500 mt-0.5 text-sm">ℹ</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              This is a <strong>soft delete</strong> — no data is lost. All responses and assignments remain in the database and can be restored if needed.
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 h-10 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {deleting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
              : <><Trash2 className="w-4 h-4" /> Delete form</>}
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FormCard({ form, role, onDelete }: { form: any; role: string; onDelete: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const status = STATUS_META[form.status] || STATUS_META.draft

  const handleDelete = async () => {
    const res = await fetch(`/api/forms/${form._id}`, { method: "DELETE" })
    if (res.ok) {
      setShowConfirm(false)
      onDelete()
      toast.success(`"${form.title}" deleted`)
    } else {
      toast.error("Failed to delete form")
    }
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
      >
        <div className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center shrink-0 transition-colors">
            <FileText className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate text-sm">{form.title}</h3>
              <span className={cn("inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-semibold", status.classes)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{form.description || "No description"}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-[11px] text-gray-400">{form.fields?.length || 0} fields</span>
              <span className="text-gray-200">·</span>
              <span className="text-[11px] text-gray-400">
                {new Date(form.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              {role === "super_admin" && form.created_by?.name && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-[11px] text-gray-400">by {form.created_by.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link href={`/dashboard/forms/${form._id}/assign`}>
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
                <Users className="w-3.5 h-3.5" /> Assign
              </button>
            </Link>
            <Link href={`/dashboard/forms/${form._id}/responses`}>
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
                <Eye className="w-3.5 h-3.5" /> Responses
              </button>
            </Link>
            <Link href={`/dashboard/forms/${form._id}/edit`}>
              <button className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </Link>
            <button
              onClick={() => setShowConfirm(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-300 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {showConfirm && (
        <DeleteModal
          form={form}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  )
}

export function FormsList({ forms, role }: Props) {
  const [localForms, setLocalForms] = useState(forms)
  const removeForm = (id: string) => setLocalForms(prev => prev.filter(f => f._id !== id))

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Forms</h1>
          <p className="text-gray-400 text-sm mt-1">
            {localForms.length} form{localForms.length !== 1 ? "s" : ""} · {localForms.filter(f => f.status === "active").length} active
          </p>
        </div>
        <Link href="/dashboard/forms/new">
          <motion.button whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-[0_2px_10px_rgba(249,115,22,0.3)] transition-all">
            <Plus className="w-4 h-4" /> New Form
          </motion.button>
        </Link>
      </motion.div>

      {localForms.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-orange-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">No forms yet</h3>
          <p className="text-sm text-gray-400 mb-6">Create your first survey form to get started</p>
          <Link href="/dashboard/forms/new">
            <motion.button whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" /> Create Form
            </motion.button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {localForms.map((form) => (
              <FormCard key={form._id} form={form} role={role} onDelete={() => removeForm(form._id)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
