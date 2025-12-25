"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VacationRequestFormProps {
  availableDays: number
}

export function VacationRequestForm({ availableDays }: VacationRequestFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")

  // Calculate days
  const calculateDays = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start > end) return 0

    let days = 0
    const current = new Date(start)
    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++
      }
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  const daysRequested = calculateDays()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Selecciona las fechas de inicio y fin",
        variant: "destructive",
      })
      return
    }

    if (daysRequested > availableDays) {
      toast({
        title: "Error",
        description: `Solo tienes ${availableDays} días disponibles`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/vacations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          reason: reason.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al crear solicitud")
      }

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de vacaciones ha sido enviada para aprobación",
      })

      setStartDate("")
      setEndDate("")
      setReason("")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar solicitud",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Solicitar vacaciones
        </CardTitle>
        <CardDescription>
          Tienes {availableDays} días disponibles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Fecha de inicio</Label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Fecha de fin</Label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split("T")[0]}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
              required
            />
          </div>

          {daysRequested > 0 && (
            <div className="rounded-xl bg-primary/10 p-4 text-center">
              <p className="text-2xl font-bold text-primary">{daysRequested}</p>
              <p className="text-sm text-muted-foreground">días laborables</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Viaje familiar..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || daysRequested === 0 || daysRequested > availableDays}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600 shadow-lg shadow-primary/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Solicitar vacaciones
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
