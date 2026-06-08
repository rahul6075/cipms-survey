"use client"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Share2, Copy, Users, Loader2, ChevronDown, Search, Check, MapPin, BarChart2, Link2, UserCircle2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Agent { _id: string; name: string; email: string }
interface Props { form: any; agents: Agent[]; assignments: any[] }

function AgentCombobox({ agents, value, onChange }: { agents: Agent[]; value: Agent | null; onChange: (a: Agent | null) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = agents.filter((a) =>
    `${a.name} ${a.email}`.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery("") }}
        className={cn(
          "w-full flex items-center justify-between gap-3 h-14 px-4 rounded-xl border-2 text-sm transition-all bg-white text-left",
          open ? "border-orange-400 shadow-[0_0_0_3px_rgba(249,115,22,0.1)]" : "border-gray-200 hover:border-gray-300"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {value ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-xs font-bold text-white">{value.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-none truncate">{value.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{value.email}</p>
              </div>
            </>
          ) : (
            <>
              <UserCircle2 className="w-5 h-5 text-gray-300 shrink-0" />
              <span className="text-gray-400">Search Gram Pradhans...</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", open && "rotate-180")} />
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
              <Search className="w-4 h-4 text-gray-300 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent border-none outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-56 overflow-y-auto py-1.5">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No agents found</div>
              ) : filtered.map((a) => (
                <button
                  key={a._id}
                  type="button"
                  onClick={() => { onChange(a); setOpen(false); setQuery("") }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-sm font-bold text-white">{a.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{a.name}</p>
                    <p className="text-xs text-gray-400 truncate">{a.email}</p>
                  </div>
                  {value?._id === a._id && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AssignForm({ form, agents, assignments }: Props) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [village, setVillage] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [localAssignments, setLocalAssignments] = useState(assignments)

  const handleAssign = async () => {
    if (!selectedAgent) { toast.error("Select a Gram Pradhan"); return }
    setAssigning(true)
    const res = await fetch(`/api/forms/${form._id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agents: [{ agent_id: selectedAgent._id, village }] }),
    })
    setAssigning(false)
    if (res.ok) {
      const [newAssignment] = await res.json()
      setLocalAssignments([{ ...newAssignment, agent_id: selectedAgent }, ...localAssignments])
      setSelectedAgent(null)
      setVillage("")
      toast.success("Gram Pradhan assigned!")
    } else {
      toast.error("Failed to assign")
    }
  }

  const shareLink = async (token: string, agentName: string) => {
    const url = `${window.location.origin}/survey/${token}`
    const text = `Namaste ${agentName}, please share this survey link with your village: `
    if (navigator.share) {
      try {
        await navigator.share({ title: `CIPMS Survey — ${form.title}`, text, url })
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          await navigator.clipboard.writeText(url)
          toast.success("Link copied to clipboard!")
        }
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard!")
    }
  }

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/survey/${token}`)
    toast.success("Link copied!")
  }

  const totalSubmissions = localAssignments.reduce((s, a) => s + (a.total_submissions || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Assign Form</h1>
        <p className="text-gray-500 mt-1">
          <span className="font-medium text-gray-700">{form.title}</span> · Distribute to Gram Pradhans via WhatsApp links
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4">
        {[
          { label: "Gram Pradhans", value: localAssignments.length, icon: Users, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Total Responses", value: totalSubmissions, icon: BarChart2, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Active Links", value: localAssignments.filter(a => a.status === "active").length, icon: Link2, color: "text-green-500", bg: "bg-green-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

        {/* LEFT — Assign card */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 sticky top-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Add Gram Pradhan</h2>
                <p className="text-xs text-gray-400">Creates a unique survey link for them</p>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Combobox */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Gram Pradhan</label>
              <AgentCombobox agents={agents} value={selectedAgent} onChange={setSelectedAgent} />
            </div>

            {/* Village */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Village <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                <input
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Rampur, Sitapur"
                  className="w-full h-14 pl-11 pr-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 focus:border-orange-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] text-sm text-gray-800 placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            {/* Selected preview */}
            <AnimatePresence>
              {selectedAgent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-orange-200 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-orange-600">{selectedAgent.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{selectedAgent.name}</p>
                      <p className="text-xs text-gray-400 truncate">{selectedAgent.email}</p>
                    </div>
                    <Check className="w-5 h-5 text-orange-500 shrink-0" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleAssign}
              disabled={assigning || !selectedAgent}
              className="w-full h-13 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-[0_4px_16px_rgba(249,115,22,0.25)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {assigning ? "Generating link..." : "Assign & Generate Link"}
            </motion.button>
          </div>
        </motion.div>

        {/* RIGHT — Assignments list */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Assigned Gram Pradhans</h2>
                <p className="text-xs text-gray-400 mt-0.5">Share links directly via WhatsApp</p>
              </div>
              <Badge variant="outline" className="font-semibold text-gray-600 border-gray-200 px-3 py-1">
                {localAssignments.length} total
              </Badge>
            </div>

            {localAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-sm font-medium text-gray-600">No agents assigned yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Add a Gram Pradhan on the left to generate their unique survey link
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                <AnimatePresence initial={false}>
                  {localAssignments.map((a: any, idx: number) => (
                    <motion.div
                      key={a._id || idx}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center gap-5 px-6 py-5 hover:bg-gray-50/80 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-lg font-bold text-white">
                          {a.agent_id?.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">{a.agent_id?.name || "—"}</p>
                          <span className={cn(
                            "inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium",
                            a.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          )}>
                            {a.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                          {a.village && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="w-3 h-3" />{a.village}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <BarChart2 className="w-3 h-3" />
                            {a.total_submissions || 0} responses
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 mt-1 font-mono truncate">
                          /survey/{a.token?.slice(0, 20)}…
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copyLink(a.token)}
                          className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </button>
                        <button
                          onClick={() => shareLink(a.token, a.agent_id?.name || "")}
                          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Share
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
