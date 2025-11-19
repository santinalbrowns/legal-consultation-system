import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "CLIENT") {
    redirect("/dashboard/client")
  } else if (session.user.role === "LAWYER") {
    redirect("/dashboard/lawyer")
  } else if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin")
  }

  redirect("/login")
}
