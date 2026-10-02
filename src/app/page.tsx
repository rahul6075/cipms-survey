import { redirect } from "next/navigation"
import { auth } from "@/shared/lib/auth"

export default async function Home() {
  const session = await auth()
  if (session) redirect("/dashboard")
  redirect("/login")
}
