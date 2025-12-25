import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import {
  Calendar,
  ArrowLeftRight,
  Bell,
  TrendingUp,
  Users,
  Clock,
  CalendarDays,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = session.user.role === "ADMIN"
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Optimized parallel queries
  const [nextShift, pendingChanges, monthlyShifts, notifications, adminData] = await Promise.all([
    session.user.employeeId
      ? db.scheduleEntry.findFirst({
          where: {
            employeeId: session.user.employeeId,
            date: { gte: currentDate },
            schedulePeriod: { status: "PUBLISHED" },
          },
          include: { shiftType: true },
          orderBy: { date: "asc" },
        })
      : null,
    db.shiftChangeRequest.count({
      where: {
        status: { in: ["OPEN", "SELECTING"] },
        ...(session.user.employeeId && { requesterId: { not: session.user.employeeId } }),
      },
    }),
    session.user.employeeId
      ? db.scheduleEntry.count({
          where: {
            employeeId: session.user.employeeId,
            schedulePeriod: { year: currentYear, month: currentMonth },
          },
        })
      : 0,
    db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    isAdmin
      ? Promise.all([
          db.user.count({ where: { status: "ACTIVE" } }),
          db.shiftChangeRequest.count({
            where: { status: { in: ["OPEN", "SELECTING", "AWAITING_APPROVAL"] } },
          }),
          db.shiftType.count(),
        ])
      : [0, 0, 0],
  ])

  const unreadNotifications = notifications.filter((n) => !n.isRead).length

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 20) return "Buenas tardes"
    return "Buenas noches"
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-emerald-600 to-teal-500 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute left-1/2 bottom-0 -mb-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-2">
            <Sparkles className="h-4 w-4" />
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <h1 className="text-3xl font-bold mb-1">
            {greeting()}, {session.user.firstName || session.user.email.split("@")[0]}
          </h1>
          <p className="text-white/80">
            {isAdmin
              ? "Tienes el control total del sistema de turnos"
              : "Aquí tienes un resumen de tu actividad"}
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Próximo turno */}
        <Link
          href="/worker/schedule"
          className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border hover:shadow-lg hover:border-primary/50 transition-all duration-300"
        >
          <div className="absolute right-4 top-4 rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/50">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Próximo turno</p>
          {nextShift ? (
            <>
              <p className="mt-2 text-2xl font-bold">
                {nextShift.date.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <div
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: nextShift.shiftType.color }}
              >
                {nextShift.shiftType.code} - {nextShift.shiftType.name}
              </div>
            </>
          ) : (
            <p className="mt-2 text-lg font-medium text-muted-foreground">Sin programar</p>
          )}
          <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Cambios disponibles */}
        <Link
          href="/worker/changes"
          className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border hover:shadow-lg hover:border-primary/50 transition-all duration-300"
        >
          <div className="absolute right-4 top-4 rounded-xl bg-purple-100 p-2.5 dark:bg-purple-900/50">
            <ArrowLeftRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Cambios disponibles</p>
          <p className="mt-2 text-3xl font-bold">{pendingChanges}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            solicitudes abiertas
          </p>
          <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Turnos este mes */}
        <Link
          href="/worker/schedule"
          className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border hover:shadow-lg hover:border-primary/50 transition-all duration-300"
        >
          <div className="absolute right-4 top-4 rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/50">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Turnos este mes</p>
          <p className="mt-2 text-3xl font-bold">{monthlyShifts}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString("es-ES", { month: "long" })}
          </p>
          <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Mensajes */}
        <Link
          href="/worker/messages"
          className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border hover:shadow-lg hover:border-primary/50 transition-all duration-300"
        >
          <div className="absolute right-4 top-4 rounded-xl bg-orange-100 p-2.5 dark:bg-orange-900/50">
            <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Notificaciones</p>
          <p className="mt-2 text-3xl font-bold">{unreadNotifications}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            sin leer
          </p>
          <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-orange-500" />
              <h2 className="text-xl font-bold">Notificaciones recientes</h2>
            </div>
            <Link
              href="/worker/messages"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              Ver todas
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border bg-card shadow-sm divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 flex gap-4 ${!notification.isRead ? "bg-primary/5" : ""}`}
              >
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/50">
                    <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{notification.title}</p>
                    {!notification.isRead && (
                      <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Nueva
                      </span>
                    )}
                  </div>
                  {notification.message && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {notification.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.createdAt.toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {notification.link && (
                  <Link
                    href={notification.link}
                    className="flex-shrink-0 self-center"
                  >
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-primary" />
            <h2 className="text-xl font-bold">Panel de Administración</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Usuarios */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
              <div className="absolute right-4 top-4 rounded-xl bg-white/20 p-2.5">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-white/80">Usuarios activos</p>
              <p className="mt-2 text-4xl font-bold">{adminData[0]}</p>
              <Link
                href="/admin/users"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white"
              >
                Gestionar usuarios
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Cambios activos */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 p-6 text-white shadow-lg">
              <div className="absolute right-4 top-4 rounded-xl bg-white/20 p-2.5">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-white/80">Cambios activos</p>
              <p className="mt-2 text-4xl font-bold">{adminData[1]}</p>
              <Link
                href="/worker/changes"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white"
              >
                Ver solicitudes
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Tipos de turno */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg">
              <div className="absolute right-4 top-4 rounded-xl bg-white/20 p-2.5">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-white/80">Tipos de turno</p>
              <p className="mt-2 text-4xl font-bold">{adminData[2]}</p>
              <Link
                href="/admin/shifts"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white"
              >
                Configurar turnos
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Acciones rápidas</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/admin/users/new"
                className="flex items-center gap-3 rounded-xl bg-muted/50 p-4 hover:bg-muted transition-colors"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">Nuevo usuario</span>
              </Link>
              <Link
                href="/admin/shifts/new"
                className="flex items-center gap-3 rounded-xl bg-muted/50 p-4 hover:bg-muted transition-colors"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">Nuevo turno</span>
              </Link>
              <Link
                href="/admin/schedules"
                className="flex items-center gap-3 rounded-xl bg-muted/50 p-4 hover:bg-muted transition-colors"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">Ver horarios</span>
              </Link>
              <Link
                href="/admin/stats"
                className="flex items-center gap-3 rounded-xl bg-muted/50 p-4 hover:bg-muted transition-colors"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">Estadísticas</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
