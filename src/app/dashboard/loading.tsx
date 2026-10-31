import { Skeleton } from "@/shared/components/ui/skeleton"

// Shown the instant a dashboard link is clicked, while the next page renders on
// the server. Without it the old page stays put and the click looks ignored.
export default function DashboardLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
      <div className="space-y-2 rounded-xl p-4 ring-1 ring-border">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}
