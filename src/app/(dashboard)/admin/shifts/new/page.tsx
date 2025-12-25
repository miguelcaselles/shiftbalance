import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShiftForm } from "../shift-form"

export default async function NewShiftPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Tipo de Turno</h1>
        <p className="text-muted-foreground">
          Configura un nuevo tipo de turno
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del turno</CardTitle>
          <CardDescription>
            Define las características del nuevo tipo de turno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShiftForm />
        </CardContent>
      </Card>
    </div>
  )
}
