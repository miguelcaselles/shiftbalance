"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeftRight, Loader2, Calendar, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShiftChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: {
    id: string
    date: Date
    shiftType: {
      code: string
      name: string
      color: string
    }
  } | null
}

export function ShiftChangeDialog({ open, onOpenChange, entry }: ShiftChangeDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [urgency, setUrgency] = useState("MEDIUM")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!entry) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleEntryId: entry.id,
          reason: reason.trim() || null,
          urgency,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al crear solicitud")
      }

      toast({
        title: "Solicitud creada",
        description: "Tu solicitud de cambio ha sido publicada",
      })

      setReason("")
      setUrgency("MEDIUM")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear solicitud",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Solicitar cambio de turno
          </DialogTitle>
          <DialogDescription>
            Publica una solicitud para que otro compañero te cubra
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-muted/50 p-4 my-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {entry.date.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: entry.shiftType.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.shiftType.code} - {entry.shiftType.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="urgency">Urgencia</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Baja - Puedo esperar</SelectItem>
                <SelectItem value="MEDIUM">Media - Normal</SelectItem>
                <SelectItem value="HIGH">Alta - Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica por qué necesitas el cambio..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-gradient-to-r from-primary to-emerald-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Solicitar cambio
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
