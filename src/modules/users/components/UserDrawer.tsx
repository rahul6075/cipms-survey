"use client"

import * as React from "react"
import { toast } from "sonner"
import { Activity, ChevronUp, FileText, Link as LinkIcon, Loader2, Mail, QrCode, Shield, Sparkles, Trash2, Upload, User as UserIcon, Clipboard } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { PhotoLightbox } from "@/shared/components/PhotoLightbox"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Progress } from "@/shared/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Textarea } from "@/shared/components/ui/textarea"
import { ROLE_PROFILE_SCHEMA, type ProfileField } from "@/modules/users/profileSchemas"
import { SurveyShareBlock } from "@/modules/survey/components/ShareSurveyLinkDialog"
import type { Role, UserRow } from "./UsersViewNew"

type UserAssignment = {
  _id: string
  token: string
  status: "active" | "expired" | "revoked"
  total_submissions: number
  created_via: "intake" | "manual"
  createdAt: string
  form: { _id: string; title: string; status: string } | null
}

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  agent: "Gram Pradhan",
}

export function UserDrawer({
  user,
  open,
  onOpenChange,
  onChange,
  sessionRole,
}: {
  user: UserRow | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onChange: () => void
  sessionRole: Role
}) {
  const [profile, setProfile] = React.useState<Record<string, unknown>>({})
  const [saving, setSaving] = React.useState(false)
  const [assignments, setAssignments] = React.useState<UserAssignment[] | null>(null)
  const [loadingAssignments, setLoadingAssignments] = React.useState(false)
  const [openAssignmentId, setOpenAssignmentId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setProfile((user?.profile_data as Record<string, unknown>) || {})
    setAssignments(null)
    setOpenAssignmentId(null)
  }, [user])

  // Lazy-load assignments the first time the drawer opens for a user — avoids
  // an extra round-trip when agents are just viewing profiles.
  const loadAssignments = React.useCallback(async () => {
    if (!user || assignments || loadingAssignments) return
    setLoadingAssignments(true)
    try {
      const r = await fetch(`/api/users/${user._id}/assignments`)
      if (r.ok) setAssignments(await r.json())
      else setAssignments([])
    } catch { setAssignments([]) }
    finally { setLoadingAssignments(false) }
  }, [user, assignments, loadingAssignments])

  const schema = user ? ROLE_PROFILE_SCHEMA[user.role] : undefined
  const groupedFields = React.useMemo(() => {
    const groups: Record<string, ProfileField[]> = {}
    for (const f of schema?.fields || []) {
      const g = f.group || "Other"
      ;(groups[g] ||= []).push(f)
    }
    return groups
  }, [schema])

  if (!user) return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-xl" />
    </Sheet>
  )

  const canEdit = sessionRole === "super_admin" || (sessionRole === "admin" && user.role === "agent")

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    try {
      const r = await fetch(`/api/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_data: profile }),
      })
      if (!r.ok) throw new Error("save failed")
      toast.success("Profile saved")
      onChange()
    } catch { toast.error("Could not save profile") }
    finally { setSaving(false) }
  }

  async function changeStatus(status: string) {
    if (!user) return
    try {
      await fetch(`/api/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      toast.success(`Status set to ${status}`)
      onChange()
    } catch { toast.error("Failed to change status") }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        /*
         * Half-page on desktop with sensible minimum widths. Mobile and small
         * tablets still use near-full width so content stays readable.
         *   base ≤640px:  full width
         *   sm  ≥640px:   ~90vw up to ~640px
         *   md  ≥768px:   fixed 640px (tablet landscape)
         *   lg  ≥1024px:  720px
         *   xl  ≥1280px:  50vw (true half-page)
         *   2xl ≥1536px:  48vw with 820px floor
         */
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px] md:max-w-[640px] lg:max-w-[720px] xl:max-w-[50vw] 2xl:max-w-[min(50vw,920px)]"
      >
        {/* Header */}
        <SheetHeader className="shrink-0 gap-0 border-b border-border/70 px-6 py-5">
          <div className="flex items-start gap-4">
            {typeof profile.photo === "string" && profile.photo ? (
              <PhotoLightbox src={profile.photo} alt={user.name} className="shrink-0 rounded-full">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.photo} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                    {user.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </PhotoLightbox>
            ) : (
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                  {user.name?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <SheetTitle className="truncate text-lg">{user.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 truncate text-xs">
                <Mail className="h-3 w-3 shrink-0" /> {user.email}
              </SheetDescription>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[11px]">{ROLE_LABEL[user.role]}</Badge>
                <Badge variant="secondary" className="text-[11px]">
                  {user.status || (user.is_active ? "active" : "inactive")}
                </Badge>
                {(user.profile_percent ?? 0) === 100 && (
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-700 dark:text-emerald-400">
                    Profile complete
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {schema && (user.profile_percent ?? 0) < 100 && (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-amber-500/10 p-3 text-xs">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  Profile {user.profile_percent ?? 0}% complete
                </p>
                <Progress value={user.profile_percent ?? 0} className="mt-1 h-1 [&>div]:bg-amber-500" />
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-6 mt-4 w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <OverviewTile label="Full name" value={user.name} />
                <OverviewTile label="Email" value={user.email} icon={Mail} />
                <OverviewTile label="Role" value={ROLE_LABEL[user.role]} />
                <OverviewTile
                  label="Status"
                  value={user.status || (user.is_active ? "active" : "inactive")}
                />
                <OverviewTile label="Created by" value={user.created_by?.name || "—"} />
                <OverviewTile
                  label="Joined"
                  value={new Date(user.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                  hint={new Date(user.createdAt).toLocaleTimeString("en-IN")}
                />
                <OverviewTile
                  label="Last active"
                  value={user.last_active_at
                    ? new Date(user.last_active_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                  icon={Activity}
                  className="sm:col-span-2"
                />
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-0 space-y-5">
              {!schema ? (
                <EmptyTab icon={UserIcon} title="No profile fields" sub="This role has no additional profile schema configured." />
              ) : (
                <>
                  {Object.entries(groupedFields).map(([group, fields]) => (
                    <section key={group} className="space-y-3">
                      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {group}
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {fields.map((f) => {
                          // Keep photo + textarea + notes full-width; everything
                          // else fits in a 2-col grid on wider drawers.
                          const fullWidth = f.type === "photo" || f.type === "textarea"
                          return (
                            <div key={f.key} className={cn(fullWidth && "sm:col-span-2")}>
                              <ProfileFieldInput
                                field={f}
                                value={profile[f.key]}
                                onChange={(v) => setProfile((p) => ({ ...p, [f.key]: v }))}
                                disabled={!canEdit}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  ))}

                  {canEdit && (
                    <div className="sticky bottom-0 -mx-5 mt-4 border-t border-border/70 bg-background/95 px-5 py-3 backdrop-blur">
                      <Button onClick={saveProfile} disabled={saving} className="w-full">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Save profile
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="assignments" className="mt-0 space-y-3">
              <AssignmentsList
                user={user}
                profile={profile}
                rows={assignments}
                loading={loadingAssignments}
                onReady={loadAssignments}
                openId={openAssignmentId}
                onToggle={(id) => setOpenAssignmentId((cur) => (cur === id ? null : id))}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <EmptyTab
                icon={Activity}
                title="No activity recorded"
                sub="Logins, submissions and audit events will appear here."
              />
            </TabsContent>

            <TabsContent value="permissions" className="mt-0 space-y-4">
              <div className="rounded-lg border border-border/70 p-4">
                <h4 className="mb-1 text-sm font-semibold">Role</h4>
                <p className="mb-3 text-xs text-muted-foreground">
                  Current role determines what this user can do.
                </p>
                <Badge variant="outline">{ROLE_LABEL[user.role]}</Badge>
              </div>

              {canEdit && user.role !== "super_admin" && (
                <div className="rounded-lg border border-border/70 p-4">
                  <h4 className="mb-1 text-sm font-semibold">Account status</h4>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Suspend or deactivate without deleting.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => changeStatus("active")}>Active</Button>
                    <Button size="sm" variant="outline" onClick={() => changeStatus("inactive")}>Inactive</Button>
                    <Button size="sm" variant="outline" onClick={() => changeStatus("suspended")}>Suspended</Button>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
                <Shield className="mb-2 h-4 w-4" />
                Fine-grained permission flags are planned for a future phase. For now, access follows the role.
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

/* ─── assignments list in the drawer ─────────────────────────── */

function AssignmentsList({
  user,
  profile,
  rows,
  loading,
  onReady,
  openId,
  onToggle,
}: {
  user: UserRow
  profile: Record<string, unknown>
  rows: UserAssignment[] | null
  loading: boolean
  onReady: () => void
  openId: string | null
  onToggle: (id: string) => void
}) {
  React.useEffect(() => { onReady() }, [onReady])

  if (loading && rows === null) {
    return <div className="flex items-center justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
  }
  if (!rows || rows.length === 0) {
    return (
      <EmptyTab
        icon={Clipboard}
        title="No assignments yet"
        sub={`${user.name} hasn't been assigned to any survey form.`}
      />
    )
  }

  // Shared Pradhan info for the inline share block.
  const pradhan = {
    name: user.name,
    photo: (profile.photo as string | undefined) || "",
    panchayat: (profile.panchayat as string | undefined) || "",
    phone: (profile.phone as string | undefined) || "",
  }

  return (
    <ul className="space-y-2">
      {rows.map((a) => {
        const inactive = a.status !== "active" || (a.form?.status === "closed")
        const isOpen = openId === a._id
        return (
          <li
            key={a._id}
            className={cn(
              "overflow-hidden rounded-lg border text-sm transition-colors",
              isOpen
                ? "border-primary/40 bg-primary/[0.03]"
                : "border-border/70",
              inactive && !isOpen && "opacity-70"
            )}
          >
            {/* Row */}
            <div className="flex items-start gap-3 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{a.form?.title || "Unknown form"}</p>
                  <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                  {a.created_via === "intake" && (
                    <Badge variant="secondary" className="text-[10px]">intake</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a.total_submissions} response{a.total_submissions === 1 ? "" : "s"} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isOpen ? "default" : "outline"}
                className="shrink-0"
                onClick={() => onToggle(a._id)}
                disabled={inactive && !isOpen}
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" /> Hide
                  </>
                ) : (
                  <>
                    <QrCode className="h-3.5 w-3.5" /> Show QR
                  </>
                )}
              </Button>
            </div>

            {/* Inline expand — QR + share actions right under the row */}
            {isOpen && (
              <div className="border-t border-primary/15 bg-background/60 p-4">
                <SurveyShareBlock
                  token={a.token}
                  pradhan={pradhan}
                  form={a.form ? { title: a.form.title } : null}
                  showPradhanCard={false}
                  compact
                />
              </div>
            )}
          </li>
        )
      })}
      <p className="pt-2 text-[11px] text-muted-foreground">
        <LinkIcon className="mr-1 inline-block h-3 w-3" />
        QRs regenerate on demand from the stored token — nothing cached in the database.
      </p>
    </ul>
  )
}

function OverviewTile({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  hint?: string
  className?: string
}) {
  return (
    <div className={cn("rounded-lg border border-border/70 bg-card p-3", className)}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-medium">{value || "—"}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  )
}

function ProfileFieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: ProfileField
  value: unknown
  onChange: (v: unknown) => void
  disabled?: boolean
}) {
  const common = (
    <Label className="flex items-center gap-1 text-xs font-medium">
      {field.label}
      {field.required && <span className="text-destructive">*</span>}
    </Label>
  )

  if (field.type === "photo") {
    return (
      <div className="space-y-1.5">
        {common}
        <PhotoUploader
          value={(value as string) || ""}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    )
  }

  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        {common}
        <Select value={(value as string) || ""} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        {common}
        <Textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          rows={3}
        />
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      {common}
      <Input
        type={field.type === "tel" || field.type === "email" ? field.type : "text"}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
      />
    </div>
  )
}

function PhotoUploader({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [busy, setBusy] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB")
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed")
      return
    }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const r = await fetch("/api/upload", { method: "POST", body: fd })
      if (!r.ok) throw new Error("Upload failed")
      const data = await r.json()
      onChange(data.url)
      toast.success("Photo uploaded")
    } catch (e) {
      toast.error((e as Error).message || "Upload failed")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0">
        {value ? (
          <PhotoLightbox src={value} alt="Profile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Profile"
              className="h-16 w-16 rounded-xl object-cover ring-1 ring-border"
            />
          </PhotoLightbox>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted ring-1 ring-dashed ring-border">
            <UserIcon className="h-6 w-6 text-muted-foreground/60" />
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || busy}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || busy}
          >
            <Upload className="h-3.5 w-3.5" />
            {value ? "Replace" : "Upload"}
          </Button>
          {value && !disabled && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => onChange("")}
              disabled={busy}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">PNG or JPG, up to 5 MB.</p>
      </div>
    </div>
  )
}

function EmptyTab({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  sub?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-8 text-center")}>
      <Icon className="mb-2 h-6 w-6 text-muted-foreground/60" />
      <p className="text-sm font-medium">{title}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
