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

    const changeRequest = await db.shiftChangeRequest.findUnique({
      where: { id: params.id },
      include: {
        requester: { include: { user: true } },
        scheduleEntry: true,
      },
    })

    if (!changeRequest) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      )
    }

    // Actualizar el estado de la solicitud
    const updated = await db.shiftChangeRequest.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        adminNotes: reason || `Rechazado por ${session.user.email} el ${new Date().toLocaleDateString("es-ES")}`,
      },
    })

    // Crear notificación para el solicitante
    await db.notification.create({
      data: {
        userId: changeRequest.requester.user.id,
        type: "CHANGE_REJECTED",
        title: "Solicitud rechazada",
        message: reason
          ? `Tu solicitud de cambio ha sido rechazada: ${reason}`
          : `Tu solicitud de cambio para el ${changeRequest.scheduleEntry.date.toLocaleDateString("es-ES")} ha sido rechazada`,
        link: "/worker/changes",
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error rejecting change request:", error)
    return NextResponse.json(
      { error: "Error al rechazar solicitud" },
      { status: 500 }
    )
  }
}
