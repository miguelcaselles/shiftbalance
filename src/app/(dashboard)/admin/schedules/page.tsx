import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Wand2, Save, Send, Lock } from "lucide-react"
import Link from "next/link"
import { getMonthName } from "@/lib/utils"
import { ScheduleEditor } from "./schedule-editor"

interface PageProps {
  searchParams: { year?: string; month?: string }
}

export default async function AdminSchedulesPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const today = new Date()
  const year = searchParams.year ? parseInt(searchParams.year) : today.getFullYear()
  const month = searchParams.month ? parseInt(searchParams.month) : today.getMonth() + 1

  // Obtener periodo o crear uno si no existe
  let schedulePeriod = await db.schedulePeriod.findUnique({
    where: { year_month: { year, month } },
  })

  // Obtener todos los empleados activos
  const employees = await db.employeeProfile.findMany({
    where: {
      user: { status: "ACTIVE" },
    },
    include: { user: true },
    orderBy: { lastName: "asc" },
  })

  // Obtener tipos de turno activos
  const shiftTypes = await db.shiftType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  })

  // Obtener entradas del horario
  const entries = schedulePeriod
    ? await db.scheduleEntry.findMany({
        where: { schedulePeriodId: schedulePeriod.id },
        include: {
          shiftType: true,
          employee: true,
        },
      })
    : []

  // Navegación
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  // Estadísticas
  const stats = {
    totalEntries: entries.length,
    employeesWithSchedule: new Set(entries.map((e) => e.employeeId)).size,
    totalEmployees: employees.length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Horarios</h1>
          <p className="text-muted-foreground">
            {getMonthName(month)} {year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/schedules?year=${prevYear}&month=${prevMonth}`}>
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/admin/schedules?year=${today.getFullYear()}&month=${today.getMonth() + 1}`}>
            <Button variant="outline">Hoy</Button>
          </Link>
          <Link href={`/admin/schedules?year=${nextYear}&month=${nextMonth}`}>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Estado y acciones */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge
                variant={
                  schedulePeriod?.status === "PUBLISHED"
                    ? "success"
                    : schedulePeriod?.status === "LOCKED"
                    ? "secondary"
                    : "outline"
                }
              >
                {schedulePeriod?.status === "PUBLISHED"
                  ? "Publicado"
                  : schedulePeriod?.status === "LOCKED"
                  ? "Bloqueado"
                  : "Borrador"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {stats.employeesWithSchedule}/{stats.totalEmployees} empleados con horario
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">
                <Wand2 className="mr-2 h-4 w-4" />
                Generar automático
              </Button>
              <Button variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Guardar borrador
              </Button>
              {schedulePeriod?.status === "DRAFT" && (
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  Publicar
                </Button>
              )}
              {schedulePeriod?.status === "PUBLISHED" && (
                <Button variant="secondary">
                  <Lock className="mr-2 h-4 w-4" />
                  Bloquear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor de horario */}
      <ScheduleEditor
        year={year}
        month={month}
        employees={employees}
        shiftTypes={shiftTypes}
        entries={entries}
        isEditable={!schedulePeriod || schedulePeriod.status === "DRAFT"}
      />
    </div>
  )
}
