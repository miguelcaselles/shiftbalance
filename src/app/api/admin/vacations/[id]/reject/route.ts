import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const body = await request.json()
    const { reason } = body

    const vacationRequest = await db.vacationRequest.findUnique({
      where: { id: params.id },
      include: {
        employee: { include: { user: true } },
      },
    })

    if (!vacationRequest) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      )
    }

    if (vacationRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Esta solicitud ya fue procesada" },
        { status: 400 }
      )
    }

    const currentYear = new Date().getFullYear()

    // Devolver los días pendientes al balance
    await db.vacationBalance.update({
      where: {
        employeeId_year: {
          employeeId: vacationRequest.employeeId,
          year: currentYear,
        },
      },
      data: {
        pendingDays: { decrement: vacationRequest.totalDays },
      },
    })

    // Actualizar el estado de la solicitud
    const updated = await db.vacationRequest.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: reason || `Rechazado por ${session.user.email}`,
      },
    })

    // Crear notificación para el solicitante
    await db.notification.create({
      data: {
        userId: vacationRequest.employee.user.id,
        type: "VACATION_REJECTED",
        title: "Vacaciones rechazadas",
        message: reason
          ? `Tu solicitud de vacaciones ha sido rechazada: ${reason}`
          : `Tu solicitud de vacaciones del ${vacationRequest.startDate.toLocaleDateString("es-ES")} al ${vacationRequest.endDate.toLocaleDateString("es-ES")} ha sido rechazada`,
        link: "/worker/vacations",
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error rejecting vacation request:", error)
    return NextResponse.json(
      { error: "Error al rechazar solicitud" },
      { status: 500 }
    )
  }
}
