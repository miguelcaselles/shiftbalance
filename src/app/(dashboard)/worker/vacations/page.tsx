import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Palmtree,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  HourglassIcon,
  Sun,
  CalendarDays,
} from "lucide-react"
import { VacationRequestForm } from "@/components/vacations/vacation-request-form"

export default async function VacationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const currentYear = new Date().getFullYear()

  // Get or create vacation balance
  let balance = session.user.employeeId
    ? await db.vacationBalance.findUnique({
        where: {
          employeeId_year: {
            employeeId: session.user.employeeId,
            year: currentYear,
          },
        },
      })
    : null

  if (!balance && session.user.employeeId) {
    balance = await db.vacationBalance.create({
      data: {
        employeeId: session.user.employeeId,
        year: currentYear,
        totalDays: 22,
        usedDays: 0,
        pendingDays: 0,
        carriedOverDays: 0,
      },
    })
  }

  // Get vacation requests
  const requests = session.user.employeeId
    ? await db.vacationRequest.findMany({
        where: { employeeId: session.user.employeeId },
        orderBy: { createdAt: "desc" },
      })
    : []

  const available = balance
    ? balance.totalDays + balance.carriedOverDays - balance.usedDays - balance.pendingDays
    : 0

  const statusConfig = {
    PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", icon: HourglassIcon },
    APPROVED: { label: "Aprobada", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
    REJECTED: { label: "Rechazada", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: XCircle },
    CANCELLED: { label: "Cancelada", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300", icon: XCircle },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/25">
          <Palmtree className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Vacaciones</h1>
          <p className="text-muted-foreground">Gestiona tus días de vacaciones</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 p-6 text-white shadow-lg">
          <Sun className="absolute right-4 top-4 h-8 w-8 opacity-20" />
          <p className="text-sm font-medium text-white/80">Días disponibles</p>
          <p className="mt-2 text-4xl font-bold">{available}</p>
          <p className="mt-1 text-sm text-white/70">de {balance?.totalDays || 22} días totales</p>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Días usados</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{balance?.usedDays || 0}</p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3 dark:bg-emerald-900/50">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Días pendientes</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">{balance?.pendingDays || 0}</p>
              </div>
              <div className="rounded-xl bg-yellow-100 p-3 dark:bg-yellow-900/50">
                <HourglassIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Del año anterior</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{balance?.carriedOverDays || 0}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/50">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Request Form */}
        <div className="lg:col-span-1">
          <VacationRequestForm availableDays={available} />
        </div>

        {/* Request History */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Historial de solicitudes
              </CardTitle>
              <CardDescription>Tus solicitudes de vacaciones</CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Palmtree className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                  No tienes solicitudes de vacaciones
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => {
                    const config = statusConfig[request.status]
                    const StatusIcon = config.icon
                    return (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-xl bg-primary/10 p-3">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {request.startDate.toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                              })}
                              {" - "}
                              {request.endDate.toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.totalDays} días
                              {request.reason && ` • ${request.reason}`}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${config.color} border-0 gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
