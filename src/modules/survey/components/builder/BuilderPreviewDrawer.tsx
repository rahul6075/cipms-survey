"use client"

import * as React from "react"
import { Monitor, Smartphone, Tablet } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet"
import type { FormField } from "@/shared/types"
import { SurveyFieldRenderer } from "@/modules/survey/components/SurveyPreviewRenderer"
import type { BuilderForm } from "../FormBuilderView"

type Device = "mobile" | "tablet" | "desktop"

const DEVICE_META: Record<Device, { icon: React.ComponentType<{ className?: string }>; width: number; label: string }> = {
  mobile:  { icon: Smartphone, width: 390, label: "Mobile" },
  tablet:  { icon: Tablet,     width: 760, label: "Tablet" },
  desktop: { icon: Monitor,    width: 1024, label: "Desktop" },
}

export function BuilderPreviewDrawer({
  open,
  onOpenChange,
  form,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  form: BuilderForm
}) {
  const [device, setDevice] = React.useState<Device>("mobile")
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({})

  // Reset answers whenever the drawer re-opens so each preview session is clean.
  React.useEffect(() => {
    if (open) setAnswers({})
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[720px] md:max-w-[800px] lg:max-w-[920px] xl:max-w-[min(60vw,1100px)]"
      >
        <SheetHeader className="shrink-0 gap-0 border-b border-border/70 px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="text-sm">Live preview</SheetTitle>
            <div className="inline-flex rounded-md border border-border p-0.5">
              {(Object.keys(DEVICE_META) as Device[]).map((d) => {
                const meta = DEVICE_META[d]
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    className={cn(
                      "flex h-7 w-9 items-center justify-center rounded-sm text-muted-foreground transition",
                      device === d && "bg-muted text-foreground"
                    )}
                    aria-label={meta.label}
                    title={meta.label}
                  >
                    <meta.icon className="h-3.5 w-3.5" />
                  </button>
                )
              })}
            </div>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Shows how villagers will see this form. A dummy Pradhan branding card is included.
          </p>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4">
          <div
            className="mx-auto overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm transition-all"
            style={{ width: Math.min(DEVICE_META[device].width, 1200), maxWidth: "100%" }}
          >
            <PradhanBrandingCard />

            <div className="space-y-3 p-4">
              {form.title && (
                <div>
                  <h2 className="text-base font-semibold">{form.title}</h2>
                  {form.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{form.description}</p>
                  )}
                </div>
              )}

              {form.fields.length === 0 ? (
                <p className="rounded-md border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
                  Add fields to see the preview come to life.
                </p>
              ) : (
                form.fields.map((f, i) => (
                  <PreviewField
                    key={f.id}
                    field={f}
                    index={i + 1}
                    value={answers[f.id]}
                    locked={!!f.prefill_from}
                    onChange={(v) => setAnswers((p) => ({ ...p, [f.id]: v }))}
                  />
                ))
              )}

              <button
                type="button"
                className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground opacity-60"
                disabled
              >
                Submit survey (preview — disabled)
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PreviewField({
  field,
  index,
  value,
  locked,
  onChange,
}: {
  field: FormField
  index: number
  value: unknown
  locked: boolean
  onChange: (v: unknown) => void
}) {
  // When locked (prefill_from set), inject a reasonable dummy value so villagers
  // see what their survey looks like with real data.
  const effectiveValue = locked ? dummyFromPrefill(field.prefill_from) : value

  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
          {index}
        </span>
        <p className="text-xs font-semibold">
          {field.label || <span className="italic text-muted-foreground">Untitled</span>}
          {field.required && <span className="ml-0.5 text-destructive">*</span>}
        </p>
        {locked && (
          <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
            auto-filled
          </span>
        )}
      </div>
      <div className={cn(locked && "pointer-events-none opacity-80")}>
        <SurveyFieldRenderer field={field} value={effectiveValue} onChange={onChange} preview />
      </div>
    </div>
  )
}

function PradhanBrandingCard() {
  return (
    <div className="flex items-center gap-3 bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
        RK
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Gram Pradhan</p>
        <p className="truncate text-sm font-semibold">Ramesh Kumar (preview)</p>
        <p className="truncate text-[11px] text-muted-foreground">Barabanki Rural GP · Haidergarh · Barabanki · Uttar Pradesh</p>
      </div>
    </div>
  )
}

function dummyFromPrefill(from?: string): string {
  switch (from) {
    case "pradhan.name":      return "Ramesh Kumar"
    case "pradhan.phone":     return "+91 90000 11111"
    case "pradhan.whatsapp":  return "+91 90000 11111"
    case "pradhan.email":     return "ramesh@example.in"
    case "pradhan.panchayat": return "Barabanki Rural GP"
    case "pradhan.block":     return "Haidergarh"
    case "pradhan.district":  return "Barabanki"
    case "pradhan.state":     return "Uttar Pradesh"
    default: return ""
  }
}
