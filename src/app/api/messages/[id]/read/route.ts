import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el mensaje existe y pertenece al usuario
    const message = await db.message.findUnique({
      where: { id: params.id },
    })

    if (!message) {
      return NextResponse.json(
        { error: "Mensaje no encontrado" },
        { status: 404 }
      )
    }

    if (message.recipientId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para marcar este mensaje" },
        { status: 403 }
      )
    }

    // Marcar como leído
    const updated = await db.message.update({
      where: { id: params.id },
      data: { status: "READ" },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error marking message as read:", error)
    return NextResponse.json(
      { error: "Error al marcar mensaje" },
      { status: 500 }
    )
  }
}
