import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import {
  Users,
  Calendar,
  ArrowLeftRight,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"

export default async function StatsPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Fetch all stats in parallel
  const [
    totalUsers,
    activeUsers,
    totalShiftTypes,
    activeChanges,
    completedChanges,
    schedulesThisMonth,
    totalScheduleEntries,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.shiftType.count(),
    db.shiftChangeRequest.count({
      where: { status: { in: ["OPEN", "SELECTING", "AWAITING_APPROVAL"] } },
    }),
    db.shiftChangeRequest.count({
      where: { status: "COMPLETED" },
    }),
    db.schedulePeriod.count({
      where: { year: currentYear, month: currentMonth },
    }),
    db.scheduleEntry.count({
      where: {
        schedulePeriod: { year: currentYear, month: currentMonth },
      },
    }),
  ])

  const stats = [
    {
      label: "Usuarios totales",
      value: totalUsers,
      subValue: `${activeUsers} activos`,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Tipos de turno",
      value: totalShiftTypes,
      subValue: "configurados",
      icon: Clock,
      color: "from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Cambios activos",
      value: activeChanges,
      subValue: `${completedChanges} completados`,
      icon: ArrowLeftRight,
      color: "from-violet-500 to-violet-600",
      iconBg: "bg-violet-100 dark:bg-violet-900/50",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Turnos este mes",
      value: totalScheduleEntries,
      subValue: `${schedulesThisMonth} periodos`,
      icon: Calendar,
      color: "from-orange-500 to-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-900/50",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/25">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground">
            Resumen del sistema de gestión de turnos
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm"
          >
            <div className={`absolute right-4 top-4 rounded-xl ${stat.iconBg} p-2.5`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-4xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.subValue}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Chart Placeholder */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Actividad del sistema</h3>
          </div>
          <div className="flex h-64 items-center justify-center rounded-xl bg-muted/50">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Gráfico de actividad próximamente
              </p>
            </div>
          </div>
        </div>

        {/* Distribution Chart Placeholder */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Distribución de turnos</h3>
          </div>
          <div className="flex h-64 items-center justify-center rounded-xl bg-muted/50">
            <div className="text-center">
              <PieChart className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Gráfico de distribución próximamente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
          <Users className="h-8 w-8 opacity-80" />
          <p className="mt-4 text-3xl font-bold">{activeUsers}</p>
          <p className="text-white/80">Usuarios activos</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg">
          <Calendar className="h-8 w-8 opacity-80" />
          <p className="mt-4 text-3xl font-bold">{totalScheduleEntries}</p>
          <p className="text-white/80">Turnos programados</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 p-6 text-white shadow-lg">
          <ArrowLeftRight className="h-8 w-8 opacity-80" />
          <p className="mt-4 text-3xl font-bold">{completedChanges}</p>
          <p className="text-white/80">Cambios completados</p>
        </div>
      </div>
    </div>
  )
}
