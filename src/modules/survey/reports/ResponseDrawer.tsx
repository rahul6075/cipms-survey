"use client"

import * as React from "react"
import { Clock, Loader2, Mail, MapPin, Monitor, Phone, Smartphone, User as UserIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { PhotoLightbox } from "@/shared/components/PhotoLightbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet"

type ResponseDetail = {
  _id: string
  submitted_at: string
  device?: string
  answers: Record<string, unknown>
  location: { lat: number; lng: number } | null
  agent?: {
    _id?: string
    name?: string
    email?: string
    profile_data?: Record<string, unknown>
  } | null
  assignment?: {
    token?: string
    pradhan_snapshot?: Record<string, unknown>
  } | null
  form: {
    title: string
    fields: Array<{ id: string; label: string; type: string; options?: string[] }>
  }
}

export function ResponseDrawer({
  responseId,
  open,
  onOpenChange,
}: {
  responseId: string | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [data, setData] = React.useState<ResponseDetail | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open || !responseId) return
    let cancelled = false
    setLoading(true)
    setData(null)
    fetch(`/api/responses/by-id/${responseId}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [open, responseId])

  const pradhan = React.useMemo(() => {
    if (!data) return null
    const profile = (data.agent?.profile_data || {}) as Record<string, string | undefined>
    const snap = (data.assignment?.pradhan_snapshot || {}) as Record<string, string | undefined>
    return {
      name: data.agent?.name || snap.name || "Anonymous",
      photo: profile.photo || snap.photo || "",
      panchayat: profile.panchayat || snap.panchayat || "",
      block: profile.block || snap.block || "",
      district: profile.district || snap.district || "",
      state: profile.state || snap.state || "",
      phone: profile.phone || snap.phone || "",
      email: data.agent?.email || snap.email || "",
    }
  }, [data])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px] md:max-w-[640px] lg:max-w-[720px] xl:max-w-[50vw] 2xl:max-w-[min(50vw,920px)]"
      >
        {loading && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && data && (
          <>
            <SheetHeader className="shrink-0 gap-0 border-b border-border/70 px-6 py-5">
              <div className="flex items-start gap-4">
                {pradhan?.photo ? (
                  <PhotoLightbox src={pradhan.photo} alt={pradhan.name} className="shrink-0 rounded-full">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={pradhan.photo} alt={pradhan.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {pradhan.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </PhotoLightbox>
                ) : (
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {pradhan?.name?.slice(0, 2).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0 flex-1 pt-0.5">
                  <SheetTitle className="truncate text-base">{pradhan?.name || "Anonymous"}</SheetTitle>
                  <SheetDescription className="truncate text-xs">
                    {[pradhan?.panchayat, pradhan?.block, pradhan?.district, pradhan?.state].filter(Boolean).join(" · ") || data.form.title}
                  </SheetDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(data.submitted_at).toLocaleString("en-IN")}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      {data.device === "desktop" ? <Monitor className="h-2.5 w-2.5" /> : <Smartphone className="h-2.5 w-2.5" />}
                      {data.device || "mobile"}
                    </Badge>
                    {pradhan?.phone && (
                      <Badge variant="outline" className="gap-1">
                        <Phone className="h-2.5 w-2.5" />
                        {pradhan.phone}
                      </Badge>
                    )}
                    {pradhan?.email && (
                      <Badge variant="outline" className="gap-1">
                        <Mail className="h-2.5 w-2.5" />
                        {pradhan.email}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {data.location && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-xs">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  Submitted from <span className="font-mono text-[11px]">{data.location.lat.toFixed(4)}, {data.location.lng.toFixed(4)}</span>
                </div>
              )}

              <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Answers · {data.form.title}
              </h4>
              <ul className="space-y-3">
                {data.form.fields.map((f) => (
                  <AnswerRow key={f.id} field={f} value={data.answers?.[f.id]} />
                ))}
              </ul>
            </div>
          </>
        )}

        {!loading && !data && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
            <UserIcon className="h-6 w-6 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">Could not load response.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function AnswerRow({
  field,
  value,
}: {
  field: { id: string; label: string; type: string }
  value: unknown
}) {
  const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)

  return (
    <li className={cn("rounded-lg border border-border/70 bg-card p-3", empty && "opacity-60")}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs font-medium">{field.label}</p>
        <Badge variant="secondary" className="text-[10px] font-normal">{field.type}</Badge>
      </div>
      <div className="text-sm">
        {empty ? (
          <span className="text-xs italic text-muted-foreground">no answer</span>
        ) : (
          <AnswerBody value={value} type={field.type} />
        )}
      </div>
    </li>
  )
}

function AnswerBody({ value, type }: { value: unknown; type: string }) {
  if (type === "photo") {
    const urls = (Array.isArray(value) ? value : [value]).filter(
      (v): v is string => typeof v === "string" && v.startsWith("http")
    )
    return (
      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <PhotoLightbox key={i} src={u} alt={`photo ${i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-20 w-20 rounded-md object-cover" />
          </PhotoLightbox>
        ))}
      </div>
    )
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => (
          <Badge key={i} variant="outline" className="text-[11px] font-normal">{String(v)}</Badge>
        ))}
      </div>
    )
  }

  if (typeof value === "object" && value !== null) {
    return <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{JSON.stringify(value, null, 2)}</pre>
  }

  return <span className="break-words">{String(value)}</span>
}
