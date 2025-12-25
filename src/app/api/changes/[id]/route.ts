import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const change = await db.shiftChangeRequest.findUnique({
      where: { id: params.id },
      include: {
        requester: true,
        scheduleEntry: {
          include: { shiftType: true },
        },
        offers: {
          include: {
            offerer: true,
          },
        },
        approvals: true,
        result: {
          include: {
            selectedOffer: {
              include: { offerer: true },
            },
          },
        },
      },
    })

    if (!change) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    return NextResponse.json(change)
  } catch (error) {
    console.error("Error fetching change:", error)
    return NextResponse.json(
      { error: "Error al obtener solicitud" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { action, offerId } = body

    const change = await db.shiftChangeRequest.findUnique({
      where: { id: params.id },
      include: {
        offers: true,
        approvals: true,
        scheduleEntry: true,
        result: true,
      },
    })

    if (!change) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    // Acciones permitidas según estado y rol
    switch (action) {
      case "cancel":
        // Solo el solicitante puede cancelar
        if (change.requesterId !== session.user.employeeId) {
          return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }
        if (!["OPEN", "SELECTING"].includes(change.status)) {
          return NextResponse.json({ error: "No se puede cancelar en este estado" }, { status: 400 })
        }
        await db.shiftChangeRequest.update({
          where: { id: params.id },
          data: { status: "CANCELLED" },
        })
        break

      case "select_offer":
        // Solo el solicitante puede seleccionar oferta
        if (change.requesterId !== session.user.employeeId) {
          return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }
        if (change.status !== "SELECTING") {
          return NextResponse.json({ error: "No hay ofertas que seleccionar" }, { status: 400 })
        }

        const offer = change.offers.find((o: { id: string }) => o.id === offerId)
        if (!offer) {
          return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 })
        }

        // Crear el resultado con la oferta seleccionada
        await db.shiftChangeResult.create({
          data: {
            requestId: params.id,
            selectedOfferId: offerId,
            originalEntrySnapshot: JSON.stringify(change.scheduleEntry),
          },
        })

        await db.shiftChangeRequest.update({
          where: { id: params.id },
          data: { status: "AWAITING_APPROVAL" },
        })

        // Crear aprobación del solicitante automáticamente
        await db.changeApproval.create({
          data: {
            requestId: params.id,
            approverId: session.user.id,
            approverRole: "REQUESTER",
            approved: true,
          },
        })

        // Notificar al oferente
        const offerer = await db.employeeProfile.findUnique({
          where: { id: offer.offererId },
          select: { userId: true },
        })
        if (offerer) {
          await db.notification.create({
            data: {
              userId: offerer.userId,
              type: "OFFER_SELECTED",
              title: "Tu oferta fue seleccionada",
              message: "Han seleccionado tu oferta de cambio de turno. Por favor, confirma el cambio.",
            },
          })
        }
        break

      case "approve":
        // Puede ser el oferente o admin
        if (change.status !== "AWAITING_APPROVAL") {
          return NextResponse.json({ error: "No está pendiente de aprobación" }, { status: 400 })
        }

        const resultForApprove = await db.shiftChangeResult.findUnique({
          where: { requestId: params.id },
          include: { selectedOffer: true },
        })

        const isOfferer = resultForApprove?.selectedOffer?.offererId === session.user.employeeId
        const isAdmin = session.user.role === "ADMIN"

        if (!isOfferer && !isAdmin) {
          return NextResponse.json({ error: "No autorizado para aprobar" }, { status: 401 })
        }

        const approverRole = isOfferer ? "OFFERER" : "ADMIN"

        // Verificar si ya aprobó
        const existingApproval = change.approvals.find(
          (a: { approverRole: string; approved: boolean }) => a.approverRole === approverRole && a.approved
        )
        if (existingApproval) {
          return NextResponse.json({ error: "Ya has aprobado esta solicitud" }, { status: 400 })
        }

        await db.changeApproval.create({
          data: {
            requestId: params.id,
            approverId: session.user.id,
            approverRole,
            approved: true,
          },
        })

        // Verificar si todas las aprobaciones están completas
        const allApprovals = await db.changeApproval.findMany({
          where: { requestId: params.id },
        })

        const hasRequesterApproval = allApprovals.some((a: { approverRole: string; approved: boolean }) => a.approverRole === "REQUESTER" && a.approved)
        const hasOffererApproval = allApprovals.some((a: { approverRole: string; approved: boolean }) => a.approverRole === "OFFERER" && a.approved)
        const hasAdminApproval = allApprovals.some((a: { approverRole: string; approved: boolean }) => a.approverRole === "ADMIN" && a.approved)

        if (hasRequesterApproval && hasOffererApproval && hasAdminApproval) {
          // Ejecutar el cambio de turnos
          await executeShiftChange(params.id)

          await db.shiftChangeRequest.update({
            where: { id: params.id },
            data: { status: "COMPLETED" },
          })
        }
        break

      case "reject":
        // Solo admin o el oferente pueden rechazar
        if (change.status !== "AWAITING_APPROVAL") {
          return NextResponse.json({ error: "No está pendiente de aprobación" }, { status: 400 })
        }

        const resultForReject = await db.shiftChangeResult.findUnique({
          where: { requestId: params.id },
          include: { selectedOffer: true },
        })

        const canReject = session.user.role === "ADMIN" ||
          resultForReject?.selectedOffer?.offererId === session.user.employeeId

        if (!canReject) {
          return NextResponse.json({ error: "No autorizado para rechazar" }, { status: 401 })
        }

        const rejecterRole = resultForReject?.selectedOffer?.offererId === session.user.employeeId
          ? "OFFERER"
          : "ADMIN"

        await db.changeApproval.create({
          data: {
            requestId: params.id,
            approverId: session.user.id,
            approverRole: rejecterRole,
            approved: false,
          },
        })

        await db.shiftChangeRequest.update({
          where: { id: params.id },
          data: { status: "REJECTED" },
        })
        break

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    const updated = await db.shiftChangeRequest.findUnique({
      where: { id: params.id },
      include: {
        requester: true,
        scheduleEntry: { include: { shiftType: true } },
        offers: { include: { offerer: true } },
        approvals: true,
        result: { include: { selectedOffer: { include: { offerer: true } } } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating change:", error)
    return NextResponse.json(
      { error: "Error al actualizar solicitud" },
      { status: 500 }
    )
  }
}

async function executeShiftChange(requestId: string) {
  const result = await db.shiftChangeResult.findUnique({
    where: { requestId },
    include: {
      request: {
        include: { scheduleEntry: true },
      },
      selectedOffer: {
        include: { offerer: true },
      },
    },
  })

  if (!result) return

  // El oferente toma el turno del solicitante
  // Actualizar la entrada original para asignarla al oferente
  await db.scheduleEntry.update({
    where: { id: result.request.scheduleEntry.id },
    data: {
      originalEmployeeId: result.request.scheduleEntry.employeeId,
      employeeId: result.selectedOffer.offererId,
    },
  })

  // Actualizar el resultado con la fecha de ejecución
  await db.shiftChangeResult.update({
    where: { id: result.id },
    data: { executedAt: new Date() },
  })
}
