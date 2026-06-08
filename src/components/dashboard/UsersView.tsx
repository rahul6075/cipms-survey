"use client"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Plus, Search, Users, ShieldCheck, UserCircle2, Loader2,
  MoreVertical, Power, Trash2, X, Eye, EyeOff, ChevronDown,
  Mail, Lock, Tag, Filter, CheckCircle, XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// ── Helpers ────────────────────────────────────────────────────────────────────
const ROLE_META = {
  super_admin: { label: "Super Admin", color: "text-orange-700", bg: "bg-orange-100", dot: "bg-orange-500", icon: ShieldCheck },
  admin:       { label: "Admin",       color: "text-blue-700",   bg: "bg-blue-100",   dot: "bg-blue-500",   icon: ShieldCheck },
  agent:       { label: "Gram Pradhan",color: "text-green-700",  bg: "bg-green-100",  dot: "bg-green-500",  icon: UserCircle2 },
}

const AVATAR_GRADIENTS = [
  "from-orange-400 to-rose-500",
  "from-violet-400 to-purple-600",
  "from-sky-400 to-blue-600",
  "from-teal-400 to-emerald-600",
  "from-amber-400 to-orange-500",
  "from-pink-400 to-rose-600",
]

function avatarGradient(id: string) {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length]
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ user, size = "md" }: { user: any; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm"
  return (
    <div className={cn(
      "rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-white shrink-0 shadow-sm",
      sz, avatarGradient(user._id || user.email)
    )}>
      {initials(user.name || "?")}
    </div>
  )
}

