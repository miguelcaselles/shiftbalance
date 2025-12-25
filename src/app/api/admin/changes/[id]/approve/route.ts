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

    const changeRequest = await db.shiftChangeRequest.findUnique({
      where: { id: params.id },
      include: {
        requester: { include: { user: true } },
        scheduleEntry: { include: { shiftType: true } },
        targetShiftType: true,
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
        status: "COMPLETED",
        adminNotes: `Aprobado por ${session.user.email} el ${new Date().toLocaleDateString("es-ES")}`,
      },
    })

    // Si es tipo ABSENCE, podemos cambiar el turno a día libre
    if (changeRequest.changeType === "ABSENCE") {
      // Buscar tipo de turno "Libre" o similar
      const freeShiftType = await db.shiftType.findFirst({
        where: { code: "L" },
      })

      if (freeShiftType) {
        await db.scheduleEntry.update({
          where: { id: changeRequest.scheduleEntryId },
          data: {
            shiftTypeId: freeShiftType.id,
            isManualOverride: true,
            overrideReason: `Ausencia aprobada - ${changeRequest.reason || "Sin motivo especificado"}`,
          },
        })
      }
    }

    // Si es tipo SWAP, cambiar al turno solicitado
    if (changeRequest.changeType === "SWAP" && changeRequest.targetShiftTypeId) {
      await db.scheduleEntry.update({
        where: { id: changeRequest.scheduleEntryId },
        data: {
          shiftTypeId: changeRequest.targetShiftTypeId,
          isManualOverride: true,
          overrideReason: `Cambio de turno aprobado - ${changeRequest.reason || "Sin motivo especificado"}`,
        },
      })
    }

    // Crear notificación para el solicitante
    await db.notification.create({
      data: {
        userId: changeRequest.requester.user.id,
        type: "CHANGE_APPROVED",
        title: "Solicitud aprobada",
        message: `Tu solicitud de cambio para el ${changeRequest.scheduleEntry.date.toLocaleDateString("es-ES")} ha sido aprobada`,
        link: "/worker/changes",
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error approving change request:", error)
    return NextResponse.json(
      { error: "Error al aprobar solicitud" },
      { status: 500 }
    )
  }
}
