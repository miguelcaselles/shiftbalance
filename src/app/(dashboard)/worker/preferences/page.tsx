import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Send, Save } from "lucide-react"
import Link from "next/link"
import { getMonthName, getDaysInMonth, isWeekend } from "@/lib/utils"
import { PreferenceCalendar } from "./preference-calendar"

interface PageProps {
  searchParams: { year?: string; month?: string }
}

export default async function PreferencesPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.employeeId) redirect("/dashboard")

  const today = new Date()
  const year = searchParams.year ? parseInt(searchParams.year) : today.getFullYear()
  const month = searchParams.month ? parseInt(searchParams.month) : today.getMonth() + 1

  // Obtener periodo de preferencias
  const preferencePeriod = await db.preferencePeriod.findUnique({
    where: { year_month: { year, month } },
  })

  // Obtener tipos de turno activos
  const shiftTypes = await db.shiftType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  })

  // Obtener preferencias existentes
  const existingPreferences = preferencePeriod
    ? await db.preferenceEntry.findMany({
        where: {
          periodId: preferencePeriod.id,
          employeeId: session.user.employeeId,
        },
      })
    : []

  // Calcular navegación
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  const isOpen = preferencePeriod?.status === "OPEN"
  const hasSubmitted = existingPreferences.length > 0
  const deadlinePassed = preferencePeriod?.deadline && new Date() > preferencePeriod.deadline

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Preferencias</h1>
          <p className="text-muted-foreground">
            {getMonthName(month)} {year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/worker/preferences?year=${prevYear}&month=${prevMonth}`}>
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/worker/preferences?year=${today.getFullYear()}&month=${today.getMonth() + 2}`}>
            <Button variant="outline">Próximo mes</Button>
          </Link>
          <Link href={`/worker/preferences?year=${nextYear}&month=${nextMonth}`}>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Estado del periodo */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge
                variant={
                  isOpen
                    ? "success"
                    : preferencePeriod?.status === "CLOSED" || preferencePeriod?.status === "LOCKED"
                    ? "secondary"
                    : "outline"
                }
              >
                {isOpen
                  ? "Abierto"
                  : preferencePeriod?.status === "CLOSED"
                  ? "Cerrado"
                  : preferencePeriod?.status === "LOCKED"
                  ? "Bloqueado"
                  : "No disponible"}
              </Badge>

              {hasSubmitted && (
                <Badge variant="info">Preferencias enviadas</Badge>
              )}

              {preferencePeriod?.deadline && (
                <span className="text-sm text-muted-foreground">
                  Fecha límite:{" "}
                  {preferencePeriod.deadline.toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            {isOpen && !deadlinePassed && (
              <div className="flex gap-2">
                <Button variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar borrador
                </Button>
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar preferencias
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cómo funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-red-500" />
              <span><strong>0</strong> - No quiero</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-orange-500" />
              <span><strong>25</strong> - Prefiero evitar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-gray-500" />
              <span><strong>50</strong> - Neutro</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-blue-500" />
              <span><strong>75</strong> - Me gustaría</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-green-500" />
              <span><strong>100</strong> - Lo quiero</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendario de preferencias */}
      {isOpen || hasSubmitted ? (
        <PreferenceCalendar
          year={year}
          month={month}
          shiftTypes={shiftTypes}
          existingPreferences={existingPreferences}
          isEditable={isOpen && !deadlinePassed}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              El periodo de preferencias para este mes no está disponible
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
