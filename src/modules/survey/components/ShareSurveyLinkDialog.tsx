"use client"

import * as React from "react"
import QRCode from "qrcode"
import { toast } from "sonner"
import {
  CheckCircle2,
  Copy,
  Download,
  Link as LinkIcon,
  Loader2,
  MessageCircle,
  X,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { PhotoLightbox } from "@/shared/components/PhotoLightbox"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"

export type SharePradhan = {
  name: string
  photo?: string
  panchayat?: string
  phone?: string
}

export type ShareFormInfo = { title: string }

/**
 * Build the public survey URL. QR codes are NEVER stored — they're derived from
 * (token, base URL) and regenerated on demand. Changing the base URL (via
 * NEXT_PUBLIC_APP_URL) retroactively fixes every QR.
 */
export function buildSurveyUrl(token: string) {
  const envBase = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")
  if (envBase) return `${envBase}/survey/${token}`
  if (typeof window === "undefined") return `/survey/${token}`
  return `${window.location.origin}/survey/${token}`
}

function isLocalhost(url: string) {
  try {
    const { hostname } = new URL(url)
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname.endsWith(".localhost")
  } catch { return false }
}

/**
 * Pure share block. Renders the QR + pradhan card + URL + copy / WhatsApp /
 * download, with no dialog chrome. Both the intake success dialog and the
 * drawer's inline Show-QR expander use this.
 */
export function SurveyShareBlock({
  token,
  pradhan,
  form,
  compact,
  showPradhanCard = true,
}: {
  token: string
  pradhan?: SharePradhan | null
  form?: ShareFormInfo | null
  /** Smaller spacing / QR for inline use inside drawers etc. */
  compact?: boolean
  showPradhanCard?: boolean
}) {
  const [qr, setQr] = React.useState<string>("")
  const shareUrl = buildSurveyUrl(token)
  const localhost = isLocalhost(shareUrl)
  const qrSize = compact ? 180 : 240

  React.useEffect(() => {
    if (!token) { setQr(""); return }
    QRCode.toDataURL(shareUrl, { margin: 1, width: qrSize + 40 })
      .then(setQr)
      .catch(() => setQr(""))
  }, [token, shareUrl, qrSize])

  const copyLink = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied")
    } catch { toast.error("Could not copy") }
  }, [shareUrl])

  const shareWhatsApp = React.useCallback(() => {
    const digits = (pradhan?.phone || "").replace(/\D/g, "")
    const text = encodeURIComponent(`Namaste! Please fill this survey: ${shareUrl}`)
    const url = digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`
    window.open(url, "_blank", "noopener,noreferrer")
  }, [shareUrl, pradhan?.phone])

  const downloadQr = React.useCallback(() => {
    if (!qr) return
    const a = document.createElement("a")
    a.href = qr
    const slug = (pradhan?.name || "pradhan").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    a.download = `${slug}-survey-qr.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }, [qr, pradhan?.name])

  return (
    <div className={cn("space-y-3", compact ? "" : "space-y-4")}>
      {localhost && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
          <p className="font-medium">This QR encodes a localhost URL.</p>
          <p className="mt-1 opacity-90">
            Set <code className="rounded bg-amber-500/20 px-1">NEXT_PUBLIC_APP_URL</code> to a reachable host so phones can scan.
          </p>
        </div>
      )}

      {showPradhanCard && pradhan && (
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
          {pradhan.photo ? (
            <PhotoLightbox src={pradhan.photo} alt={pradhan.name} className="shrink-0 rounded-full">
              <Avatar className="h-12 w-12">
                <AvatarImage src={pradhan.photo} alt={pradhan.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {pradhan.name?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </PhotoLightbox>
          ) : (
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {pradhan.name?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{pradhan.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {pradhan.panchayat || ""}
              {pradhan.phone ? ` · ${pradhan.phone}` : ""}
            </p>
            {form?.title && (
              <p className="truncate text-[11px] text-muted-foreground">Form: {form.title}</p>
            )}
          </div>
        </div>
      )}

      <div
        className="flex items-center justify-center rounded-xl border border-border/70 bg-white p-4"
        style={{ minHeight: qrSize + 16 }}
      >
        {qr ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qr}
            alt="Survey QR code"
            style={{ width: qrSize, height: qrSize }}
          />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-stretch gap-1 rounded-lg border border-border/70 p-1">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2 text-xs">
            <LinkIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{shareUrl}</span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={copyLink} className="shrink-0">
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={shareWhatsApp}>
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
          <Button type="button" variant="outline" onClick={downloadQr} disabled={!qr}>
            <Download className="h-4 w-4" /> Download QR
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Dialog wrapper — used by the intake success flow where no drawer is open.
 * Prefer `<SurveyShareBlock>` directly when embedding inside another surface.
 */
export function ShareSurveyLinkDialog({
  open,
  onOpenChange,
  token,
  pradhan,
  form,
  title,
  reused,
  footer,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  token: string | null
  pradhan: SharePradhan | null
  form?: ShareFormInfo | null
  title?: string
  reused?: boolean
  /** Optional extra action row rendered below the standard buttons. */
  footer?: React.ReactNode
}) {
  const resolvedTitle = title || (reused ? "Existing Pradhan · new link" : "Survey link")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            {resolvedTitle}
          </DialogTitle>
          <DialogDescription>
            Share this personalised survey link with the Pradhan.
          </DialogDescription>
        </DialogHeader>

        {token && (
          <SurveyShareBlock token={token} pradhan={pradhan} form={form} />
        )}

        {footer}

        <Button type="button" variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
          <X className="h-4 w-4" /> Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
