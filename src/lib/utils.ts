import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', options ?? {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function formatTime(time: string): string {
  return time.slice(0, 5)
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getDaysArrayInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const date = new Date(year, month - 1, 1)
  while (date.getMonth() === month - 1) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

export function getWeekDay(date: Date): number {
  // Retorna 0=Lunes, 1=Martes, ..., 6=Domingo
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

export function getMonthName(month: number): string {
  return new Date(2024, month - 1, 1).toLocaleDateString('es-ES', { month: 'long' })
}

export function getWeekdayName(date: Date, short = false): string {
  return date.toLocaleDateString('es-ES', { weekday: short ? 'short' : 'long' })
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString()
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const PREFERENCE_LEVELS = [
  { value: 0, label: "No quiero", color: "bg-red-500" },
  { value: 25, label: "Preferiría evitar", color: "bg-orange-500" },
  { value: 50, label: "Neutro", color: "bg-gray-500" },
  { value: 75, label: "Me gustaría", color: "bg-blue-500" },
  { value: 100, label: "Lo quiero", color: "bg-green-500" },
] as const

export function getPreferenceLevelInfo(level: number) {
  return PREFERENCE_LEVELS.find(p => p.value === level) ?? PREFERENCE_LEVELS[2]
}
