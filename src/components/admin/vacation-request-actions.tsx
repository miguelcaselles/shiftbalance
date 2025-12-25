"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VacationRequestActionsProps {
  requestId: string
}

export function VacationRequestActions({ requestId }: VacationRequestActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/vacations/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al aprobar")
      }

      toast({
        title: "Vacaciones aprobadas",
        description: "La solicitud de vacaciones ha sido aprobada",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al aprobar",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/vacations/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al rechazar")
      }

      toast({
        title: "Vacaciones rechazadas",
        description: "La solicitud de vacaciones ha sido rechazada",
      })

      setRejectDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al rechazar",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleApprove}
        disabled={isLoading}
        className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Aprobar
          </>
        )}
      </Button>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-xl border-red-300 text-red-600 hover:bg-red-50">
            <XCircle className="mr-2 h-4 w-4" />
            Rechazar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rechazar vacaciones</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo para informar al trabajador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo del rechazo</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explica por qué se rechaza la solicitud..."
                rows={4}
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
                disabled={isLoading}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={isLoading}
                className="rounded-xl bg-red-500 hover:bg-red-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirmar rechazo"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
