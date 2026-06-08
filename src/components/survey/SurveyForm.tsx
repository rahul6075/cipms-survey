"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Vote, Loader2, CheckCircle, WifiOff, ShieldCheck } from "lucide-react"
import { SurveyFieldRenderer } from "@/components/forms/SurveyPreviewRenderer"
import type { IForm } from "@/types"

interface Props { token: string }

const DRAFT_KEY = (token: string) => `cipms_draft_${token}`

export function SurveyForm({ token }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState<IForm | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [consentGiven, setConsentGiven] = useState(false)
  const [consentShake, setConsentShake] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [offline, setOffline] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  // Online / offline detection
  useEffect(() => {
    setMounted(true)
    setOffline(!navigator.onLine)
    const up = () => setOffline(false)
    const down = () => setOffline(true)
    window.addEventListener("online", up)
    window.addEventListener("offline", down)
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down) }
  }, [])

  // Load form + restore draft
  useEffect(() => {
    fetch(`/api/survey/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setForm(data.form)

        // Restore draft from localStorage
        try {
          const saved = localStorage.getItem(DRAFT_KEY(token))
          if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed.answers && Object.keys(parsed.answers).length > 0) {
              setAnswers(parsed.answers)
              setDraftRestored(true)
            }
          }
        } catch { /* ignore */ }

        setLoading(false)
      })
      .catch(() => { setError("Could not load form. Please check your connection."); setLoading(false) })
  }, [token])

  // Persist draft to localStorage on every answer change
  useEffect(() => {
    if (!form || Object.keys(answers).length === 0) return
    try {
      localStorage.setItem(DRAFT_KEY(token), JSON.stringify({ answers, savedAt: Date.now() }))
    } catch { /* ignore quota errors */ }
  }, [answers, form, token])

  const setAnswer = (id: string, value: any) =>
    setAnswers((prev) => ({ ...prev, [id]: value }))

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY(token)) } catch { /* ignore */ }
  }

  const handleSubmit = async () => {
    if (!form) return

    // Required fields check
    const missing = form.fields.filter((f) => f.required && !answers[f.id])
    if (missing.length > 0) {
      toast.error(`Please answer: ${missing.map((f) => f.label || "a required field").join(", ")}`)
      return
    }

    // Consent check (only if form requires it)
    if (form.require_consent && !consentGiven) {
      setConsentShake(true)
      setTimeout(() => setConsentShake(false), 600)
      toast.error("Please accept the consent declaration before submitting.")
      // Scroll to consent
      document.getElementById("consent-block")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setSubmitting(true)
    const device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
    const res = await fetch(`/api/survey/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, device }),
    })
    setSubmitting(false)
    if (res.ok) {
      clearDraft()
      setSubmitted(true)
    } else {
      toast.error("Submission failed. Please try again.")
    }
  }

  // Progress
  const totalFields = form?.fields.length || 0
  const answeredAll = form?.fields.filter((f) => {
    const v = answers[f.id]
    return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
  }).length || 0
  const requiredFields = form?.fields.filter((f) => f.required) || []
  const answeredRequired = requiredFields.filter((f) => {
    const v = answers[f.id]
    return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
  })
  const progress = totalFields > 0 ? Math.round((answeredAll / totalFields) * 100) : 0
  const canSubmit = answeredRequired.length === requiredFields.length && (!form?.require_consent || consentGiven)

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
        <Vote className="w-6 h-6 text-white" />
      </div>
      <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
      <p className="text-sm text-gray-400">Loading your survey...</p>
    </div>
  )

  // ── Error ──
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Survey Unavailable</h2>
      <p className="text-sm text-gray-400 max-w-xs">{error}</p>
    </div>
  )

  // ── Success ──
  if (submitted) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 shadow-[0_8px_32px_rgba(34,197,94,0.25)]"
      >
        <CheckCircle className="w-10 h-10 text-green-500" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dhanyavaad! 🙏</h2>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">Your response has been recorded. Thank you for participating in this survey.</p>
        <p className="text-xs text-gray-300 mt-6">Powered by CIPMS Platform</p>
      </motion.div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Offline banner */}
      <AnimatePresence>
        {mounted && offline && (
          <motion.div
            initial={{ y: -40 }} animate={{ y: 0 }} exit={{ y: -40 }}
            className="bg-amber-500 text-white text-xs text-center py-2 px-4 flex items-center justify-center gap-2 font-medium"
          >
            <WifiOff className="w-3 h-3" /> You're offline — your answers are auto-saved and will sync when you reconnect
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draft restored banner */}
      <AnimatePresence>
        {draftRestored && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center justify-between gap-3 max-w-lg mx-auto"
          >
            <p className="text-xs text-blue-700 font-medium">
              ✏️ Your previous answers have been restored automatically.
            </p>
            <button
              onClick={() => { setAnswers({}); setDraftRestored(false); clearDraft() }}
              className="text-[10px] text-blue-500 hover:text-blue-700 underline shrink-0 transition-colors"
            >
              Clear & start over
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draft preview mode */}
      {form?.status === "draft" && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-center">
          <p className="text-xs text-amber-700 font-medium">Preview mode — this form is not yet active</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(249,115,22,0.3)]">
            <Vote className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate leading-none">{form?.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">CIPMS Survey</p>
          </div>
          {totalFields > 0 && (
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-orange-500">{progress}%</p>
              <p className="text-[10px] text-gray-400">{answeredAll}/{totalFields}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {totalFields > 0 && (
          <div className="h-0.5 bg-gray-100 max-w-lg mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        )}
      </div>

      {/* Form fields */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-3 pb-40">
        {form?.description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4"
          >
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{form.description}</p>
          </motion.div>
        )}

        {form?.fields.map((field, idx) => {
          const isAnswered = (() => {
            const v = answers[field.id]
            return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
          })()

          return (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.4) }}
            >
              <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all duration-200
                ${isAnswered ? "border-orange-200" : "border-transparent"}`}
              >
                {/* Field number + label */}
                <div className="flex items-center gap-2 px-4 pt-3.5 pb-0">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 transition-all
                    ${isAnswered ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                    {isAnswered ? (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 8">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : idx + 1}
                  </span>
                  <label className="text-sm font-semibold text-gray-900 leading-snug flex-1">
                    {field.label || `Question ${idx + 1}`}
                    {field.required && <span className="text-red-400 ml-0.5 font-normal">*</span>}
                  </label>
                </div>

                <div className="px-4 pt-2.5 pb-4">
                  <SurveyFieldRenderer
                    field={field}
                    value={answers[field.id]}
                    onChange={(v) => setAnswer(field.id, v)}
                  />
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* ── Consent block — only when form.require_consent is enabled ── */}
        {form?.require_consent && <motion.div
          id="consent-block"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            animate={consentShake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-2xl border-2 shadow-sm transition-all duration-200 overflow-hidden
              ${consentGiven
                ? "border-green-300 bg-green-50"
                : consentShake
                  ? "border-red-400 bg-red-50"
                  : "border-orange-200 bg-orange-50/60"
              }`}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-black/5">
              <ShieldCheck className={`w-5 h-5 shrink-0 ${consentGiven ? "text-green-500" : "text-orange-500"}`} />
              <p className="text-sm font-semibold text-gray-900">Consent Declaration</p>
              <span className="text-red-400 text-sm ml-0.5">*</span>
            </div>

            {/* Legal text */}
            <div className="px-4 py-3 space-y-2 text-xs text-gray-600 leading-relaxed">
              <p>
                यह सर्वेक्षण <strong>CIPMS (Complete Indian Political Management System)</strong> द्वारा आयोजित है।
                फॉर्म भरकर आप निम्नलिखित से सहमत होते हैं:
              </p>
              <ul className="space-y-1 pl-3 list-disc text-gray-500">
                <li>मेरे द्वारा प्रदान की गई जानकारी सत्य एवं सही है।</li>
                <li>मैं स्वेच्छा से इस सर्वेक्षण में भाग ले रहा/रही हूँ।</li>
                <li>मेरा डेटा <strong>राजनीतिक अनुसंधान एवं विपणन (Marketing)</strong> उद्देश्यों हेतु उपयोग किया जाएगा।</li>
                <li>मेरी व्यक्तिगत जानकारी किसी तीसरे पक्ष के साथ साझा नहीं की जाएगी।</li>
              </ul>
              <p className="text-gray-400 text-[10px] pt-1">
                This survey is governed by the Information Technology Act, 2000 and applicable data protection
                guidelines. Data may be used for <strong>political research and marketing purposes only</strong>.
                Participation is entirely voluntary. Submitting this form constitutes your informed consent.
              </p>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 px-4 pb-4 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                  ${consentGiven
                    ? "bg-green-500 border-green-500"
                    : "bg-white border-gray-300 group-hover:border-orange-400"
                  }`}
                >
                  {consentGiven && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 10 8">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className={`text-sm font-medium leading-snug transition-colors
                ${consentGiven ? "text-green-700" : "text-gray-700 group-hover:text-gray-900"}`}>
                हाँ, मैं उपरोक्त सभी शर्तों से सहमत हूँ।
                <span className="block text-xs font-normal text-gray-400 mt-0.5">
                  Yes, I agree to all the above terms and consent to participate.
                </span>
              </span>
            </label>
          </motion.div>
        </motion.div>}
      </div>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="max-w-lg mx-auto space-y-2">
          {/* Status hint */}
          {form?.require_consent && !consentGiven ? (
            <p className="text-center text-xs text-amber-600 font-medium">
              ☝️ Please accept the consent declaration above to submit
            </p>
          ) : answeredRequired.length < requiredFields.length ? (
            <p className="text-center text-xs text-gray-400">
              {requiredFields.length - answeredRequired.length} required field{requiredFields.length - answeredRequired.length !== 1 ? "s" : ""} remaining
            </p>
          ) : null}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full h-12 rounded-2xl text-white text-base font-semibold flex items-center justify-center gap-2 transition-all
              ${canSubmit
                ? "bg-orange-500 hover:bg-orange-600 shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
                : "bg-gray-300 cursor-not-allowed"
              }`}
          >
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : "Submit Survey"}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
