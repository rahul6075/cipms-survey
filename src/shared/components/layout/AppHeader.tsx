"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb"
import { Separator } from "@/shared/components/ui/separator"
import { SidebarTrigger } from "@/shared/components/ui/sidebar"

type Crumb = { label: string; href?: string }

const SEGMENT_LABEL: Record<string, string> = {
  dashboard: "Dashboard",
  forms: "Forms",
  users: "Users",
  reports: "Reports",
  new: "New",
  edit: "Edit",
  responses: "Responses",
  assign: "Assign",
}

function toTitle(seg: string) {
  if (SEGMENT_LABEL[seg]) return SEGMENT_LABEL[seg]
  if (/^[0-9a-f]{24}$/i.test(seg)) return "Detail"
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/[-_]/g, " ")
}

export function buildCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean)
  return parts.map((seg, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/")
    return { label: toTitle(seg), href }
  })
}

export function AppHeader({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname()
  const crumbs = buildCrumbs(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 !h-5" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <React.Fragment key={c.href}>
                <BreadcrumbItem className="hidden sm:inline-flex">
                  {isLast || !c.href ? (
                    <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="hidden sm:inline-flex" />}
              </React.Fragment>
            )
          })}
          {/* Mobile fallback: just last crumb */}
          <BreadcrumbItem className="sm:hidden">
            <BreadcrumbPage className="truncate">
              {crumbs[crumbs.length - 1]?.label ?? ""}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  )
}
