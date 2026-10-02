"use client"

import * as React from "react"
import { ListPlus, Lock, Trash2 } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
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
import { Textarea } from "@/shared/components/ui/textarea"
import type { FieldType, FormField, SocialPlatform } from "@/shared/types"

import type { BuilderForm } from "../FormBuilderView"
import { FIELD_TYPE_META } from "./BuilderPalette"

const PREFILL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "— None —" },
  { value: "pradhan.name", label: "Pradhan name" },
  { value: "pradhan.phone", label: "Phone" },
  { value: "pradhan.whatsapp", label: "WhatsApp" },
  { value: "pradhan.email", label: "Email" },
  { value: "pradhan.panchayat", label: "Gram Panchayat" },
  { value: "pradhan.block", label: "Block" },
  { value: "pradhan.district", label: "District" },
  { value: "pradhan.state", label: "State" },
]

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "instagram", "facebook", "twitter", "youtube", "whatsapp", "linkedin", "telegram", "koo",
]

export function BuilderInspector({
  form,
  onForm,
  field,
  onFieldPatch,
  onDeselect,
}: {
  form: BuilderForm
  onForm: (patch: Partial<BuilderForm>) => void
  field: FormField | null
  onFieldPatch: (patch: Partial<FormField>) => void
  onDeselect: () => void
}) {
  return (
    <div className="max-h-[calc(100vh-10rem)] overflow-y-auto rounded-xl border border-border/60 bg-card">
      <header className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {field ? "Field settings" : "Form settings"}
        </p>
        {field && (
          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={onDeselect}>
            Clear selection
          </Button>
        )}
      </header>
      <div className="space-y-4 p-4">
        {field ? <FieldSettings field={field} onPatch={onFieldPatch} /> : <FormSettings form={form} onForm={onForm} />}
      </div>
    </div>
  )
}

/* ─── form settings ──────────────────────────────────────────── */

function FormSettings({ form, onForm }: { form: BuilderForm; onForm: (patch: Partial<BuilderForm>) => void }) {
  return (
    <div className="space-y-4">
      <Section title="General">
        <Field label="Title">
          <Input value={form.title} onChange={(e) => onForm({ title: e.target.value })} />
        </Field>
        <Field label="Description">
          <Textarea rows={3} value={form.description || ""} onChange={(e) => onForm({ description: e.target.value })} />
        </Field>
      </Section>

      <Section title="Visibility">
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => onForm({ status: v as BuilderForm["status"] })}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Access">
          <Select value={form.access_type || "public"} onValueChange={(v) => onForm({ access_type: v as BuilderForm["access_type"] })}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title="Submission">
        <Toggle
          label="Require consent"
          hint="Villagers must tick a consent box before submitting."
          value={!!form.require_consent}
          onChange={(v) => onForm({ require_consent: v })}
        />
      </Section>
    </div>
  )
}

/* ─── field settings ─────────────────────────────────────────── */

