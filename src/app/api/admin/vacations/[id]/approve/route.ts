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

    // Actualizar el balance de vacaciones
    await db.vacationBalance.upsert({
      where: {
        employeeId_year: {
          employeeId: vacationRequest.employeeId,
          year: currentYear,
        },
      },
      create: {
        employeeId: vacationRequest.employeeId,
        year: currentYear,
        totalDays: 22,
        usedDays: vacationRequest.totalDays,
        pendingDays: 0,
      },
      update: {
        usedDays: { increment: vacationRequest.totalDays },
        pendingDays: { decrement: vacationRequest.totalDays },
      },
    })

    // Actualizar el estado de la solicitud
    const updated = await db.vacationRequest.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: `Aprobado por ${session.user.email}`,
      },
    })

    // Crear notificación para el solicitante
    await db.notification.create({
      data: {
        userId: vacationRequest.employee.user.id,
        type: "VACATION_APPROVED",
        title: "Vacaciones aprobadas",
        message: `Tu solicitud de vacaciones del ${vacationRequest.startDate.toLocaleDateString("es-ES")} al ${vacationRequest.endDate.toLocaleDateString("es-ES")} ha sido aprobada`,
        link: "/worker/vacations",
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error approving vacation request:", error)
    return NextResponse.json(
      { error: "Error al aprobar solicitud" },
      { status: 500 }
    )
  }
}
