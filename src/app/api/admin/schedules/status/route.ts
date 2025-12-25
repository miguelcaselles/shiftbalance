import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { year, month, status } = body

    if (!year || !month || !status) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      )
    }

    // Validar estado
    if (!["DRAFT", "PUBLISHED", "LOCKED"].includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      )
    }

    // Obtener el periodo
    const schedulePeriod = await db.schedulePeriod.findUnique({
      where: { year_month: { year, month } },
    })

    if (!schedulePeriod) {
      return NextResponse.json(
        { error: "No existe el periodo" },
        { status: 404 }
      )
    }

    // Validar transiciones de estado
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["PUBLISHED"],
      PUBLISHED: ["DRAFT", "LOCKED"],
      LOCKED: ["PUBLISHED"], // Permitir desbloquear
    }

    if (!validTransitions[schedulePeriod.status]?.includes(status)) {
      return NextResponse.json(
        { error: `No se puede cambiar de ${schedulePeriod.status} a ${status}` },
        { status: 400 }
      )
    }

    // Actualizar el estado
    const updated = await db.schedulePeriod.update({
      where: { id: schedulePeriod.id },
      data: { status },
    })

    // Si se publica, notificar a los empleados
    if (status === "PUBLISHED") {
      const employees = await db.employeeProfile.findMany({
        where: { user: { status: "ACTIVE" } },
        select: { userId: true },
      })

      // Crear notificaciones para todos los empleados
      await db.notification.createMany({
        data: employees.map((emp) => ({
          userId: emp.userId,
          type: "SCHEDULE_PUBLISHED",
          title: "Horario publicado",
          content: `Se ha publicado el horario de ${getMonthName(month)} ${year}`,
        })),
      })
    }

    return NextResponse.json({ success: true, schedulePeriod: updated })
  } catch (error) {
    console.error("Error updating schedule status:", error)
    return NextResponse.json(
      { error: "Error al actualizar el estado" },
      { status: 500 }
    )
  }
}

function getMonthName(month: number): string {
  return new Date(2024, month - 1, 1).toLocaleDateString("es-ES", { month: "long" })
}
