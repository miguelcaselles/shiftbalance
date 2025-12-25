import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreHorizontal, AlertTriangle } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function ShiftTypesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const shiftTypes = await db.shiftType.findMany({
    orderBy: { sortOrder: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Turno</h1>
          <p className="text-muted-foreground">
            Configura los tipos de turno disponibles
          </p>
        </div>
        <Link href="/admin/shifts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo tipo
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shiftTypes.map((shift) => (
          <Card key={shift.id} className="relative">
            <div
              className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
              style={{ backgroundColor: shift.color }}
            />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded font-bold text-white"
                    style={{ backgroundColor: shift.color }}
                  >
                    {shift.code}
                  </div>
                  <CardTitle className="text-lg">{shift.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/shifts/${shift.id}`}>Editar</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {shift.startTime && shift.endTime && (
                  <p>
                    <span className="text-muted-foreground">Horario:</span>{" "}
                    {shift.startTime} - {shift.endTime}
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">Duración:</span>{" "}
                  {Number(shift.durationHours)}h
                </p>
                <div className="flex items-center gap-2 pt-2">
                  {shift.isPenalty && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Penoso ({Number(shift.penaltyWeight)}x)
                    </Badge>
                  )}
                  {!shift.isActive && (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {shiftTypes.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay tipos de turno configurados
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
