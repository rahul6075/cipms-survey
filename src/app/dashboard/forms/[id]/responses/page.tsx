import { redirect } from "next/navigation"

// Responses live in the Reports workbench (paginated, filterable, ownership-checked).
export default async function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/reports?formId=${encodeURIComponent(id)}`)
}
