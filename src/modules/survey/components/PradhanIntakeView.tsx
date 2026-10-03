"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Camera,
  Loader2,
  Plus,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react"

import { PhotoLightbox } from "@/shared/components/PhotoLightbox"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Switch } from "@/shared/components/ui/switch"
import { ShareSurveyLinkDialog } from "./ShareSurveyLinkDialog"

type Role = "super_admin" | "admin"

type FormOption = { _id: string; title: string; status?: string }

type IntakeResult = {
  reused: boolean
  user: { _id: string; name: string; profile_data: Record<string, unknown> }
  assignment: { _id: string; token: string }
  form: { _id: string; title: string }
  url: string
}


export function PradhanIntakeView({ sessionRole }: { sessionRole: Role }) {
  // Form state
  const [name, setName] = React.useState("")
  const [photo, setPhoto] = React.useState("")
  const [mobile, setMobile] = React.useState("")
  const [whatsappSame, setWhatsappSame] = React.useState(true)
  const [whatsapp, setWhatsapp] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [state, setState] = React.useState("")
  const [district, setDistrict] = React.useState("")
  const [block, setBlock] = React.useState("")
  const [panchayat, setPanchayat] = React.useState("")
  const [formId, setFormId] = React.useState("")

  // Resources
  const [forms, setForms] = React.useState<FormOption[]>([])
  const [defaultFormId, setDefaultFormId] = React.useState<string | null>(null)
  const [loadingForms, setLoadingForms] = React.useState(true)

  // Submit state
  const [submitting, setSubmitting] = React.useState(false)
  const [result, setResult] = React.useState<IntakeResult | null>(null)

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  // Load forms + settings in parallel
  React.useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/forms").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/settings").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([formsResp, settingsResp]) => {
        if (cancelled) return
        const active = (Array.isArray(formsResp) ? formsResp : [])
          .filter((f: FormOption) => f.status !== "closed")
          .map((f: FormOption) => ({ _id: String(f._id), title: f.title, status: f.status }))
        setForms(active)
        const def = settingsResp?.default_intake_form_id || null
        setDefaultFormId(def)
        if (def && active.some((f: FormOption) => f._id === def)) {
          setFormId(def)
        } else if (active.length === 1) {
          setFormId(active[0]._id)
        }
      })
      .finally(() => !cancelled && setLoadingForms(false))
    return () => { cancelled = true }
  }, [])

  function reset() {
    setName(""); setPhoto(""); setMobile(""); setWhatsapp(""); setEmail("")
    setState(""); setDistrict(""); setBlock(""); setPanchayat("")
    setWhatsappSame(true)
    // Keep formId (same session usually)
    setResult(null)
  }

  async function handlePhoto(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB")
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files allowed")
      return
    }
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const r = await fetch("/api/upload", { method: "POST", body: fd })
      if (!r.ok) throw new Error("Upload failed")
      const d = await r.json()
      setPhoto(d.url)
      toast.success("Photo uploaded")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploadingPhoto(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!mobile.trim() || !panchayat.trim() || !formId) {
      toast.error("Mobile, Gram Panchayat and form are required")
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch("/api/pradhan-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          photo,
          mobile: mobile.trim(),
          whatsapp: whatsappSame ? mobile.trim() : whatsapp.trim(),
          email: email.trim(),
          state: state.trim(),
          district: district.trim(),
          block: block.trim(),
          panchayat: panchayat.trim(),
          form_id: formId,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error || "Intake failed")
      setResult(data as IntakeResult)
      toast.success(data.reused ? "Existing Pradhan — new link generated" : "Pradhan added")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pradhan intake</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Capture a Gram Pradhan on the field and generate their personalised survey link.
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={submit} className="space-y-4">
          {/* Photo */}
          <section className="flex items-start gap-4">
            <div className="relative shrink-0">
              {photo ? (
                <PhotoLightbox src={photo} alt={name || "Pradhan"}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="Pradhan" className="h-20 w-20 rounded-xl object-cover ring-1 ring-border" />
                </PhotoLightbox>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted ring-1 ring-dashed ring-border">
                  <Camera className="h-6 w-6 text-muted-foreground/60" />
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                // `capture` makes mobile browsers open the back camera directly
                // (ignored on desktop — just opens the file picker).
                capture="environment"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handlePhoto(f) }}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadingPhoto}>
                  <Upload className="h-3.5 w-3.5" />
                  {photo ? "Replace photo" : "Capture photo"}
                </Button>
                {photo && (
                  <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setPhoto("")}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">On a phone this opens the back camera.</p>
            </div>
          </section>

          {/* Name */}
          <div className="space-y-1.5">
            <Label>Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
          </div>

          {/* Panchayat / jurisdiction */}
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Gram Panchayat <span className="text-destructive">*</span></Label>
              <Input value={panchayat} onChange={(e) => setPanchayat(e.target.value)} placeholder="Gram Panchayat name" required />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Uttar Pradesh" />
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Lucknow" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Block</Label>
              <Input value={block} onChange={(e) => setBlock(e.target.value)} placeholder="e.g. Mohanlalganj" />
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-3">
            <div className="space-y-1.5">
              <Label>Mobile <span className="text-destructive">*</span></Label>
              <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 ..." type="tel" required />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
              <div>
                <p className="text-sm font-medium">WhatsApp same as mobile</p>
                <p className="text-xs text-muted-foreground">Toggle off to enter a different number.</p>
              </div>
              <Switch checked={whatsappSame} onCheckedChange={setWhatsappSame} />
            </div>
            {!whatsappSame && (
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+91 ..." type="tel" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" type="email" />
            </div>
          </section>

          {/* Form picker */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Survey template <span className="text-destructive">*</span></Label>
              {defaultFormId && formId === defaultFormId && (
                <Badge variant="secondary" className="text-[10px]">default</Badge>
              )}
            </div>
            {loadingForms ? (
              <div className="flex h-9 items-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Loading forms…
              </div>
            ) : forms.length === 0 ? (
              <p className="text-xs text-destructive">No active forms. Create one first.</p>
            ) : (
              <Select value={formId} onValueChange={(v) => setFormId(v || "")}>
                <SelectTrigger><SelectValue placeholder="Choose a form" /></SelectTrigger>
                <SelectContent>
                  {forms.map((f) => (
                    <SelectItem key={f._id} value={f._id}>
                      {f.title}
                      {defaultFormId === f._id ? " · default" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {sessionRole === "super_admin" && (
              <DefaultFormHint
                currentDefault={defaultFormId}
                forms={forms}
                onChanged={(id) => setDefaultFormId(id)}
              />
            )}
          </section>

          <Button type="submit" disabled={submitting || !formId} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Add Pradhan &amp; generate link
          </Button>
        </form>
      </Card>

      <IntakeSuccessDialog
        result={result}
        onClose={() => setResult(null)}
        onAnother={() => reset()}
      />
    </div>
  )
}

/* ─── default-form hint (super_admin only) ───────────────────── */

function DefaultFormHint({
  currentDefault,
  forms,
  onChanged,
}: {
  currentDefault: string | null
  forms: FormOption[]
  onChanged: (id: string | null) => void
}) {
  const [busy, setBusy] = React.useState(false)
  const [value, setValue] = React.useState<string>(currentDefault || "")
  const [syncedDefault, setSyncedDefault] = React.useState(currentDefault)
  if (syncedDefault !== currentDefault) {
    setSyncedDefault(currentDefault)
    setValue(currentDefault || "")
  }

  async function save() {
    setBusy(true)
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_intake_form_id: value || null }),
      })
      if (!r.ok) throw new Error("Save failed")
      onChanged(value || null)
      toast.success("Default intake form updated")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="mt-2 rounded-lg border border-dashed border-border/70 p-3 text-xs">
      <summary className="cursor-pointer text-muted-foreground">Set default intake form for all agents</summary>
      <div className="mt-3 flex items-center gap-2">
        <Select value={value} onValueChange={(v) => setValue(v || "")}>
          <SelectTrigger className="h-8 w-full"><SelectValue placeholder="No default" /></SelectTrigger>
          <SelectContent>
            {forms.map((f) => (
              <SelectItem key={f._id} value={f._id}>{f.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="sm" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </details>
  )
}

/* ─── success dialog — thin wrapper around the shared share dialog ───── */

function IntakeSuccessDialog({
  result,
  onClose,
  onAnother,
}: {
  result: IntakeResult | null
  onClose: () => void
  onAnother: () => void
}) {
  return (
    <ShareSurveyLinkDialog
      open={!!result}
      onOpenChange={(o) => { if (!o) onClose() }}
      token={result?.assignment.token ?? null}
      pradhan={result ? {
        name: result.user.name,
        photo: (result.user.profile_data?.photo as string | undefined) || "",
        panchayat: (result.user.profile_data?.panchayat as string | undefined) || "",
        phone: (result.user.profile_data?.phone as string | undefined) || "",
      } : null}
      form={result ? { title: result.form.title } : null}
      reused={result?.reused}
      title={result?.reused ? "Existing Pradhan · new link" : "Pradhan added"}
      footer={
        <Button type="button" onClick={onAnother} className="w-full">
          <Plus className="h-4 w-4" /> Add another Pradhan
        </Button>
      }
    />
  )
}
