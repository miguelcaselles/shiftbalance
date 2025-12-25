"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Bell,
  Mail,
  CheckCheck,
  ArrowLeftRight,
  Calendar,
  Clock,
  MessageSquare,
  Send,
  Reply,
} from "lucide-react"
import Link from "next/link"
import { NewMessageDialog } from "./new-message-dialog"
import { MessageThread } from "./message-thread"

interface UserForSelect {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
}

interface EmployeeProfile {
  firstName: string
  lastName: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  isRead: boolean
  link: string | null
  createdAt: Date
}

interface Message {
  id: string
  subject: string | null
  content: string
  status: string
  createdAt: Date
  senderId: string
  recipientId: string
  parentId?: string | null
  sender: {
    id: string
    email: string
    employeeProfile: EmployeeProfile | null
  }
  recipient: {
    id: string
    email: string
    employeeProfile: EmployeeProfile | null
  }
  replies?: Message[]
}

interface MessagesClientProps {
  users: UserForSelect[]
  notifications: Notification[]
  receivedMessages: Message[]
  sentMessages: Message[]
  currentUserId: string
}

const notificationIcons = {
  SHIFT_CHANGE_REQUEST: ArrowLeftRight,
  COVERAGE_OFFER_RECEIVED: Mail,
  OFFER_SELECTED: CheckCheck,
  SCHEDULE_PUBLISHED: Calendar,
  PREFERENCE_DEADLINE: Clock,
  PERIOD_OPENED: Calendar,
  CHANGE_APPROVAL_NEEDED: ArrowLeftRight,
  CHANGE_APPROVED: CheckCheck,
  CHANGE_REJECTED: ArrowLeftRight,
  ADMIN_MESSAGE: MessageSquare,
  MESSAGE_REPLY: Reply,
  VACATION_REQUEST: Calendar,
  VACATION_APPROVED: CheckCheck,
  VACATION_REJECTED: Calendar,
  SYSTEM: Bell,
}

export function MessagesClient({
  users,
  notifications,
  receivedMessages,
  sentMessages,
  currentUserId,
}: MessagesClientProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  const unreadNotifications = notifications.filter((n) => !n.isRead).length
  const unreadMessages = receivedMessages.filter((m) => m.status === "UNREAD").length

  // If message selected, show thread
  if (selectedMessage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mensajes y Notificaciones</h1>
          <p className="text-muted-foreground">Conversación</p>
        </div>
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-6 min-h-[500px]">
            <MessageThread
              message={selectedMessage}
              currentUserId={currentUserId}
              onClose={() => setSelectedMessage(null)}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mensajes y Notificaciones</h1>
          <p className="text-muted-foreground">
            {unreadNotifications + unreadMessages} sin leer
          </p>
        </div>
        <NewMessageDialog users={users}>
          <Button className="rounded-xl bg-gradient-to-r from-primary to-emerald-600 shadow-lg shadow-primary/25">
            <Send className="mr-2 h-4 w-4" />
            Nuevo mensaje
          </Button>
        </NewMessageDialog>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="notifications" className="gap-2 rounded-lg">
            <Bell className="h-4 w-4" />
            Notificaciones
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-2 rounded-lg">
            <Mail className="h-4 w-4" />
            Recibidos
            {unreadMessages > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {unreadMessages}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2 rounded-lg">
            <Send className="h-4 w-4" />
            Enviados
          </TabsTrigger>
        </TabsList>

        {/* Notificaciones */}
        <TabsContent value="notifications">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>Avisos del sistema</CardDescription>
              </div>
              {unreadNotifications > 0 && (
                <Button variant="outline" size="sm" className="rounded-xl">
                  Marcar todas como leídas
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || Bell
                  return (
                    <div
                      key={notification.id}
                      className={`py-4 flex gap-4 ${!notification.isRead ? "bg-primary/5 -mx-6 px-6 rounded-xl" : ""}`}
                    >
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{notification.title}</p>
                          {!notification.isRead && (
                            <Badge className="flex-shrink-0 bg-primary/10 text-primary border-0">
                              Nueva
                            </Badge>
                          )}
                        </div>
                        {notification.message && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.createdAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {notification.link && (
                        <Link href={notification.link}>
                          <Button variant="ghost" size="sm" className="rounded-xl">
                            Ver
                          </Button>
                        </Link>
                      )}
                    </div>
                  )
                })}

                {notifications.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                    No tienes notificaciones
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mensajes recibidos */}
        <TabsContent value="inbox">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader>
              <CardTitle>Mensajes recibidos</CardTitle>
              <CardDescription>Haz clic en un mensaje para ver la conversación y responder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {receivedMessages.map((message) => {
                  const senderProfile = message.sender.employeeProfile
                  const senderName = senderProfile
                    ? `${senderProfile.firstName} ${senderProfile.lastName}`
                    : message.sender.email
                  const initials = senderProfile
                    ? `${senderProfile.firstName[0]}${senderProfile.lastName[0]}`
                    : message.sender.email[0].toUpperCase()

                  return (
                    <div
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className={`py-4 flex gap-4 cursor-pointer hover:bg-accent/50 rounded-xl transition-colors ${message.status === "UNREAD" ? "bg-primary/5 -mx-6 px-6" : "-mx-2 px-2"}`}
                    >
                      <Avatar className="border-2 border-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{senderName}</p>
                            {message.subject && (
                              <p className="text-sm font-medium text-muted-foreground">{message.subject}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {message.status === "UNREAD" && (
                              <Badge className="bg-primary/10 text-primary border-0">No leído</Badge>
                            )}
                            <Reply className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {message.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(message.createdAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {receivedMessages.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                    No has recibido mensajes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mensajes enviados */}
        <TabsContent value="sent">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader>
              <CardTitle>Mensajes enviados</CardTitle>
              <CardDescription>Mensajes que has enviado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {sentMessages.map((message) => {
                  const recipientProfile = message.recipient.employeeProfile
                  const recipientName = recipientProfile
                    ? `${recipientProfile.firstName} ${recipientProfile.lastName}`
                    : message.recipient.email
                  const initials = recipientProfile
                    ? `${recipientProfile.firstName[0]}${recipientProfile.lastName[0]}`
                    : message.recipient.email[0].toUpperCase()

                  return (
                    <div
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className="py-4 flex gap-4 cursor-pointer hover:bg-accent/50 rounded-xl transition-colors -mx-2 px-2"
                    >
                      <Avatar className="border-2 border-muted">
                        <AvatarFallback className="bg-muted">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">Para: {recipientName}</p>
                            {message.subject && (
                              <p className="text-sm font-medium text-muted-foreground">{message.subject}</p>
                            )}
                          </div>
                          <Reply className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {message.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {message.status === "READ" && (
                            <CheckCheck className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {sentMessages.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Send className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                    No has enviado mensajes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
