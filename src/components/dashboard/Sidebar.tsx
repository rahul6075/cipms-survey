"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { LayoutDashboard, FileText, Users, BarChart3, Vote, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "agent"] },
  { href: "/dashboard/forms", label: "Forms", icon: FileText, roles: ["super_admin", "admin"] },
  { href: "/dashboard/users", label: "Users", icon: Users, roles: ["super_admin", "admin"] },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["super_admin"] },
]

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  agent: "Gram Pradhan",
}

const rolePill: Record<string, string> = {
  super_admin: "bg-orange-100 text-orange-600",
  admin: "bg-blue-100 text-blue-600",
  agent: "bg-green-100 text-green-600",
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role || "agent"
  const allowed = navItems.filter((i) => i.roles.includes(role))

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-gray-100/80 px-3 py-5 shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-3 px-3 mb-7">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-[0_2px_8px_rgba(249,115,22,0.3)] shrink-0">
          <Vote className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-none tracking-tight">CIPMS</p>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">Survey Module</p>
        </div>
      </div>

      {/* Nav label */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-2">Menu</p>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {allowed.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}>
              <div className="relative">
                {/* Active left bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-orange-500"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <motion.div
                  whileHover={{ x: isActive ? 0 : 3 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer select-none",
                    isActive
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-orange-500" : "text-gray-400")} />
                  <span>{item.label}</span>
                </motion.div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom user section */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 mb-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-orange-100 text-orange-600 text-xs font-bold">
              {session?.user?.name?.slice(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-none mb-1">
              {session?.user?.name || "User"}
            </p>
            <span className={cn("inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold", rolePill[role])}>
              {roleLabel[role]}
            </span>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
          Sign out
        </button>
      </div>
    </div>
  )
}
