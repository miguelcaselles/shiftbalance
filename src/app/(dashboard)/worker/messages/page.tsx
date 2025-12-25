import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { MessagesClient } from "@/components/messages/messages-client"

export default async function MessagesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Obtener usuarios para el selector (excluyendo al usuario actual)
  const users = await db.user.findMany({
    where: {
      id: { not: session.user.id },
      status: "ACTIVE",
    },
    select: {
      id: true,
      email: true,
      employeeProfile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { email: "asc" },
  })

  const usersForSelect = users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.employeeProfile?.firstName,
    lastName: u.employeeProfile?.lastName,
  }))

  // Notificaciones
  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // Mensajes recibidos (solo padres, con respuestas incluidas)
  const receivedMessages = await db.message.findMany({
    where: {
      recipientId: session.user.id,
      parentId: null, // Solo mensajes originales
    },
    include: {
      sender: {
        include: { employeeProfile: true },
      },
      recipient: {
        include: { employeeProfile: true },
      },
      replies: {
        include: {
          sender: {
            include: { employeeProfile: true },
          },
          recipient: {
            include: { employeeProfile: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // Mensajes enviados (solo padres, con respuestas)
  const sentMessages = await db.message.findMany({
    where: {
      senderId: session.user.id,
      parentId: null, // Solo mensajes originales
    },
    include: {
      sender: {
        include: { employeeProfile: true },
      },
      recipient: {
        include: { employeeProfile: true },
      },
      replies: {
        include: {
          sender: {
            include: { employeeProfile: true },
          },
          recipient: {
            include: { employeeProfile: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <MessagesClient
      users={usersForSelect}
      notifications={notifications}
      receivedMessages={receivedMessages as any}
      sentMessages={sentMessages as any}
      currentUserId={session.user.id}
    />
  )
}
