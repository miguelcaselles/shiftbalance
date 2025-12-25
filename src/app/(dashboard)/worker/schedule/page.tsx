import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Download, ArrowLeftRight } from "lucide-react"
import Link from "next/link"
import { InteractiveCalendar } from "@/components/schedule/interactive-calendar"
import { getMonthName } from "@/lib/utils"

interface PageProps {
  searchParams: { year?: string; month?: string }
}

export default async function WorkerSchedulePage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.employeeId) redirect("/dashboard")

  const today = new Date()
  const year = searchParams.year ? parseInt(searchParams.year) : today.getFullYear()
  const month = searchParams.month ? parseInt(searchParams.month) : today.getMonth() + 1

  // Obtener periodo del horario
  const schedulePeriod = await db.schedulePeriod.findUnique({
    where: { year_month: { year, month } },
  })

  // Obtener entradas del horario
  const entries = await db.scheduleEntry.findMany({
    where: {
      employeeId: session.user.employeeId,
      schedulePeriod: { year, month },
    },
    include: {
      shiftType: true,
    },
    orderBy: { date: "asc" },
  })

  // Calcular navegación
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  // Formatear entradas para el calendario interactivo
  const calendarEntries = entries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    shiftType: {
      code: entry.shiftType.code,
      name: entry.shiftType.name,
      color: entry.shiftType.color,
      isPenalty: entry.shiftType.isPenalty,
    },
  }))

  // Estadísticas del mes
  const stats = {
    totalShifts: entries.filter((e) => e.shiftType.code !== "L" && e.shiftType.code !== "V").length,
    penaltyShifts: entries.filter((e) => e.shiftType.isPenalty).length,
    daysOff: entries.filter((e) => e.shiftType.code === "L").length,
    vacations: entries.filter((e) => e.shiftType.code === "V").length,
  }

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mi Horario</h1>
          <p className="text-muted-foreground">
            {getMonthName(month)} {year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/worker/schedule?year=${prevYear}&month=${prevMonth}`}>
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/worker/schedule?year=${today.getFullYear()}&month=${today.getMonth() + 1}`}>
            <Button variant="outline">Hoy</Button>
          </Link>
          <Link href={`/worker/schedule?year=${nextYear}&month=${nextMonth}`}>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Estado del horario */}
      {schedulePeriod && (
        <div className="flex items-center gap-2">
          <Badge
            variant={
              schedulePeriod.status === "PUBLISHED"
                ? "success"
                : schedulePeriod.status === "LOCKED"
                ? "secondary"
                : "outline"
            }
          >
            {schedulePeriod.status === "PUBLISHED"
              ? "Publicado"
              : schedulePeriod.status === "LOCKED"
              ? "Cerrado"
              : "Borrador"}
          </Badge>
          {schedulePeriod.publishedAt && (
            <span className="text-sm text-muted-foreground">
              Publicado el{" "}
              {schedulePeriod.publishedAt.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
              })}
            </span>
          )}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Turnos trabajados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShifts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Turnos penosos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.penaltyShifts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Libranzas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.daysOff}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vacaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vacations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendario Interactivo */}
      {schedulePeriod?.status === "PUBLISHED" || schedulePeriod?.status === "LOCKED" ? (
        <InteractiveCalendar
          year={year}
          month={month}
          entries={calendarEntries}
          allowChangeRequests={schedulePeriod?.status === "PUBLISHED"}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              El horario de este mes aún no ha sido publicado
            </p>
          </CardContent>
        </Card>
      )}

      {/* Leyenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {entries
              .reduce((acc, entry) => {
                if (!acc.find((t) => t.code === entry.shiftType.code)) {
                  acc.push(entry.shiftType)
                }
                return acc
              }, [] as typeof entries[0]["shiftType"][])
              .map((type) => (
                <div key={type.code} className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm">
                    {type.code} - {type.name}
                    {type.isPenalty && " (Penoso)"}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
