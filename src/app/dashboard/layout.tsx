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
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <AppHeader />
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full min-w-0 max-w-[1600px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
