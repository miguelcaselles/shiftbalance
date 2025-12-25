import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, MoreHorizontal, UserCheck, UserX } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const users = await db.user.findMany({
    include: {
      employeeProfile: true,
    },
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
  })

  const statusColors = {
    ACTIVE: "success",
    INACTIVE: "secondary",
    SUSPENDED: "destructive",
  } as const

  const statusLabels = {
    ACTIVE: "Activo",
    INACTIVE: "Inactivo",
    SUSPENDED: "Suspendido",
  }

  const roleLabels = {
    WORKER: "Trabajador",
    SUPERVISOR: "Supervisor",
    ADMIN: "Administrador",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de usuarios</CardTitle>
          <CardDescription>
            {users.length} usuarios en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {users.map((user) => {
              const profile = user.employeeProfile
              const initials = profile
                ? `${profile.firstName[0]}${profile.lastName[0]}`
                : user.email[0].toUpperCase()
              const displayName = profile
                ? `${profile.firstName} ${profile.lastName}`
                : user.email

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{roleLabels[user.role]}</Badge>
                    <Badge variant={statusColors[user.status]}>
                      {statusLabels[user.status]}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {user.status === "ACTIVE" ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}

            {users.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No hay usuarios registrados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
