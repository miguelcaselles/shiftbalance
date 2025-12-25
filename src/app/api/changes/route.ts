import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type") // 'my', 'available', 'all'

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (type === "my" && session.user.employeeId) {
      where.requesterId = session.user.employeeId
    } else if (type === "available" && session.user.employeeId) {
      where.status = { in: ["OPEN", "SELECTING"] }
      where.requesterId = { not: session.user.employeeId }
    }

    const changes = await db.shiftChangeRequest.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(changes)
  } catch (error) {
    console.error("Error fetching changes:", error)
    return NextResponse.json(
      { error: "Error al obtener cambios" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.employeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { scheduleEntryId, reason, urgency } = body

    if (!scheduleEntryId) {
      return NextResponse.json(
        { error: "Falta el turno a cambiar" },
        { status: 400 }
      )
    }

    // Verificar que la entrada existe y pertenece al usuario
    const scheduleEntry = await db.scheduleEntry.findUnique({
      where: { id: scheduleEntryId },
      include: { shiftType: true, schedulePeriod: true },
    })

    if (!scheduleEntry || scheduleEntry.employeeId !== session.user.employeeId) {
      return NextResponse.json(
        { error: "Entrada no válida" },
        { status: 400 }
      )
    }

    // Verificar que el periodo esté publicado
    if (scheduleEntry.schedulePeriod.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Solo se pueden solicitar cambios de turnos publicados" },
        { status: 400 }
      )
    }

    // Crear la solicitud de cambio
    const changeRequest = await db.shiftChangeRequest.create({
      data: {
        requesterId: session.user.employeeId,
        scheduleEntryId,
        reason: reason || null,
        urgency: urgency || "MEDIUM",
        status: "OPEN",
      },
      include: {
        requester: true,
        scheduleEntry: {
          include: { shiftType: true },
        },
      },
    })

    return NextResponse.json(changeRequest)
  } catch (error) {
    console.error("Error creating change request:", error)
    return NextResponse.json(
      { error: "Error al crear solicitud" },
      { status: 500 }
    )
  }
}
