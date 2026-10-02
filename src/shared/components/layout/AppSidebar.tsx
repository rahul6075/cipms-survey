"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  BarChart3,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Sparkles,
  UserPlus,
  Users,
  Vote,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/shared/components/ui/sidebar"

type Role = "super_admin" | "admin" | "agent"

type IconType = React.ComponentType<{ className?: string }>

type NavLeaf = {
  type?: "leaf"
  href: string
  label: string
  icon: IconType
  roles: Role[]
  match?: (pathname: string) => boolean
}

type NavGroup = {
  type: "group"
  key: string
  label: string
  icon: IconType
  roles: Role[]
  children: NavLeaf[]
}

type NavNode = NavLeaf | NavGroup

const mainNav: NavNode[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "agent"],
    match: (p) => p === "/dashboard",
  },
  {
    href: "/dashboard/users",
    label: "Users",
    icon: Users,
    roles: ["super_admin", "admin"],
  },
  {
    type: "group",
    key: "survey",
    label: "Survey",
    icon: ClipboardList,
    roles: ["super_admin", "admin"],
    children: [
      { href: "/dashboard/forms", label: "Forms", icon: FileText, roles: ["super_admin", "admin"] },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["super_admin"] },
    ],
  },
]

const quickNav: NavLeaf[] = [
  { href: "/dashboard/pradhan-intake", label: "Pradhan intake", icon: UserPlus, roles: ["super_admin", "admin"] },
  { href: "/dashboard/forms/new", label: "New Form", icon: PlusCircle, roles: ["super_admin", "admin"] },
]

const roleLabel: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  agent: "Gram Pradhan",
}

const rolePill: Record<Role, string> = {
  super_admin: "bg-primary/10 text-primary",
  admin: "bg-chart-3/15 text-chart-3",
  agent: "bg-chart-2/15 text-chart-2",
}

function isLeafActive(item: NavLeaf, pathname: string) {
  if (item.match) return item.match(pathname)
  return pathname === item.href || pathname.startsWith(item.href + "/")
}

function filterForRole(nodes: NavNode[], role: Role): NavNode[] {
  return nodes
    .filter((n) => n.roles.includes(role))
    .map((n) => {
      if ("type" in n && n.type === "group") {
        const kids = n.children.filter((c) => c.roles.includes(role))
        return { ...n, children: kids }
      }
      return n
    })
    .filter((n) => !("type" in n && n.type === "group" && n.children.length === 0))
}

/* ────── Leaf item ───────────────────────────────────────────── */
function NavLeafItem({ item, pathname }: { item: NavLeaf; pathname: string }) {
  const active = isLeafActive(item, pathname)
  const Icon = item.icon
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={item.label}
        render={<Link href={item.href} />}
      >
        <Icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/* ────── Group item (collapsible when expanded; popover when collapsed) ─ */
function NavGroupItem({ item, pathname }: { item: NavGroup; pathname: string }) {
  const { state } = useSidebar()
  const Icon = item.icon
  const anyChildActive = item.children.some((c) => isLeafActive(c, pathname))

  if (state === "collapsed") {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                isActive={anyChildActive}
                className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
              />
            }
          >
            <Icon />
            <span>{item.label}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={8}
            className="w-48 rounded-lg"
            style={{ width: "12rem" }}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {item.label}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            {item.children.map((c) => {
              const ChildIcon = c.icon
              const active = isLeafActive(c, pathname)
              return (
                <DropdownMenuItem
                  key={c.href}
                  render={<Link href={c.href} />}
                  className={cn(active && "bg-sidebar-accent text-sidebar-accent-foreground")}
                >
                  <ChildIcon className="size-4" />
                  <span>{c.label}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible defaultOpen={anyChildActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger
          render={
            <SidebarMenuButton isActive={anyChildActive} tooltip={item.label}>
              <Icon />
              <span>{item.label}</span>
              <ChevronRight className="ml-auto size-4 transition-transform group-data-[panel-open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          }
        />
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((c) => {
              const ChildIcon = c.icon
              const active = isLeafActive(c, pathname)
              return (
                <SidebarMenuSubItem key={c.href}>
                  <SidebarMenuSubButton isActive={active} render={<Link href={c.href} />}>
                    <ChildIcon />
                    <span>{c.label}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user?.role as Role) || "agent"
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  const main = filterForRole(mainNav, role)
  const quick = quickNav.filter((i) => i.roles.includes(role))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div
          className={cn(
            "flex items-center py-1",
            collapsed ? "justify-center" : "gap-2.5 px-1.5"
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[0_2px_10px_oklch(0.71_0.18_48/0.3)]">
            <Vote className="size-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold tracking-tight">CIPMS</p>
              <p className="truncate text-[11px] text-muted-foreground">Survey Module</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((node) =>
                "type" in node && node.type === "group" ? (
                  <NavGroupItem key={node.key} item={node} pathname={pathname} />
                ) : (
                  <NavLeafItem key={(node as NavLeaf).href} item={node as NavLeaf} pathname={pathname} />
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {quick.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quick.map((item) => (
                  <NavLeafItem key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="What's new" render={<Link href="/dashboard" />}>
              <Sparkles />
              <span>What&apos;s new</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    tooltip={session?.user?.name || "Account"}
                    className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-bold">
                    {session?.user?.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{session?.user?.name || "User"}</span>
                  <span className={cn("mt-0.5 inline-flex w-fit rounded-full px-1.5 py-0.5 text-[10px] font-medium", rolePill[role])}>
                    {roleLabel[role]}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-56 rounded-lg">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Signed in as{" "}
                    <span className="font-medium text-foreground">{session?.user?.email}</span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  <Settings className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
