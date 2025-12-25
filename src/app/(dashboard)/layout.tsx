import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { db } from "@/lib/db"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Obtener contador de notificaciones no leídas
  const notificationCount = await db.notification.count({
    where: {
      userId: session.user.id,
      isRead: false,
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={session.user.role} />
      <div className="lg:pl-64">
        <Header user={session.user} notificationCount={notificationCount} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
