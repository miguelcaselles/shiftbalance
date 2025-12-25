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

    const message = await db.message.findUnique({
      where: { id: params.id },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            employeeProfile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            employeeProfile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    })

    if (!message) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 })
    }

    // Verificar que el usuario es el remitente o destinatario
    if (message.senderId !== session.user.id && message.recipientId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Si es el destinatario y no lo ha leído, marcarlo como leído
    if (message.recipientId === session.user.id && message.status === "UNREAD") {
      await db.message.update({
        where: { id: params.id },
        data: { status: "READ", readAt: new Date() },
      })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error fetching message:", error)
    return NextResponse.json(
      { error: "Error al obtener mensaje" },
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
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const message = await db.message.findUnique({
      where: { id: params.id },
    })

    if (!message) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 })
    }

    // Solo el remitente o destinatario pueden eliminar
    if (message.senderId !== session.user.id && message.recipientId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await db.message.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting message:", error)
    return NextResponse.json(
      { error: "Error al eliminar mensaje" },
      { status: 500 }
    )
  }
}
