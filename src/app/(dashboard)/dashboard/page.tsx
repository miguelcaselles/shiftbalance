import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { Calendar, ArrowLeftRight, Bell, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = session.user.role === "ADMIN"
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Stats para el usuario
  let stats = {
    nextShift: null as { date: Date; shiftType: { name: string; code: string; color: string } } | null,
    pendingChanges: 0,
    unreadNotifications: 0,
    monthlyShifts: 0,
  }

  if (session.user.employeeId) {
    // Próximo turno
    const nextShift = await db.scheduleEntry.findFirst({
      where: {
        employeeId: session.user.employeeId,
        date: { gte: currentDate },
        schedulePeriod: { status: "PUBLISHED" },
      },
      include: { shiftType: true },
      orderBy: { date: "asc" },
    })

    if (nextShift) {
      stats.nextShift = {
        date: nextShift.date,
        shiftType: {
          name: nextShift.shiftType.name,
          code: nextShift.shiftType.code,
          color: nextShift.shiftType.color,
        },
      }
    }

    // Cambios pendientes donde puedo ofertar
    stats.pendingChanges = await db.shiftChangeRequest.count({
      where: {
        status: { in: ["OPEN", "SELECTING"] },
        requesterId: { not: session.user.employeeId },
      },
    })

    // Turnos del mes
    stats.monthlyShifts = await db.scheduleEntry.count({
      where: {
        employeeId: session.user.employeeId,
        schedulePeriod: {
          year: currentYear,
          month: currentMonth,
        },
      },
    })
  }

  // Notificaciones no leídas
  stats.unreadNotifications = await db.notification.count({
    where: {
      userId: session.user.id,
      isRead: false,
    },
  })

  // Stats adicionales para admin
  let adminStats = {
    totalUsers: 0,
    activeChanges: 0,
    pendingPreferences: 0,
    publishedSchedules: 0,
  }

  if (isAdmin) {
    adminStats.totalUsers = await db.user.count({ where: { status: "ACTIVE" } })
    adminStats.activeChanges = await db.shiftChangeRequest.count({
      where: { status: { in: ["OPEN", "SELECTING", "AWAITING_APPROVAL"] } },
    })

    const currentPeriod = await db.preferencePeriod.findUnique({
      where: { year_month: { year: currentYear, month: currentMonth } },
    })
    if (currentPeriod) {
      const submittedCount = await db.preferenceEntry.groupBy({
        by: ["employeeId"],
        where: { periodId: currentPeriod.id },
      })
      const totalEmployees = await db.employeeProfile.count()
      adminStats.pendingPreferences = totalEmployees - submittedCount.length
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold">
          Hola, {session.user.firstName || session.user.email.split("@")[0]}
        </h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Próximo turno */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Próximo turno</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.nextShift ? (
              <>
                <div className="text-2xl font-bold">
                  {stats.nextShift.date.toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <Badge
                  style={{ backgroundColor: stats.nextShift.shiftType.color }}
                  className="mt-1 text-white"
                >
                  {stats.nextShift.shiftType.name}
                </Badge>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin turnos programados</p>
            )}
          </CardContent>
        </Card>

        {/* Cambios disponibles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cambios disponibles</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingChanges}</div>
            <Link
              href="/worker/changes"
              className="text-sm text-primary hover:underline"
            >
              Ver solicitudes
            </Link>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
            <Link
              href="/worker/messages"
              className="text-sm text-primary hover:underline"
            >
              Ver mensajes
            </Link>
          </CardContent>
        </Card>

        {/* Turnos este mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Turnos este mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyShifts}</div>
            <Link
              href="/worker/schedule"
              className="text-sm text-primary hover:underline"
            >
              Ver horario
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Admin stats */}
      {isAdmin && (
        <>
          <h2 className="text-xl font-semibold mt-8">Panel de Administración</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Usuarios activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.totalUsers}</div>
                <Link href="/admin/users" className="text-sm text-primary hover:underline">
                  Gestionar
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cambios activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.activeChanges}</div>
                <Link href="/worker/changes" className="text-sm text-primary hover:underline">
                  Ver todos
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Preferencias pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.pendingPreferences}</div>
                <Link href="/admin/periods" className="text-sm text-primary hover:underline">
                  Ver periodos
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Acciones rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/admin/schedules"
                  className="block text-sm text-primary hover:underline"
                >
                  Generar horarios
                </Link>
                <Link
                  href="/admin/shifts"
                  className="block text-sm text-primary hover:underline"
                >
                  Configurar turnos
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
