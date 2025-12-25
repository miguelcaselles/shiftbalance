"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Reply, Send, Loader2, CheckCheck, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface MessageUser {
  id: string
  email: string
  employeeProfile?: {
    firstName: string
    lastName: string
  } | null
}

interface Message {
  id: string
  subject: string | null
  content: string
  status: string
  createdAt: Date
  senderId: string
  recipientId: string
  sender: MessageUser
  recipient: MessageUser
  parentId?: string | null
  replies?: Message[]
}

interface MessageThreadProps {
  message: Message
  currentUserId: string
  onClose: () => void
}

export function MessageThread({ message, currentUserId, onClose }: MessageThreadProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const isReceived = message.recipientId === currentUserId
  const otherUser = isReceived ? message.sender : message.recipient
  const otherUserName = otherUser.employeeProfile
    ? `${otherUser.employeeProfile.firstName} ${otherUser.employeeProfile.lastName}`
    : otherUser.email
  const otherUserInitials = otherUser.employeeProfile
    ? `${otherUser.employeeProfile.firstName[0]}${otherUser.employeeProfile.lastName[0]}`
    : otherUser.email[0].toUpperCase()

  // Mark as read when viewing
  const markAsRead = async () => {
    if (isReceived && message.status === "UNREAD") {
      try {
        await fetch(`/api/messages/${message.id}/read`, {
          method: "PUT",
        })
        router.refresh()
      } catch (error) {
        // Silent fail
      }
    }
  }

  // Mark as read on mount
  useState(() => {
    markAsRead()
  })

  const handleSendReply = async () => {
    if (!replyContent.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: otherUser.id,
          subject: message.subject ? `Re: ${message.subject}` : null,
          content: replyContent.trim(),
          parentId: message.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al enviar respuesta")
      }

      toast({
        title: "Respuesta enviada",
        description: "Tu respuesta ha sido enviada correctamente",
      })

      setReplyContent("")
      setIsReplying(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Build conversation thread (original + replies)
  const allMessages = [message, ...(message.replies || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="border-2 border-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-white">
            {otherUserInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{otherUserName}</p>
          {message.subject && (
            <p className="text-sm text-muted-foreground">{message.subject}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {allMessages.map((msg) => {
          const isMine = msg.senderId === currentUserId
          const sender = isMine ? msg.sender : msg.sender
          const senderName = sender.employeeProfile
            ? `${sender.employeeProfile.firstName} ${sender.employeeProfile.lastName}`
            : sender.email
          const senderInitials = sender.employeeProfile
            ? `${sender.employeeProfile.firstName[0]}${sender.employeeProfile.lastName[0]}`
            : sender.email[0].toUpperCase()

          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                isMine && "flex-row-reverse"
              )}
            >
              <Avatar className={cn(
                "h-8 w-8 border-2",
                isMine ? "border-muted" : "border-primary/20"
              )}>
                <AvatarFallback className={cn(
                  "text-xs",
                  isMine
                    ? "bg-muted"
                    : "bg-gradient-to-br from-primary to-emerald-600 text-white"
                )}>
                  {senderInitials}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "max-w-[70%] space-y-1",
                isMine && "text-right"
              )}>
                <div className={cn(
                  "rounded-2xl px-4 py-2.5",
                  isMine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className={cn(
                  "flex items-center gap-2 text-xs text-muted-foreground",
                  isMine && "justify-end"
                )}>
                  <span>
                    {new Date(msg.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMine && msg.status === "READ" && (
                    <CheckCheck className="h-3 w-3 text-primary" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply section */}
      <div className="border-t pt-4">
        {isReplying ? (
          <div className="space-y-3">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Escribe tu respuesta..."
              rows={3}
              disabled={isLoading}
              className="rounded-xl resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReplying(false)
                  setReplyContent("")
                }}
                disabled={isLoading}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendReply}
                disabled={isLoading || !replyContent.trim()}
                className="rounded-xl bg-gradient-to-r from-primary to-emerald-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsReplying(true)}
            variant="outline"
            className="w-full rounded-xl"
          >
            <Reply className="mr-2 h-4 w-4" />
            Responder
          </Button>
        )}
      </div>
    </div>
  )
}
