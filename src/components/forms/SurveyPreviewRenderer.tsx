"use client"
import { useState, useRef, useMemo } from "react"
import { Star, MapPin, X, Camera, FileText, Loader2, ZoomIn, ChevronDown, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import type { FormField, SocialPlatform } from "@/types"
import { STATES_UTS, LS_CONSTITUENCIES, getLSByState } from "@/data/constituencies"
import { getVSByState, STATES_WITH_VS_DATA } from "@/data/vs_constituencies"
import { getBlocksByDistrict, getDistrictForVS, STATES_WITH_BLOCK_DATA } from "@/data/blocks_data"

interface Props {
  field: FormField
  value?: any
  onChange?: (v: any) => void
  preview?: boolean
}

// ── Social media platform config ──────────────────────────────────────────────
const PLATFORM_META: Record<SocialPlatform, { label: string; color: string; bg: string; placeholder: string; icon: string }> = {
  instagram: { label: "Instagram",   color: "#E1306C", bg: "#fff0f5", placeholder: "@username",            icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
  facebook:  { label: "Facebook",    color: "#1877F2", bg: "#f0f5ff", placeholder: "facebook.com/page",    icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
  twitter:   { label: "X (Twitter)", color: "#000000", bg: "#f5f5f5", placeholder: "@handle",              icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.735-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  youtube:   { label: "YouTube",     color: "#FF0000", bg: "#fff5f5", placeholder: "youtube.com/channel",  icon: "M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" },
  whatsapp:  { label: "WhatsApp",    color: "#25D366", bg: "#f0fff5", placeholder: "+91 XXXXX XXXXX",      icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" },
  linkedin:  { label: "LinkedIn",    color: "#0A66C2", bg: "#f0f5ff", placeholder: "linkedin.com/in/name", icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
  telegram:  { label: "Telegram",    color: "#229ED9", bg: "#f0faff", placeholder: "@username",            icon: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" },
  koo:       { label: "Koo",         color: "#F7C948", bg: "#fffdf0", placeholder: "@handle",              icon: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm0 14.5c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" },
}

function PlatformIcon({ id, size = 16 }: { id: SocialPlatform; size?: number }) {
  const p = PLATFORM_META[id]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={p.color} xmlns="http://www.w3.org/2000/svg">
      <path d={p.icon} />
    </svg>
  )
}

// ── Photo uploader with full preview ──────────────────────────────────────────
function PhotoUploader({ value, onChange, preview }: { value?: string; onChange?: (v: any) => void; preview?: boolean }) {
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error("Upload failed")
      const { url } = await res.json()
      onChange?.(url)
      toast.success("Photo uploaded!")
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const remove = () => {
    onChange?.(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  // ── Preview mode (phone mockup) ──
  if (preview) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-4 px-3 gap-1.5">
        <Camera className="w-4 h-4 text-gray-300" />
        <span className="text-xs text-gray-400">Tap to take / upload photo</span>
      </div>
    )
  }

  // ── Uploaded state ──
  if (value) {
    return (
      <>
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded"
            className="w-full max-h-64 object-cover cursor-pointer"
            onClick={() => setLightbox(true)}
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-start justify-end p-3 gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow text-gray-700 hover:bg-white"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={remove}
              className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow text-red-500 hover:bg-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Always-visible remove on mobile (no hover) */}
          <button
            type="button"
            onClick={remove}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white sm:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1.5">Tap photo to enlarge · Hover to remove</p>

        {/* Lightbox */}
        <AnimatePresence>
          {lightbox && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightbox(false)}
            >
              <button
                type="button"
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                onClick={() => setLightbox(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={value}
                alt="Full preview"
                className="max-w-full max-h-full rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ── Empty / uploading state ──
  return (
    <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-8 px-4 transition-all cursor-pointer
      ${uploading ? "border-orange-300 bg-orange-50/40" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"}`}
    >
      {uploading ? (
        <>
          <Loader2 className="w-7 h-7 text-orange-400 animate-spin mb-2" />
          <span className="text-sm text-orange-500 font-medium">Uploading photo...</span>
          <span className="text-xs text-gray-400 mt-0.5">Please wait</span>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-3">
            <Camera className="w-6 h-6 text-orange-400" />
          </div>
          <span className="text-sm font-medium text-gray-700">Take or upload a photo</span>
          <span className="text-xs text-gray-400 mt-1">JPG, PNG · Max 10 MB</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={uploading}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </label>
  )
}

// ── PDF uploader ──────────────────────────────────────────────────────────────
function PdfUploader({ value, onChange, preview }: { value?: string; onChange?: (v: any) => void; preview?: boolean }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") { toast.error("Please select a PDF file"); return }
    if (file.size > 20 * 1024 * 1024) { toast.error("PDF must be under 20 MB"); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error("Upload failed")
      const { url } = await res.json()
      onChange?.(url)
      toast.success("Document uploaded!")
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const remove = () => {
    onChange?.(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  if (preview) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-4 px-3 gap-1.5">
        <FileText className="w-4 h-4 text-gray-300" />
        <span className="text-xs text-gray-400">Tap to upload document</span>
      </div>
    )
  }

  if (value) {
    // Extract filename from URL
    const filename = value.split("/").pop()?.split("?")[0] || "document.pdf"
    return (
      <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-green-200 bg-green-50">
        <div className="w-12 h-12 rounded-xl bg-white border border-green-200 flex items-center justify-center shrink-0 shadow-sm">
          <FileText className="w-6 h-6 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{filename}</p>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            View document ↗
          </a>
        </div>
        <button
          type="button"
          onClick={remove}
          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-200 transition-all shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-8 px-4 transition-all cursor-pointer
      ${uploading ? "border-orange-300 bg-orange-50/40" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"}`}
    >
      {uploading ? (
        <>
          <Loader2 className="w-7 h-7 text-orange-400 animate-spin mb-2" />
          <span className="text-sm text-orange-500 font-medium">Uploading document...</span>
          <span className="text-xs text-gray-400 mt-0.5">Please wait</span>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
            <FileText className="w-6 h-6 text-red-400" />
          </div>
          <span className="text-sm font-medium text-gray-700">Upload a document</span>
          <span className="text-xs text-gray-400 mt-1">PDF only · Max 20 MB</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        disabled={uploading}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </label>
  )
}

// ── Constituency picker ───────────────────────────────────────────────────────
function ConstituencyPicker({
  field,
  value,
  onChange,
  preview,
}: {
  field: FormField
  value?: { state?: string; ls_no?: number; ls_name?: string; vs_no?: number; vs_name?: string; block?: string }
  onChange?: (v: any) => void
  preview?: boolean
}) {
  const cfg = field.constituency_config || { show_state: true, show_ls: true, show_vs: true, show_block: false }
  const val = value || {}

  const [lsSearch, setLsSearch] = useState("")
  const [lsOpen, setLsOpen] = useState(false)
  const lsRef = useRef<HTMLDivElement>(null)
  const [vsSearch, setVsSearch] = useState("")
  const [vsOpen, setVsOpen] = useState(false)
  const vsRef = useRef<HTMLDivElement>(null)
  const [blockSearch, setBlockSearch] = useState("")
  const [blockOpen, setBlockOpen] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)

  const lsOptions = useMemo(() => {
    const all = val.state ? getLSByState(val.state) : LS_CONSTITUENCIES
    if (!lsSearch.trim()) return all
    const q = lsSearch.toLowerCase()
    return all.filter(c => c.name.toLowerCase().includes(q) || String(c.no).includes(q))
  }, [val.state, lsSearch])

  const hasVsData = val.state ? STATES_WITH_VS_DATA.has(val.state) : false
  const vsDistrict = val.vs_name ? getDistrictForVS(val.vs_name) : null
  const hasBlockData = val.state ? STATES_WITH_BLOCK_DATA.has(val.state) : false
  const blockOptions = useMemo(() => {
    if (!hasBlockData || !vsDistrict) return []
    const all = getBlocksByDistrict(val.state!, vsDistrict)
    if (!blockSearch.trim()) return all
    const q = blockSearch.toLowerCase()
    return all.filter(b => b.toLowerCase().includes(q))
  }, [hasBlockData, vsDistrict, val.state, blockSearch])
  const vsOptions = useMemo(() => {
    if (!val.state || !hasVsData) return []
    const all = getVSByState(val.state, val.ls_no)
    if (!vsSearch.trim()) return all
    const q = vsSearch.toLowerCase()
    return all.filter(c => c.name.toLowerCase().includes(q) || String(c.no).includes(q))
  }, [val.state, val.ls_no, vsSearch, hasVsData])

  const set = (patch: object) => !preview && onChange?.({ ...val, ...patch })

  const baseInput = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"

  if (preview) {
    return (
      <div className="space-y-2">
        {cfg.show_state && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
            <span className="text-xs font-medium text-gray-400 w-20 shrink-0">State</span>
            <span className="text-xs text-gray-300">Select state...</span>
          </div>
        )}
        {cfg.show_ls && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
            <span className="text-xs font-medium text-gray-400 w-20 shrink-0">Lok Sabha</span>
            <span className="text-xs text-gray-300">Search constituency...</span>
          </div>
        )}
        {cfg.show_vs && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
            <span className="text-xs font-medium text-gray-400 w-24 shrink-0">Vidhan Sabha</span>
            <span className="text-xs text-gray-300">Search constituency...</span>
          </div>
        )}
        {cfg.show_block && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
            <span className="text-xs font-medium text-gray-400 w-24 shrink-0">Block</span>
            <span className="text-xs text-gray-300">Select block...</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {/* State */}
      {cfg.show_state && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1 px-1">State / UT</p>
          <select
            value={val.state || ""}
            onChange={(e) => {
              // Reset LS when state changes
              set({ state: e.target.value, ls_no: undefined, ls_name: undefined })
              setLsSearch("")
            }}
            className={`${baseInput} appearance-none cursor-pointer`}
          >
            <option value="">Select state / UT...</option>
            {STATES_UTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* Lok Sabha — searchable dropdown */}
      {cfg.show_ls && (
        <div ref={lsRef} className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1 px-1">
            Lok Sabha Constituency
          </p>
          <button
            type="button"
            onClick={() => setLsOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm transition-all hover:border-orange-300 focus:outline-none focus:border-orange-400"
          >
            <span className={val.ls_name ? "text-gray-800 font-medium" : "text-gray-400"}>
              {val.ls_name
                ? `${val.ls_no}. ${val.ls_name}`
                : "Search Lok Sabha constituency..."}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${lsOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {lsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
                style={{ maxHeight: 280 }}
              >
                {/* Search input */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={lsSearch}
                    onChange={(e) => setLsSearch(e.target.value)}
                    placeholder="Type name or number..."
                    className="flex-1 text-sm text-gray-800 bg-transparent border-none outline-none placeholder-gray-400"
                  />
                  {lsSearch && (
                    <button type="button" onClick={() => setLsSearch("")} className="text-gray-300 hover:text-gray-500">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {/* Results */}
                <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
                  {lsOptions.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No results</p>
                  ) : (
                    lsOptions.map(c => (
                      <button
                        key={c.no}
                        type="button"
                        onClick={() => {
                          set({ ls_no: c.no, ls_name: c.name })
                          setLsOpen(false)
                          setLsSearch("")
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-orange-50 transition-colors ${
                          val.ls_no === c.no ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700"
                        }`}
                      >
                        <span className="w-8 text-xs font-mono text-gray-400 shrink-0">{c.no}</span>
                        <span className="flex-1">{c.name}</span>
                        {!val.state && <span className="text-[10px] text-gray-400 shrink-0">{c.state}</span>}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Vidhan Sabha */}
      {cfg.show_vs && (
        <div ref={vsRef} className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1 px-1">
            Vidhan Sabha Constituency
          </p>

          {hasVsData ? (
            <>
              <button
                type="button"
                onClick={() => setVsOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm transition-all hover:border-orange-300 focus:outline-none focus:border-orange-400"
              >
                <span className={val.vs_name ? "text-gray-800 font-medium" : "text-gray-400"}>
                  {val.vs_name
                    ? `${val.vs_no}. ${val.vs_name}`
                    : "Search Vidhan Sabha constituency..."}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${vsOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {vsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
                    style={{ maxHeight: 280 }}
                  >
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                      <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={vsSearch}
                        onChange={(e) => setVsSearch(e.target.value)}
                        placeholder="Type name or number..."
                        className="flex-1 text-sm text-gray-800 bg-transparent border-none outline-none placeholder-gray-400"
                      />
                      {vsSearch && (
                        <button type="button" onClick={() => setVsSearch("")} className="text-gray-300 hover:text-gray-500">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
                      {vsOptions.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No results</p>
                      ) : (
                        vsOptions.map(c => (
                          <button
                            key={`${c.no}-${c.name}`}
                            type="button"
                            onClick={() => {
                              set({ vs_no: c.no, vs_name: c.name })
                              setVsOpen(false)
                              setVsSearch("")
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-orange-50 transition-colors ${
                              val.vs_no === c.no && val.vs_name === c.name
                                ? "bg-orange-50 text-orange-700 font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            <span className="w-8 text-xs font-mono text-gray-400 shrink-0">{c.no}</span>
                            <span>{c.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={999}
                value={val.vs_no || ""}
                onChange={(e) => set({ vs_no: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="No."
                className={`${baseInput} w-20 shrink-0`}
              />
              <input
                type="text"
                value={val.vs_name || ""}
                onChange={(e) => set({ vs_name: e.target.value })}
                placeholder={val.state ? "Enter Vidhan Sabha name..." : "Select a state first"}
                className={baseInput}
              />
            </div>
          )}
        </div>
      )}

      {/* Block */}
      {cfg.show_block && (
        <div ref={blockRef} className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1 px-1">
            Block
          </p>
          {hasBlockData && vsDistrict ? (
            <>
              <button
                type="button"
                onClick={() => setBlockOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm transition-all hover:border-orange-300 focus:outline-none focus:border-orange-400"
              >
                <span className={val.block ? "text-gray-800 font-medium" : "text-gray-400"}>
                  {val.block || "Select block..."}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${blockOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {blockOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
                    style={{ maxHeight: 280 }}
                  >
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                      <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={blockSearch}
                        onChange={(e) => setBlockSearch(e.target.value)}
                        placeholder="Search block..."
                        className="flex-1 text-sm text-gray-800 bg-transparent border-none outline-none placeholder-gray-400"
                      />
                      {blockSearch && (
                        <button type="button" onClick={() => setBlockSearch("")} className="text-gray-300 hover:text-gray-500">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
                      {blockOptions.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No blocks found</p>
                      ) : (
                        blockOptions.map(b => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              set({ block: b })
                              setBlockOpen(false)
                              setBlockSearch("")
                            }}
                            className={`w-full px-3 py-2 text-sm text-left hover:bg-orange-50 transition-colors ${
                              val.block === b ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700"
                            }`}
                          >
                            {b}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <input
              type="text"
              value={val.block || ""}
              onChange={(e) => set({ block: e.target.value })}
              placeholder={!val.vs_name ? "Select Vidhan Sabha first" : "Enter block name..."}
              className={baseInput}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Main renderer ─────────────────────────────────────────────────────────────
export function SurveyFieldRenderer({ field, value, onChange, preview }: Props) {
  const set = (v: any) => !preview && onChange?.(v)

  const baseInput = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"

  switch (field.type) {
    case "short_text":
    case "email":
    case "phone":
    case "number":
      return (
        <input
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "number" ? "number" : "text"}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
          value={value || ""}
          readOnly={preview}
          onChange={(e) => set(e.target.value)}
          className={baseInput}
        />
      )

    case "long_text":
      return (
        <textarea
          placeholder={field.placeholder || "Type your answer..."}
          value={value || ""}
          readOnly={preview}
          rows={3}
          onChange={(e) => set(e.target.value)}
          className={`${baseInput} resize-none`}
        />
      )

    case "date":
      return (
        <input
          type="date"
          value={value || ""}
          readOnly={preview}
          onChange={(e) => set(e.target.value)}
          className={baseInput}
        />
      )

    case "time":
      return (
        <input
          type="time"
          value={value || ""}
          readOnly={preview}
          onChange={(e) => set(e.target.value)}
          className={baseInput}
        />
      )

    case "yes_no":
      return (
        <div className="flex gap-3">
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set(opt)}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                ${value === opt
                  ? "border-orange-500 bg-orange-50 text-orange-600"
                  : "border-gray-200 text-gray-500 hover:border-orange-200"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )

    case "radio":
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set(opt)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-sm text-left transition-all
                ${value === opt
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-100 bg-white text-gray-600 hover:border-orange-200"
                }`}
            >
              <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                ${value === opt ? "border-orange-500" : "border-gray-300"}`}>
                {value === opt && <span className="w-2 h-2 rounded-full bg-orange-500" />}
              </span>
              {opt}
            </button>
          ))}
        </div>
      )

    case "checkbox":
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt) => {
            const checked = Array.isArray(value) && value.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const cur = Array.isArray(value) ? value : []
                  set(checked ? cur.filter((v: string) => v !== opt) : [...cur, opt])
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-sm text-left transition-all
                  ${checked
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-100 bg-white text-gray-600 hover:border-orange-200"
                  }`}
              >
                <span className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center
                  ${checked ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}>
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      )

    case "dropdown":
      return (
        <select
          value={value || ""}
          disabled={preview}
          onChange={(e) => set(e.target.value)}
          className={`${baseInput} cursor-pointer appearance-none`}
        >
          <option value="">Select an option...</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )

    case "rating":
      return (
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => set(n)} className="group">
              <Star className={`w-8 h-8 transition-all
                ${(value || 0) >= n
                  ? "fill-orange-400 text-orange-400"
                  : "text-gray-200 group-hover:text-orange-300"
                }`}
              />
            </button>
          ))}
        </div>
      )

    case "social_media": {
      const platforms = (field.platforms || []) as SocialPlatform[]
      if (platforms.length === 0) return (
        <p className="text-xs text-amber-500 px-1">No platforms selected — configure in form builder</p>
      )
      // value = Record<SocialPlatform, string>
      const vals: Record<string, string> = value || {}
      if (preview) return (
        <div className="space-y-2">
          {platforms.map(pid => {
            const p = PLATFORM_META[pid]
            return (
              <div key={pid} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50">
                <PlatformIcon id={pid} size={14} />
                <span className="text-xs text-gray-400">{p.placeholder}</span>
              </div>
            )
          })}
        </div>
      )
      return (
        <div className="space-y-2.5">
          {platforms.map(pid => {
            const p = PLATFORM_META[pid]
            return (
              <div key={pid}>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 border-gray-200 bg-white focus-within:border-orange-400 focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.08)] transition-all">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: p.bg }}
                  >
                    <PlatformIcon id={pid} size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: p.color }}>
                      {p.label}
                    </p>
                    <input
                      type={pid === "whatsapp" ? "tel" : "text"}
                      value={vals[pid] || ""}
                      onChange={(e) => onChange?.({ ...vals, [pid]: e.target.value })}
                      placeholder={p.placeholder}
                      className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent border-none outline-none leading-none"
                    />
                  </div>
                  {vals[pid] && (
                    <button
                      type="button"
                      onClick={() => { const next = { ...vals }; delete next[pid]; onChange?.(next) }}
                      className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    case "constituency":
      return <ConstituencyPicker field={field} value={value} onChange={onChange} preview={preview} />

    case "photo":
      return <PhotoUploader value={value} onChange={!preview ? onChange : undefined} preview={preview} />

    case "pdf":
      return <PdfUploader value={value} onChange={!preview ? onChange : undefined} preview={preview} />

    case "location":
      return (
        <button
          type="button"
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 text-sm text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-all"
        >
          <MapPin className="w-4 h-4 shrink-0" />
          {value ? `${value.lat?.toFixed(4)}, ${value.lng?.toFixed(4)}` : "Capture GPS Location"}
        </button>
      )

    default:
      return (
        <input
          value={value || ""}
          readOnly={preview}
          onChange={(e) => set(e.target.value)}
          className={baseInput}
        />
      )
  }
}
