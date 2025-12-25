import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserForm } from "../user-form"

interface PageProps {
  params: { id: string }
}

export default async function EditUserPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    include: { employeeProfile: true },
  })

  if (!user) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Usuario</h1>
        <p className="text-muted-foreground">
          Modificar datos del usuario
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del usuario</CardTitle>
          <CardDescription>
            Actualiza los datos del usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
