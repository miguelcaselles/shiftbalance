import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <Sidebar userRole={session.user.role} />
      <div className="lg:pl-72">
        <Header user={session.user} notificationCount={0} />
        <main className="p-4 lg:p-6 animate-in">
          {children}
        </main>
      </div>
    </div>
  )
}
