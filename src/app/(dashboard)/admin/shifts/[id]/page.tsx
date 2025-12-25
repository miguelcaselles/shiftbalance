import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShiftForm } from "../shift-form"

interface PageProps {
  params: { id: string }
}

export default async function EditShiftPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const shift = await db.shiftType.findUnique({
    where: { id: params.id },
  })

  if (!shift) {
    notFound()
  }

  // Convert Decimal to number for the form
  const shiftData = {
    ...shift,
    durationHours: Number(shift.durationHours),
    penaltyWeight: Number(shift.penaltyWeight),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Tipo de Turno</h1>
        <p className="text-muted-foreground">
          Modificar configuración del turno
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del turno</CardTitle>
          <CardDescription>
            Actualiza las características del tipo de turno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShiftForm shift={shiftData} />
        </CardContent>
      </Card>
    </div>
  )
}
