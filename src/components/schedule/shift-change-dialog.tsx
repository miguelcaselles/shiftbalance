"use client"

import { useState, useEffect } from "react"
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
import { ArrowLeftRight, Loader2, Calendar, Clock, UserX, RefreshCw, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ShiftType {
  id: string
  code: string
  name: string
  color: string
}

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
  const [changeType, setChangeType] = useState<"ABSENCE" | "SWAP" | "COVERAGE">("COVERAGE")
  const [targetShiftTypeId, setTargetShiftTypeId] = useState("")
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])

  // Cargar tipos de turno cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      fetch("/api/admin/shifts")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // Filtrar solo turnos activos y que no sean libres/vacaciones
            setShiftTypes(data.filter((s: ShiftType) => s.code !== "L" && s.code !== "V"))
          }
        })
        .catch(console.error)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!entry) return

    if (changeType === "SWAP" && !targetShiftTypeId) {
      toast({
        title: "Error",
        description: "Selecciona el turno al que quieres cambiar",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleEntryId: entry.id,
          changeType,
          targetShiftTypeId: changeType === "SWAP" ? targetShiftTypeId : null,
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
        description: "Tu solicitud de cambio ha sido enviada para aprobación",
      })

      setReason("")
      setUrgency("MEDIUM")
      setChangeType("COVERAGE")
      setTargetShiftTypeId("")
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Solicitar cambio de turno
          </DialogTitle>
          <DialogDescription>
            Elige el tipo de cambio que necesitas
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
          {/* Tipo de cambio */}
          <div className="space-y-3">
            <Label>Tipo de solicitud</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChangeType("ABSENCE")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  changeType === "ABSENCE"
                    ? "border-red-500 bg-red-50 dark:bg-red-950"
                    : "border-muted hover:border-muted-foreground/50"
                )}
              >
                <UserX className={cn("h-6 w-6", changeType === "ABSENCE" ? "text-red-500" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", changeType === "ABSENCE" ? "text-red-700 dark:text-red-400" : "")}>
                  Ausencia
                </span>
              </button>
              <button
                type="button"
                onClick={() => setChangeType("SWAP")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  changeType === "SWAP"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-muted hover:border-muted-foreground/50"
                )}
              >
                <RefreshCw className={cn("h-6 w-6", changeType === "SWAP" ? "text-blue-500" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", changeType === "SWAP" ? "text-blue-700 dark:text-blue-400" : "")}>
                  Cambiar turno
                </span>
              </button>
              <button
                type="button"
                onClick={() => setChangeType("COVERAGE")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  changeType === "COVERAGE"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                    : "border-muted hover:border-muted-foreground/50"
                )}
              >
                <Users className={cn("h-6 w-6", changeType === "COVERAGE" ? "text-purple-500" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", changeType === "COVERAGE" ? "text-purple-700 dark:text-purple-400" : "")}>
                  Cobertura
                </span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {changeType === "ABSENCE" && "No podrás trabajar este día. Requiere aprobación del administrador."}
              {changeType === "SWAP" && "Quieres cambiar a otro turno diferente el mismo día."}
              {changeType === "COVERAGE" && "Buscas que un compañero te cubra este turno."}
            </p>
          </div>

          {/* Selector de turno destino (solo para SWAP) */}
          {changeType === "SWAP" && (
            <div className="space-y-2">
              <Label htmlFor="targetShift">Cambiar a turno</Label>
              <Select value={targetShiftTypeId} onValueChange={setTargetShiftTypeId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecciona el turno" />
                </SelectTrigger>
                <SelectContent>
                  {shiftTypes
                    .filter((s) => s.code !== entry.shiftType.code)
                    .map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded"
                            style={{ backgroundColor: shift.color }}
                          />
                          {shift.code} - {shift.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <Label htmlFor="reason">Motivo</Label>
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
                  Enviar solicitud
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
