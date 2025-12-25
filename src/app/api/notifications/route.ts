import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const notifications = await db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50, // Limitar a las últimas 50
    })

    const unreadCount = await db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationIds } = body

    if (action === "mark_read") {
      if (notificationIds && Array.isArray(notificationIds)) {
        // Marcar notificaciones específicas como leídas
        await db.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id,
          },
          data: { isRead: true },
        })
      } else {
        // Marcar todas como leídas
        await db.notification.updateMany({
          where: {
            userId: session.user.id,
            isRead: false,
          },
          data: { isRead: true },
        })
      }
    } else if (action === "delete") {
      if (notificationIds && Array.isArray(notificationIds)) {
        await db.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id,
          },
        })
      }
    } else {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json(
      { error: "Error al actualizar notificaciones" },
      { status: 500 }
    )
  }
}
