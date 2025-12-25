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
    const type = searchParams.get("type") // 'inbox', 'sent', 'all'

    const where: Record<string, unknown> = {}

    if (type === "inbox") {
      where.recipientId = session.user.id
    } else if (type === "sent") {
      where.senderId = session.user.id
    } else {
      where.OR = [
        { recipientId: session.user.id },
        { senderId: session.user.id },
      ]
    }

    const messages = await db.message.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Error al obtener mensajes" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, subject, content, parentId } = body

    if (!recipientId || !content) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Verificar que el destinatario existe
    const recipient = await db.user.findUnique({
      where: { id: recipientId },
    })

    if (!recipient) {
      return NextResponse.json(
        { error: "Destinatario no encontrado" },
        { status: 404 }
      )
    }

    // Si es respuesta, verificar que el mensaje padre existe
    if (parentId) {
      const parentMessage = await db.message.findUnique({
        where: { id: parentId },
      })
      if (!parentMessage) {
        return NextResponse.json(
          { error: "Mensaje original no encontrado" },
          { status: 404 }
        )
      }
    }

    // Crear mensaje
    const message = await db.message.create({
      data: {
        senderId: session.user.id,
        recipientId,
        subject: subject || null,
        content,
        status: "UNREAD",
        parentId: parentId || null,
      },
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

    // Crear notificación para el destinatario
    const senderName = message.sender.employeeProfile?.firstName || message.sender.email
    await db.notification.create({
      data: {
        userId: recipientId,
        type: parentId ? "MESSAGE_REPLY" : "ADMIN_MESSAGE",
        title: parentId ? "Nueva respuesta" : "Nuevo mensaje",
        message: parentId
          ? `${senderName} ha respondido a tu mensaje`
          : `Has recibido un mensaje de ${senderName}`,
        link: "/worker/messages",
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json(
      { error: "Error al enviar mensaje" },
      { status: 500 }
    )
  }
}