// ── User card ──────────────────────────────────────────────────────────────────
function UserCard({ user, sessionRole, onToggle, onDelete, onClick, selected }: {
  user: any; sessionRole: string; onToggle: () => void; onDelete: () => void; onClick: () => void; selected: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [working, setWorking] = useState(false)
  const meta = ROLE_META[user.role as keyof typeof ROLE_META] || ROLE_META.agent

  const doToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setWorking(true)
    setMenuOpen(false)
    await onToggle()
    setWorking(false)
  }

  const doDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return
    setMenuOpen(false)
    await onDelete()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      onClick={onClick}
      className={cn(
        "group relative bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200",
        selected
          ? "border-orange-400 shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
          : "border-gray-100 hover:border-gray-200 hover:shadow-md shadow-sm"
      )}
    >
      {/* Active dot */}
      <span className={cn(
        "absolute top-3.5 right-10 w-2 h-2 rounded-full",
        user.is_active ? "bg-green-400" : "bg-gray-300"
      )} />

      {/* Menu */}
      <div className="absolute top-2.5 right-2.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-8 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden py-1"
              >
                <button
                  onClick={doToggle}
                  disabled={working}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                  {user.is_active ? "Deactivate" : "Activate"}
                </button>
                {sessionRole === "super_admin" && user.role !== "super_admin" && (
                  <button
                    onClick={doDelete}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete user
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 pr-6">
        <Avatar user={user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", meta.bg, meta.color)}>
              {meta.label}
            </span>
            <span className="text-[10px] text-gray-300">
              {timeAgo(user.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────────
function UserDetail({ user, onClose, onToggle, onDelete, sessionRole }: {
  user: any; onClose: () => void; onToggle: () => void; onDelete: () => void; sessionRole: string
}) {
  const [working, setWorking] = useState(false)
  const meta = ROLE_META[user.role as keyof typeof ROLE_META] || ROLE_META.agent
  const Icon = meta.icon

  const doToggle = async () => {
    setWorking(true)
    await onToggle()
    setWorking(false)
  }

  const doDelete = async () => {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return
    await onDelete()
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="relative px-6 pt-6 pb-5 border-b border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <Avatar user={user} size="lg" />
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-bold text-gray-900 text-base leading-none">{user.name}</h3>
            <p className="text-sm text-gray-400 mt-1 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium", meta.bg, meta.color)}>
                <Icon className="w-3 h-3" />{meta.label}
              </span>
              <span className={cn(
                "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium",
                user.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              )}>
                {user.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex-1 space-y-4">
        {[
          { label: "Email", value: user.email },
          { label: "Role", value: ROLE_META[user.role as keyof typeof ROLE_META]?.label || user.role },
          { label: "Member since", value: new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
          { label: "Last updated", value: timeAgo(user.updatedAt || user.createdAt) },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">{label}</p>
            <p className="text-sm text-gray-900 font-medium text-right">{value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 pt-2 space-y-2">
        {user.role !== "super_admin" && (
          <button
            onClick={doToggle}
            disabled={working}
            className={cn(
              "w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all",
              user.is_active
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-green-100 hover:bg-green-200 text-green-700"
            )}
          >
            {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            {user.is_active ? "Deactivate account" : "Activate account"}
          </button>
        )}
        {sessionRole === "super_admin" && user.role !== "super_admin" && (
          <button
            onClick={doDelete}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium bg-red-50 hover:bg-red-100 text-red-500 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Delete user
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Create dialog ──────────────────────────────────────────────────────────────
function CreateDialog({ open, onClose, sessionRole, onCreated }: {
  open: boolean; onClose: () => void; sessionRole: string; onCreated: (u: any) => void
}) {
  const [saving, setSaving] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "agent" })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("All fields are required")
      return
    }
    setSaving(true)
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      const user = await res.json()
      onCreated(user)
      onClose()
      setForm({ name: "", email: "", password: "", role: "agent" })
      toast.success(`${user.name} added successfully!`)
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to create user")
    }
  }

  const ROLES = sessionRole === "super_admin"
    ? [{ v: "agent", label: "Gram Pradhan", desc: "Field agent, fills surveys" }, { v: "admin", label: "Admin", desc: "Manages agents & forms" }]
    : [{ v: "agent", label: "Gram Pradhan", desc: "Field agent, fills surveys" }]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Add new user</DialogTitle>
            <p className="text-sm text-gray-400 mt-0.5">Create a login account for an agent or admin</p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Full name</label>
            <div className="relative">
              <UserCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ravi Kumar"
                className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 focus:border-orange-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] text-sm text-gray-800 placeholder-gray-400 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="ravi@cipms.in"
                className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 focus:border-orange-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] text-sm text-gray-800 placeholder-gray-400 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min 8 characters"
                className="w-full h-11 pl-10 pr-10 rounded-xl border-2 border-gray-200 hover:border-gray-300 focus:border-orange-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] text-sm text-gray-800 placeholder-gray-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => set("role", r.v)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 p-3.5 rounded-xl border-2 text-left transition-all",
                    form.role === r.v
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Tag className={cn("w-3.5 h-3.5", form.role === r.v ? "text-orange-500" : "text-gray-400")} />
                    <span className={cn("text-sm font-semibold", form.role === r.v ? "text-orange-700" : "text-gray-800")}>
                      {r.label}
                    </span>
                    {form.role === r.v && (
                      <span className="ml-auto w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 pl-5">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={saving}
            className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-[0_4px_16px_rgba(249,115,22,0.25)] disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create user</>}
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props { users: any[]; role: string }

export function UsersView({ users, role }: Props) {
  const [localUsers, setLocalUsers] = useState(users)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Stats
  const stats = useMemo(() => ({
    total: localUsers.length,
    active: localUsers.filter(u => u.is_active).length,
    agents: localUsers.filter(u => u.role === "agent").length,
    admins: localUsers.filter(u => u.role === "admin").length,
  }), [localUsers])

  // Filtered list
  const filtered = useMemo(() => localUsers.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === "all" || u.role === filterRole
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "active" && u.is_active) ||
      (filterStatus === "inactive" && !u.is_active)
    return matchSearch && matchRole && matchStatus
  }), [localUsers, search, filterRole, filterStatus])

  const handleToggle = async (user: any) => {
    const res = await fetch(`/api/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !user.is_active }),
    })
    if (res.ok) {
      const updated = await res.json()
      setLocalUsers(prev => prev.map(u => u._id === updated._id ? updated : u))
      if (selectedUser?._id === updated._id) setSelectedUser(updated)
      toast.success(`${updated.name} ${updated.is_active ? "activated" : "deactivated"}`)
    } else {
      toast.error("Failed to update user")
    }
  }

  const handleDelete = async (user: any) => {
    const res = await fetch(`/api/users/${user._id}`, { method: "DELETE" })
    if (res.ok) {
      setLocalUsers(prev => prev.filter(u => u._id !== user._id))
      if (selectedUser?._id === user._id) setSelectedUser(null)
      toast.success(`${user.name} deleted`)
    } else {
      toast.error("Failed to delete user")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {stats.active} active · {stats.total} total
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-[0_4px_16px_rgba(249,115,22,0.25)] transition-all"
        >
          <Plus className="w-4 h-4" /> Add user
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total users",    value: stats.total,  color: "text-gray-900",   bg: "bg-gray-50",    border: "border-gray-200" },
          { label: "Active",         value: stats.active, color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
          { label: "Gram Pradhans",  value: stats.agents, color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200" },
          { label: "Admins",         value: stats.admins, color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-4 flex flex-col gap-1", s.bg, s.border)}>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Search + filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-10 pl-10 pr-10 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.08)] transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role filter */}
        <div className="relative">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:border-orange-400 appearance-none cursor-pointer"
          >
            <option value="all">All roles</option>
            <option value="agent">Gram Pradhan</option>
            <option value="admin">Admin</option>
            {role === "super_admin" && <option value="super_admin">Super Admin</option>}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:border-orange-400 appearance-none cursor-pointer"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Active filters indicator */}
        {(filterRole !== "all" || filterStatus !== "all" || search) && (
          <button
            onClick={() => { setSearch(""); setFilterRole("all"); setFilterStatus("all") }}
            className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-orange-200 bg-orange-50 text-xs font-medium text-orange-600 hover:bg-orange-100 transition-all"
          >
            <Filter className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </motion.div>

      {/* Main grid + detail panel */}
      <div className={cn("grid gap-6 items-start", selectedUser ? "grid-cols-1 lg:grid-cols-[1fr_320px]" : "grid-cols-1")}>
        {/* User list */}
        <div>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                <Users className="w-7 h-7 text-gray-200" />
              </div>
              <p className="text-sm font-medium text-gray-600">No users found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((u) => (
                  <UserCard
                    key={u._id}
                    user={u}
                    sessionRole={role}
                    selected={selectedUser?._id === u._id}
                    onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)}
                    onToggle={() => handleToggle(u)}
                    onDelete={() => handleDelete(u)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {filtered.length > 0 && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              Showing {filtered.length} of {localUsers.length} users
            </p>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedUser && (
            <UserDetail
              key={selectedUser._id}
              user={selectedUser}
              sessionRole={role}
              onClose={() => setSelectedUser(null)}
              onToggle={() => handleToggle(selectedUser)}
              onDelete={() => handleDelete(selectedUser)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Create dialog */}
      <CreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        sessionRole={role}
        onCreated={(u) => setLocalUsers(prev => [u, ...prev])}
      />
    </div>
  )
}
