import { auth } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@/shared/components/ui/sidebar"
import { AppSidebar } from "@/shared/components/layout/AppSidebar"
import { AppHeader } from "@/shared/components/layout/AppHeader"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <SidebarProvider>
      <AppSidebar />
      {/* Viewport-height shell: only the content pane scrolls, so the header stays put. */}
      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <AppHeader />
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="w-full min-w-0 p-3 sm:p-4">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
