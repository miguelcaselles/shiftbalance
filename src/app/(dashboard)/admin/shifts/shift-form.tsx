"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

interface ShiftType {
  id: string
  code: string
  name: string
  startTime: string | null
  endTime: string | null
  durationHours: number
  color: string
  isPenalty: boolean
  penaltyWeight: number
  sortOrder: number
  isActive: boolean
}

interface ShiftFormProps {
  shift?: ShiftType
}

const PRESET_COLORS = [
  "#3B82F6", // blue
  "#22C55E", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#06B6D4", // cyan
  "#EC4899", // pink
  "#6B7280", // gray
]

export function ShiftForm({ shift }: ShiftFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    code: shift?.code || "",
    name: shift?.name || "",
    startTime: shift?.startTime || "",
    endTime: shift?.endTime || "",
    color: shift?.color || PRESET_COLORS[0],
    isPenalty: shift?.isPenalty || false,
    penaltyWeight: shift?.penaltyWeight || 1.0,
    sortOrder: shift?.sortOrder || 0,
    isActive: shift?.isActive ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.name) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const url = shift
          ? `/api/admin/shifts/${shift.id}`
          : "/api/admin/shifts"
        const method = shift ? "PATCH" : "POST"

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Error al guardar")
        }

        toast({
          title: "Guardado",
          description: shift
            ? "Tipo de turno actualizado correctamente"
            : "Tipo de turno creado correctamente",
        })

        router.push("/admin/shifts")
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al guardar",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">Código *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="M"
            maxLength={3}
            required
          />
          <p className="text-xs text-muted-foreground">
            Código corto que aparece en el calendario (1-3 caracteres)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Mañana"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">Hora de inicio</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Hora de fin</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                formData.color === color
                  ? "border-primary scale-110"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, color })}
            />
          ))}
          <Input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="h-8 w-8 p-0 border-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isPenalty">Turno penoso</Label>
            <p className="text-sm text-muted-foreground">
              Marcar si este turno es considerado menos deseable
            </p>
          </div>
          <Switch
            id="isPenalty"
            checked={formData.isPenalty}
            onCheckedChange={(checked) => setFormData({ ...formData, isPenalty: checked })}
          />
        </div>

        {formData.isPenalty && (
          <div className="space-y-2">
            <Label htmlFor="penaltyWeight">Peso de penosidad</Label>
            <Input
              id="penaltyWeight"
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={formData.penaltyWeight}
              onChange={(e) => setFormData({ ...formData, penaltyWeight: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Multiplicador para el cálculo de puntos (1.0 - 5.0)
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Orden de visualización</Label>
          <Input
            id="sortOrder"
            type="number"
            min="0"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
          />
        </div>
        <div className="flex items-center gap-4 pt-6">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Activo</Label>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label>Vista previa</Label>
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
          <div
            className="flex h-10 w-10 items-center justify-center rounded font-bold text-white"
            style={{ backgroundColor: formData.color }}
          >
            {formData.code || "?"}
          </div>
          <div>
            <p className="font-medium">{formData.name || "Nombre del turno"}</p>
            {formData.startTime && formData.endTime && (
              <p className="text-sm text-muted-foreground">
                {formData.startTime} - {formData.endTime}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : shift ? "Actualizar" : "Crear turno"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/shifts")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
