import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.employeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { conditions } = body

    // Verificar que la solicitud existe y está abierta
    const changeRequest = await db.shiftChangeRequest.findUnique({
      where: { id: params.id },
      include: { offers: true },
    })

    if (!changeRequest) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    if (!["OPEN", "SELECTING"].includes(changeRequest.status)) {
      return NextResponse.json(
        { error: "La solicitud no acepta ofertas" },
        { status: 400 }
      )
    }

    // No puede ofertar el mismo solicitante
    if (changeRequest.requesterId === session.user.employeeId) {
      return NextResponse.json(
        { error: "No puedes ofertar en tu propia solicitud" },
        { status: 400 }
      )
    }

    // Verificar que no haya ofertado ya
    const existingOffer = changeRequest.offers.find(
      (o: { offererId: string }) => o.offererId === session.user.employeeId
    )
    if (existingOffer) {
      return NextResponse.json(
        { error: "Ya has ofertado en esta solicitud" },
        { status: 400 }
      )
    }

    // Crear la oferta
    const offer = await db.coverageOffer.create({
      data: {
        requestId: params.id,
        offererId: session.user.employeeId,
        conditions: conditions || null,
        status: "PENDING",
      },
      include: {
        offerer: true,
      },
    })

    // Actualizar el estado de la solicitud si es la primera oferta
    if (changeRequest.status === "OPEN") {
      await db.shiftChangeRequest.update({
        where: { id: params.id },
        data: { status: "SELECTING" },
      })
    }

    // Notificar al solicitante
    const requester = await db.employeeProfile.findUnique({
      where: { id: changeRequest.requesterId },
      select: { userId: true },
    })

    if (requester) {
      await db.notification.create({
        data: {
          userId: requester.userId,
          type: "COVERAGE_OFFER_RECEIVED",
          title: "Nueva oferta de cambio",
          message: "Has recibido una nueva oferta para tu solicitud de cambio de turno.",
        },
      })
    }

    return NextResponse.json(offer)
  } catch (error) {
    console.error("Error creating offer:", error)
    return NextResponse.json(
      { error: "Error al crear oferta" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.employeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const offerId = searchParams.get("offerId")

    if (!offerId) {
      return NextResponse.json({ error: "Falta el ID de la oferta" }, { status: 400 })
    }

    // Verificar que la oferta existe y pertenece al usuario
    const offer = await db.coverageOffer.findUnique({
      where: { id: offerId },
      include: { request: true },
    })

    if (!offer) {
      return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 })
    }

    if (offer.offererId !== session.user.employeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (offer.status !== "PENDING") {
      return NextResponse.json(
        { error: "No se puede cancelar esta oferta" },
        { status: 400 }
      )
    }

    // Eliminar la oferta
    await db.coverageOffer.delete({
      where: { id: offerId },
    })

    // Si era la única oferta, volver el estado a OPEN
    const remainingOffers = await db.coverageOffer.count({
      where: { requestId: params.id },
    })

    if (remainingOffers === 0) {
      await db.shiftChangeRequest.update({
        where: { id: params.id },
        data: { status: "OPEN" },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting offer:", error)
    return NextResponse.json(
      { error: "Error al eliminar oferta" },
      { status: 500 }
    )
  }
}
