"use client"

import { useState } from "react"
import { cn, getDaysArrayInMonth, isWeekend, isSameDay } from "@/lib/utils"
import { ShiftChangeDialog } from "./shift-change-dialog"
import { ArrowLeftRight } from "lucide-react"

interface ShiftEntry {
  id: string
  date: Date
  shiftType: {
    code: string
    name: string
    color: string
    isPenalty: boolean
  }
}

interface InteractiveCalendarProps {
  year: number
  month: number
  entries: ShiftEntry[]
  allowChangeRequests?: boolean
}

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export function InteractiveCalendar({
  year,
  month,
  entries,
  allowChangeRequests = true,
}: InteractiveCalendarProps) {
  const [selectedEntry, setSelectedEntry] = useState<ShiftEntry | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const days = getDaysArrayInMonth(year, month)
  const firstDay = days[0]
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getEntryForDate = (date: Date) => {
    return entries.find((e) => isSameDay(e.date, date))
  }

  const handleDayClick = (entry: ShiftEntry | undefined) => {
    if (!allowChangeRequests || !entry) return

    // Only allow requesting changes for future dates
    if (entry.date <= today) return

    // Don't allow changes for day off or vacation
    if (entry.shiftType.code === "L" || entry.shiftType.code === "V") return

    setSelectedEntry(entry)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className={cn(
                "py-3 text-center text-sm font-medium",
                i >= 5 && "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {/* Empty spaces */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r bg-muted/20" />
          ))}

          {/* Days */}
          {days.map((date) => {
            const entry = getEntryForDate(date)
            const isToday = isSameDay(date, today)
            const weekend = isWeekend(date)
            const isFuture = date > today
            const canRequestChange = allowChangeRequests &&
              entry &&
              isFuture &&
              entry.shiftType.code !== "L" &&
              entry.shiftType.code !== "V"

            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDayClick(entry)}
                className={cn(
                  "min-h-[100px] border-b border-r p-2 transition-colors relative group",
                  weekend && "bg-muted/30",
                  isToday && "bg-primary/5",
                  canRequestChange && "cursor-pointer hover:bg-accent/50"
                )}
              >
                {/* Day number */}
                <div
                  className={cn(
                    "mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    isToday && "bg-primary text-primary-foreground font-bold"
                  )}
                >
                  {date.getDate()}
                </div>

                {/* Shift */}
                {entry && (
                  <div
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-white"
                    style={{ backgroundColor: entry.shiftType.color }}
                  >
                    <div className="font-bold">{entry.shiftType.code}</div>
                    <div className="truncate opacity-90 text-[10px]">{entry.shiftType.name}</div>
                  </div>
                )}

                {/* Change request indicator */}
                {canRequestChange && (
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="rounded-lg bg-primary/90 p-1.5 text-white shadow-lg">
                      <ArrowLeftRight className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* End empty spaces */}
          {Array.from({
            length: (7 - ((startOffset + days.length) % 7)) % 7,
          }).map((_, i) => (
            <div key={`end-${i}`} className="min-h-[100px] border-b border-r bg-muted/20" />
          ))}
        </div>
      </div>

      {/* Hint */}
      {allowChangeRequests && (
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Haz clic en un turno futuro para solicitar un cambio
        </p>
      )}

      {/* Dialog */}
      <ShiftChangeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={selectedEntry}
      />
    </>
  )
}
