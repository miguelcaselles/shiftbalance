"use client"

import { useState } from "react"
import { cn, getDaysArrayInMonth, isWeekend, isSameDay, getPreferenceLevelInfo } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ShiftType {
  id: string
  code: string
  name: string
  color: string
  isPenalty: boolean
}

interface PreferenceEntry {
  id: string
  date: Date
  shiftTypeId: string | null
  preferenceLevel: number
}

interface PreferenceCalendarProps {
  year: number
  month: number
  shiftTypes: ShiftType[]
  existingPreferences: PreferenceEntry[]
  isEditable: boolean
}

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const PREFERENCE_LEVELS = [0, 25, 50, 75, 100] as const

export function PreferenceCalendar({
  year,
  month,
  shiftTypes,
  existingPreferences,
  isEditable,
}: PreferenceCalendarProps) {
  const [preferences, setPreferences] = useState<Map<string, number>>(() => {
    const map = new Map()
    existingPreferences.forEach((p) => {
      const key = `${p.date.toISOString().split("T")[0]}-${p.shiftTypeId || "day"}`
      map.set(key, p.preferenceLevel)
    })
    return map
  })

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const days = getDaysArrayInMonth(year, month)
  const firstDay = days[0]
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getPreferenceForDate = (date: Date): number => {
    const key = `${date.toISOString().split("T")[0]}-day`
    return preferences.get(key) ?? 50
  }

  const setPreferenceForDate = (date: Date, level: number) => {
    const key = `${date.toISOString().split("T")[0]}-day`
    setPreferences((prev) => new Map(prev).set(key, level))
  }

  const handleDayClick = (date: Date) => {
    if (!isEditable) return
    setSelectedDate(date)
    setDialogOpen(true)
  }

  const getPreferenceColor = (level: number) => {
    if (level === 0) return "bg-red-500/30 border-red-500"
    if (level === 25) return "bg-orange-500/30 border-orange-500"
    if (level === 50) return "bg-gray-500/20 border-gray-300"
    if (level === 75) return "bg-blue-500/30 border-blue-500"
    return "bg-green-500/30 border-green-500"
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        {/* Header */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className={cn(
                "py-2 text-center text-sm font-medium",
                i >= 5 && "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {/* Espacios vacíos */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r bg-muted/30" />
          ))}

          {/* Días */}
          {days.map((date) => {
            const isToday = isSameDay(date, today)
            const weekend = isWeekend(date)
            const preference = getPreferenceForDate(date)
            const prefInfo = getPreferenceLevelInfo(preference)

            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDayClick(date)}
                className={cn(
                  "min-h-[80px] border-b border-r p-2 transition-colors",
                  weekend && "bg-muted/30",
                  isEditable && "cursor-pointer hover:bg-accent/50",
                  getPreferenceColor(preference),
                  "border-l-4"
                )}
              >
                <div
                  className={cn(
                    "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isToday && "bg-primary text-primary-foreground font-bold"
                  )}
                >
                  {date.getDate()}
                </div>
                <div className="text-xs font-medium opacity-80">
                  {prefInfo.label}
                </div>
              </div>
            )
          })}

          {/* Espacios finales */}
          {Array.from({
            length: (7 - ((startOffset + days.length) % 7)) % 7,
          }).map((_, i) => (
            <div key={`end-${i}`} className="min-h-[80px] border-b border-r bg-muted/30" />
          ))}
        </div>
      </div>

      {/* Dialog para editar preferencia */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Preferencia para el{" "}
              {selectedDate?.toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </DialogTitle>
            <DialogDescription>
              Indica tu preferencia para este día
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {PREFERENCE_LEVELS.map((level) => {
                const info = getPreferenceLevelInfo(level)
                const isSelected = selectedDate && getPreferenceForDate(selectedDate) === level

                return (
                  <button
                    key={level}
                    onClick={() => {
                      if (selectedDate) {
                        setPreferenceForDate(selectedDate, level)
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted hover:bg-muted/80"
                    )}
                  >
                    <div className={cn("h-4 w-4 rounded", info.color)} />
                    <span className="font-medium">{level}</span>
                    <span className="text-muted-foreground">- {info.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setDialogOpen(false)}>
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