function FieldSettings({ field, onPatch }: { field: FormField; onPatch: (p: Partial<FormField>) => void }) {
  const meta = FIELD_TYPE_META[field.type as FieldType]
  const Icon = meta?.icon

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-md bg-muted/60 p-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-foreground/70" />}
        <span className="text-xs font-medium">{meta?.label || field.type}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{meta?.group}</span>
      </div>

      <Section title="Basics">
        <Field label="Label">
          <Input value={field.label} onChange={(e) => onPatch({ label: e.target.value })} />
        </Field>
        {field.type !== "yes_no" && field.type !== "photo" && field.type !== "pdf" && (
          <Field label="Placeholder">
            <Input value={field.placeholder || ""} onChange={(e) => onPatch({ placeholder: e.target.value })} />
          </Field>
        )}
        <Toggle
          label="Required"
          value={!!field.required}
          onChange={(v) => onPatch({ required: v })}
        />
      </Section>

      {["radio", "checkbox", "dropdown"].includes(field.type) && (
        <Section title="Options">
          <OptionsEditor
            options={field.options || []}
            onChange={(o) => onPatch({ options: o })}
          />
        </Section>
      )}

      {(field.type === "photo" || field.type === "pdf") && (
        <Section title="File limits">
          <Field label="Max files">
            <Input
              type="number"
              min={1}
              max={10}
              value={field.maxFiles || 1}
              onChange={(e) => onPatch({ maxFiles: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
            />
          </Field>
        </Section>
      )}

      {field.type === "social_media" && (
        <Section title="Platforms">
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {SOCIAL_PLATFORMS.map((p) => {
              const on = field.platforms?.includes(p)
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const next = new Set(field.platforms || [])
                    if (next.has(p)) next.delete(p); else next.add(p)
                    onPatch({ platforms: Array.from(next) as SocialPlatform[] })
                  }}
                  className={cn(
                    "rounded-md border px-2 py-1 text-left transition",
                    on
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-border"
                  )}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {field.type === "constituency" && (
        <Section title="Levels to show">
          <Toggle
            label="State"
            value={!!field.constituency_config?.show_state}
            onChange={(v) => onPatch({ constituency_config: { show_state: v, show_ls: field.constituency_config?.show_ls ?? true, show_vs: field.constituency_config?.show_vs ?? true, show_block: field.constituency_config?.show_block ?? false } })}
          />
          <Toggle
            label="Lok Sabha"
            value={!!field.constituency_config?.show_ls}
            onChange={(v) => onPatch({ constituency_config: { show_state: field.constituency_config?.show_state ?? true, show_ls: v, show_vs: field.constituency_config?.show_vs ?? true, show_block: field.constituency_config?.show_block ?? false } })}
          />
          <Toggle
            label="Vidhan Sabha"
            value={!!field.constituency_config?.show_vs}
            onChange={(v) => onPatch({ constituency_config: { show_state: field.constituency_config?.show_state ?? true, show_ls: field.constituency_config?.show_ls ?? true, show_vs: v, show_block: field.constituency_config?.show_block ?? false } })}
          />
          <Toggle
            label="Block"
            value={!!field.constituency_config?.show_block}
            onChange={(v) => onPatch({ constituency_config: { show_state: field.constituency_config?.show_state ?? true, show_ls: field.constituency_config?.show_ls ?? true, show_vs: field.constituency_config?.show_vs ?? true, show_block: v } })}
          />
        </Section>
      )}

      {/* Pradhan autofill — surfaces the schema we added earlier for intake. */}
      <Section title="Autofill" icon={Lock}>
        <Field
          label="From Pradhan profile"
          hint="When this form is opened via a Pradhan intake link, pre-fill the field and lock it."
        >
          <Select
            value={field.prefill_from || ""}
            onValueChange={(v) => onPatch({ prefill_from: v || undefined })}
          >
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PREFILL_OPTIONS.map((o) => (
                <SelectItem key={o.value || "none"} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>
    </div>
  )
}

/* ─── atoms ──────────────────────────────────────────────────── */

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h4 className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {Icon && <Icon className="h-2.5 w-2.5" />}
        {title}
      </h4>
      {children}
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background p-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{label}</p>
        {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  )
}

function OptionsEditor({ options, onChange }: { options: string[]; onChange: (o: string[]) => void }) {
  const edit = (i: number, v: string) => {
    const next = [...options]; next[i] = v; onChange(next)
  }
  const add = () => onChange([...options, `Option ${options.length + 1}`])
  const rm = (i: number) => onChange(options.filter((_, j) => j !== i))
  return (
    <div className="space-y-1.5">
      {options.map((o, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input value={o} onChange={(e) => edit(i, e.target.value)} className="h-8 text-xs" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => rm(i)}
            disabled={options.length <= 1}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-full justify-center" onClick={add}>
        <ListPlus className="h-3.5 w-3.5" /> Add option
      </Button>
    </div>
  )
}
