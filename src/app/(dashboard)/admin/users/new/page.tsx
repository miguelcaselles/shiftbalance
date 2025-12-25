import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserForm } from "../user-form"

export default async function NewUserPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Usuario</h1>
        <p className="text-muted-foreground">
          Crear un nuevo usuario en el sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del usuario</CardTitle>
          <CardDescription>
            Completa los datos para crear el nuevo usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm />
        </CardContent>
      </Card>
    </div>
  )
}
