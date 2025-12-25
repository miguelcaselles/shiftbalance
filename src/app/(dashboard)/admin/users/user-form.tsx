"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  email: string
  role: "WORKER" | "SUPERVISOR" | "ADMIN"
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  employeeProfile: {
    firstName: string
    lastName: string
    position: string | null
    department: string | null
  } | null
}

interface UserFormProps {
  user?: User
}

export function UserForm({ user }: UserFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    email: user?.email || "",
    password: "",
    firstName: user?.employeeProfile?.firstName || "",
    lastName: user?.employeeProfile?.lastName || "",
    role: user?.role || "WORKER",
    status: user?.status || "ACTIVE",
    position: user?.employeeProfile?.position || "",
    department: user?.employeeProfile?.department || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (!user && !formData.password) {
      toast({
        title: "Error",
        description: "La contraseña es requerida para nuevos usuarios",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const url = user
          ? `/api/admin/users/${user.id}`
          : "/api/admin/users"
        const method = user ? "PATCH" : "POST"

        const body: Record<string, string> = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          status: formData.status,
          position: formData.position,
          department: formData.department,
        }

        if (formData.password) {
          body.password = formData.password
        }

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Error al guardar")
        }

        toast({
          title: "Guardado",
          description: user
            ? "Usuario actualizado correctamente"
            : "Usuario creado correctamente",
        })

        router.push("/admin/users")
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
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Nombre"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellidos *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Apellidos"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="correo@ejemplo.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Contraseña {user ? "(dejar vacío para mantener)" : "*"}
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="********"
          required={!user}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value as User["role"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WORKER">Trabajador</SelectItem>
              <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as User["status"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Activo</SelectItem>
              <SelectItem value="INACTIVE">Inactivo</SelectItem>
              <SelectItem value="SUSPENDED">Suspendido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="position">Cargo</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder="Cargo o posición"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Departamento</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="Departamento"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : user ? "Actualizar" : "Crear usuario"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/users")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
