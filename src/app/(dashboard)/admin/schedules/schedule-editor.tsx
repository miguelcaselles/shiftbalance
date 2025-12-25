"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn, getDaysInMonth, getWeekDay } from "@/lib/utils"

interface Employee {
  id: string
  firstName: string
  lastName: string
  user: {
    email: string
  }
}

interface ShiftType {
  id: string
  name: string
  code: string
  color: string
  isPenalty: boolean
}

interface ScheduleEntry {
  id: string
  employeeId: string
  date: Date
  shiftTypeId: string
  shiftType: ShiftType
}

interface ScheduleEditorProps {
  year: number
  month: number
  employees: Employee[]
  shiftTypes: ShiftType[]
  entries: ScheduleEntry[]
  isEditable: boolean
}

interface CellChange {
  employeeId: string
  day: number
  shiftTypeId: string | null
  originalShiftTypeId: string | null
}

export function ScheduleEditor({
  year,
  month,
  employees,
  shiftTypes,
  entries,
  isEditable,
}: ScheduleEditorProps) {
  const [changes, setChanges] = useState<Map<string, CellChange>>(new Map())
  const [selectedCell, setSelectedCell] = useState<{
    employeeId: string
    day: number
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  const daysInMonth = getDaysInMonth(year, month)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Crear un mapa de entradas para acceso rápido
  const entryMap = new Map<string, ScheduleEntry>()
  entries.forEach((entry) => {
    const date = new Date(entry.date)
    const key = `${entry.employeeId}-${date.getDate()}`
    entryMap.set(key, entry)
  })

  const getCellKey = (employeeId: string, day: number) => `${employeeId}-${day}`

  const getShiftForCell = (employeeId: string, day: number): ShiftType | null => {
    const key = getCellKey(employeeId, day)

    // Primero verificar si hay un cambio pendiente
    const change = changes.get(key)
    if (change) {
      if (change.shiftTypeId === null) return null
      return shiftTypes.find((st) => st.id === change.shiftTypeId) || null
    }

    // Si no, obtener de las entradas originales
    const entry = entryMap.get(key)
    return entry?.shiftType || null
  }

  const handleCellClick = (employeeId: string, day: number) => {
    if (!isEditable) return
    setSelectedCell({ employeeId, day })
  }

  const handleShiftChange = (shiftTypeId: string | null) => {
    if (!selectedCell) return

    const key = getCellKey(selectedCell.employeeId, selectedCell.day)
    const originalEntry = entryMap.get(key)
    const originalShiftTypeId = originalEntry?.shiftTypeId || null

    // Si es el mismo que el original, eliminar el cambio
    if (shiftTypeId === originalShiftTypeId) {
      setChanges((prev) => {
        const next = new Map(prev)
        next.delete(key)
        return next
      })
    } else {
      setChanges((prev) => {
        const next = new Map(prev)
        next.set(key, {
          employeeId: selectedCell.employeeId,
          day: selectedCell.day,
          shiftTypeId,
          originalShiftTypeId,
        })
        return next
      })
    }

    setSelectedCell(null)
  }

  const handleSave = async () => {
    if (changes.size === 0) return

    startTransition(async () => {
      // Convertir cambios a formato de API
      const changesArray = Array.from(changes.values()).map((change) => ({
        employeeId: change.employeeId,
        date: new Date(year, month - 1, change.day).toISOString(),
        shiftTypeId: change.shiftTypeId,
      }))

      try {
        const response = await fetch("/api/admin/schedules/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            month,
            entries: changesArray,
          }),
        })

        if (response.ok) {
          // Recargar la página para obtener datos actualizados
          window.location.reload()
        }
      } catch (error) {
        console.error("Error saving schedule:", error)
      }
    })
  }

  const hasChanges = changes.size > 0

  // Agrupar días por semana para mejor visualización
  const weekDays = ["L", "M", "X", "J", "V", "S", "D"]

  return (
    <div className="space-y-4">
      {/* Indicador de cambios pendientes */}
      {hasChanges && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                {changes.size} cambio(s) pendiente(s) de guardar
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChanges(new Map())}
                >
                  Descartar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leyenda de turnos */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-2">
            {shiftTypes.map((st) => (
              <Badge
                key={st.id}
                style={{ backgroundColor: st.color }}
                className="text-white"
              >
                {st.code} - {st.name}
                {st.isPenalty && " ⚠️"}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid del horario */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 bg-background p-2 text-left min-w-[200px] border-r">
                  Empleado
                </th>
                {days.map((day) => {
                  const date = new Date(year, month - 1, day)
                  const weekDay = getWeekDay(date)
                  const isWeekend = weekDay === 5 || weekDay === 6 // Sábado o Domingo
                  return (
                    <th
                      key={day}
                      className={cn(
                        "p-1 text-center min-w-[40px] text-xs",
                        isWeekend && "bg-muted"
                      )}
                    >
                      <div>{weekDays[weekDay]}</div>
                      <div className="font-bold">{day}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b hover:bg-muted/50">
                  <td className="sticky left-0 bg-background p-2 border-r">
                    <div className="font-medium">
                      {employee.lastName}, {employee.firstName}
                    </div>
                  </td>
                  {days.map((day) => {
                    const shift = getShiftForCell(employee.id, day)
                    const key = getCellKey(employee.id, day)
                    const hasChange = changes.has(key)
                    const date = new Date(year, month - 1, day)
                    const weekDay = getWeekDay(date)
                    const isWeekend = weekDay === 5 || weekDay === 6

                    return (
                      <td
                        key={day}
                        className={cn(
                          "p-0.5 text-center",
                          isWeekend && "bg-muted/50",
                          isEditable && "cursor-pointer hover:bg-accent",
                          hasChange && "ring-2 ring-yellow-500 ring-inset"
                        )}
                        onClick={() => handleCellClick(employee.id, day)}
                      >
                        {shift ? (
                          <div
                            className="w-full h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: shift.color }}
                            title={shift.name}
                          >
                            {shift.code}
                          </div>
                        ) : (
                          <div className="w-full h-8 rounded bg-gray-100 dark:bg-gray-800" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Dialog para seleccionar turno */}
      <Dialog open={selectedCell !== null} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar turno</DialogTitle>
            <DialogDescription>
              {selectedCell && (
                <>
                  {employees.find((e) => e.id === selectedCell.employeeId)?.firstName}{" "}
                  {employees.find((e) => e.id === selectedCell.employeeId)?.lastName}
                  {" - "}
                  {selectedCell.day}/{month}/{year}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 py-4">
            <Button
              variant="outline"
              className="h-16"
              onClick={() => handleShiftChange(null)}
            >
              <div className="text-center">
                <div className="text-lg">✕</div>
                <div className="text-xs">Sin turno</div>
              </div>
            </Button>
            {shiftTypes.map((st) => (
              <Button
                key={st.id}
                variant="outline"
                className="h-16"
                style={{
                  backgroundColor: st.color,
                  color: "white",
                  borderColor: st.color,
                }}
                onClick={() => handleShiftChange(st.id)}
              >
                <div className="text-center">
                  <div className="text-lg font-bold">{st.code}</div>
                  <div className="text-xs">{st.name}</div>
                </div>
              </Button>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCell(null)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
