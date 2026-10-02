"use client"

import * as React from "react"
import { toast } from "sonner"
import { Activity, Loader2, Mail, Shield, Sparkles, Trash2, Upload, User as UserIcon, Clipboard } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
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
import type { Role, UserRow } from "./UsersViewNew"

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

  React.useEffect(() => {
    setProfile((user?.profile_data as Record<string, unknown>) || {})
  }, [user])

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
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {/* Header */}
        <SheetHeader className="shrink-0 gap-0 border-b border-border/70 px-5 py-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 shrink-0">
              {typeof profile.photo === "string" && profile.photo && (
                <AvatarImage src={profile.photo} alt={user.name} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {user.name?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-base">{user.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 truncate text-xs">
                <Mail className="h-3 w-3" /> {user.email}
              </SheetDescription>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-[11px]">{ROLE_LABEL[user.role]}</Badge>
                <Badge variant="secondary" className="text-[11px]">
                  {user.status || (user.is_active ? "active" : "inactive")}
                </Badge>
              </div>
            </div>
          </div>

          {schema && (user.profile_percent ?? 0) < 100 && (
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-amber-500/10 p-3 text-xs">
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
          <TabsList className="mx-5 mt-3 w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <KV k="Full name" v={user.name} />
              <KV k="Email" v={user.email} icon={Mail} />
              <KV k="Role" v={ROLE_LABEL[user.role]} />
              <KV k="Status" v={user.status || (user.is_active ? "active" : "inactive")} />
              <KV k="Created by" v={user.created_by?.name || "—"} />
              <KV k="Joined" v={new Date(user.createdAt).toLocaleString("en-IN")} />
              <KV k="Last active" v={user.last_active_at ? new Date(user.last_active_at).toLocaleString("en-IN") : "—"} icon={Activity} />
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
                      <div className="grid gap-3">
                        {fields.map((f) => (
                          <ProfileFieldInput
                            key={f.key}
                            field={f}
                            value={profile[f.key]}
                            onChange={(v) => setProfile((p) => ({ ...p, [f.key]: v }))}
                            disabled={!canEdit}
                          />
                        ))}
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

            <TabsContent value="assignments" className="mt-0">
              <EmptyTab
                icon={Clipboard}
                title="No assignments yet"
                sub="Form assignments for this user will show here."
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

function KV({ k, v, icon: Icon }: { k: string; v: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/60 pb-3 last:border-0">
      <div className="w-32 shrink-0 text-xs font-medium text-muted-foreground">{k}</div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="truncate">{v}</span>
      </div>
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
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={value}
            alt="Profile"
            className="h-16 w-16 rounded-xl object-cover ring-1 ring-border"
          />
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
