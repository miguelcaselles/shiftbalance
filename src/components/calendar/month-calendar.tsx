"use client"

import { cn, getDaysArrayInMonth, isWeekend, isSameDay } from "@/lib/utils"

interface ShiftEntry {
  date: Date
  shiftType: {
    code: string
    name: string
    color: string
    isPenalty: boolean
  }
}

interface MonthCalendarProps {
  year: number
  month: number
  entries: ShiftEntry[]
  onDayClick?: (date: Date) => void
  selectedDate?: Date | null
}

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export function MonthCalendar({
  year,
  month,
  entries,
  onDayClick,
  selectedDate,
}: MonthCalendarProps) {
  const days = getDaysArrayInMonth(year, month)
  const firstDay = days[0]

  // Ajustar para que lunes sea 0
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getEntryForDate = (date: Date) => {
    return entries.find((e) => isSameDay(e.date, date))
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Header con días de la semana */}
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

      {/* Grid de días */}
      <div className="grid grid-cols-7">
        {/* Espacios vacíos antes del primer día */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[100px] border-b border-r bg-muted/30" />
        ))}

        {/* Días del mes */}
        {days.map((date) => {
          const entry = getEntryForDate(date)
          const isToday = isSameDay(date, today)
          const isSelected = selectedDate && isSameDay(date, selectedDate)
          const weekend = isWeekend(date)

          return (
            <div
              key={date.toISOString()}
              onClick={() => onDayClick?.(date)}
              className={cn(
                "min-h-[100px] border-b border-r p-2 transition-colors",
                weekend && "bg-muted/30",
                onDayClick && "cursor-pointer hover:bg-accent/50",
                isSelected && "ring-2 ring-primary ring-inset"
              )}
            >
              {/* Número del día */}
              <div
                className={cn(
                  "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm",
                  isToday && "bg-primary text-primary-foreground font-bold"
                )}
              >
                {date.getDate()}
              </div>

              {/* Turno asignado */}
              {entry && (
                <div
                  className="rounded-md px-2 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: entry.shiftType.color }}
                >
                  <div className="font-bold">{entry.shiftType.code}</div>
                  <div className="truncate opacity-90">{entry.shiftType.name}</div>
                </div>
              )}
            </div>
          )
        })}

        {/* Espacios vacíos después del último día */}
        {Array.from({
          length: (7 - ((startOffset + days.length) % 7)) % 7,
        }).map((_, i) => (
          <div
            key={`empty-end-${i}`}
            className="min-h-[100px] border-b border-r bg-muted/30"
          />
        ))}
      </div>
    </div>
  )
}
