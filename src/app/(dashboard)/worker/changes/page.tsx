import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, ArrowRight, Users, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function ChangesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = session.user.role === "ADMIN"
  const employeeId = session.user.employeeId

  // Mis solicitudes
  const myRequests = employeeId
    ? await db.shiftChangeRequest.findMany({
        where: { requesterId: employeeId },
        include: {
          requester: { include: { user: true } },
          scheduleEntry: { include: { shiftType: true } },
          offers: {
            include: {
              offerer: { include: { user: true } },
            },
          },
          approvals: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : []

  // Solicitudes donde puedo ofertar
  const availableRequests = employeeId
    ? await db.shiftChangeRequest.findMany({
        where: {
          status: { in: ["OPEN", "SELECTING"] },
          requesterId: { not: employeeId },
          offers: {
            none: { offererId: employeeId },
          },
        },
        include: {
          requester: { include: { user: true } },
          scheduleEntry: { include: { shiftType: true } },
          offers: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  // Mis ofertas
  const myOffers = employeeId
    ? await db.coverageOffer.findMany({
        where: { offererId: employeeId },
        include: {
          request: {
            include: {
              requester: { include: { user: true } },
              scheduleEntry: { include: { shiftType: true } },
            },
          },
        },
        orderBy: { offeredAt: "desc" },
        take: 20,
      })
    : []

  // Pendientes de aprobación (admin o involucrado)
  const pendingApproval = isAdmin
    ? await db.shiftChangeRequest.findMany({
        where: { status: "AWAITING_APPROVAL" },
        include: {
          requester: { include: { user: true } },
          scheduleEntry: { include: { shiftType: true } },
          offers: {
            where: { status: "SELECTED" },
            include: { offerer: { include: { user: true } } },
          },
          approvals: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  const statusColors = {
    PENDING: "secondary",
    OPEN: "info",
    SELECTING: "warning",
    AWAITING_APPROVAL: "warning",
    COMPLETED: "success",
    CANCELLED: "secondary",
    EXPIRED: "secondary",
    REJECTED: "destructive",
  } as const

  const statusLabels = {
    PENDING: "Pendiente",
    OPEN: "Abierta",
    SELECTING: "Seleccionando",
    AWAITING_APPROVAL: "Pendiente aprobación",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    EXPIRED: "Expirada",
    REJECTED: "Rechazada",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cambios de Turno</h1>
        <p className="text-muted-foreground">
          Gestiona solicitudes y ofertas de cambio de turno
        </p>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available" className="gap-2">
            <Users className="h-4 w-4" />
            Disponibles ({availableRequests.length})
          </TabsTrigger>
          <TabsTrigger value="mine" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Mis solicitudes ({myRequests.length})
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Mis ofertas ({myOffers.length})
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="pending" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Pendientes ({pendingApproval.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Solicitudes disponibles */}
        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de cambio disponibles</CardTitle>
              <CardDescription>
                Compañeros que buscan quien cubra su turno
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {availableRequests.map((request) => (
                  <div key={request.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {request.requester.firstName[0]}
                          {request.requester.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {request.requester.firstName} {request.requester.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {request.scheduleEntry.date.toLocaleDateString("es-ES", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <Badge
                            style={{ backgroundColor: request.scheduleEntry.shiftType.color }}
                            className="text-white"
                          >
                            {request.scheduleEntry.shiftType.name}
                          </Badge>
                        </div>
                        {request.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            "{request.reason}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-muted-foreground">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {request.offers.length} ofertas
                      </div>
                      <Button>Ofrecerme</Button>
                    </div>
                  </div>
                ))}

                {availableRequests.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No hay solicitudes de cambio disponibles
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mis solicitudes */}
        <TabsContent value="mine">
          <Card>
            <CardHeader>
              <CardTitle>Mis solicitudes de cambio</CardTitle>
              <CardDescription>
                Turnos que has solicitado cambiar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {myRequests.map((request) => (
                  <div key={request.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {request.scheduleEntry.date.toLocaleDateString("es-ES", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </span>
                          <Badge
                            style={{ backgroundColor: request.scheduleEntry.shiftType.color }}
                            className="text-white"
                          >
                            {request.scheduleEntry.shiftType.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.offers.length} ofertas recibidas
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusColors[request.status]}>
                          {statusLabels[request.status]}
                        </Badge>
                        {request.status === "SELECTING" && request.offers.length > 0 && (
                          <Button size="sm">Elegir</Button>
                        )}
                      </div>
                    </div>

                    {/* Lista de ofertas */}
                    {request.offers.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-muted">
                        <p className="text-sm font-medium mb-2">Ofertas:</p>
                        {request.offers.map((offer) => (
                          <div
                            key={offer.id}
                            className="flex items-center justify-between py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {offer.offerer.firstName[0]}
                                  {offer.offerer.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {offer.offerer.firstName} {offer.offerer.lastName}
                              </span>
                              {offer.status === "SELECTED" && (
                                <Badge variant="success" className="text-xs">
                                  Seleccionado
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {myRequests.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No has realizado solicitudes de cambio
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mis ofertas */}
        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <CardTitle>Mis ofertas de cobertura</CardTitle>
              <CardDescription>
                Turnos que te has ofrecido a cubrir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {myOffers.map((offer) => (
                  <div key={offer.id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          Para: {offer.request.requester.firstName}{" "}
                          {offer.request.requester.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {offer.request.scheduleEntry.date.toLocaleDateString("es-ES", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <Badge
                          style={{
                            backgroundColor: offer.request.scheduleEntry.shiftType.color,
                          }}
                          className="text-white"
                        >
                          {offer.request.scheduleEntry.shiftType.name}
                        </Badge>
                      </div>
                    </div>
                    <Badge
                      variant={
                        offer.status === "SELECTED"
                          ? "success"
                          : offer.status === "PENDING"
                          ? "info"
                          : "secondary"
                      }
                    >
                      {offer.status === "SELECTED"
                        ? "Seleccionado"
                        : offer.status === "PENDING"
                        ? "Pendiente"
                        : offer.status === "REJECTED"
                        ? "No seleccionado"
                        : offer.status}
                    </Badge>
                  </div>
                ))}

                {myOffers.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No te has ofrecido a cubrir ningún turno
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pendientes de aprobación (admin) */}
        {isAdmin && (
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Cambios pendientes de aprobación</CardTitle>
                <CardDescription>
                  Requieren tu aprobación para completarse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {pendingApproval.map((request) => {
                    const selectedOffer = request.offers[0]
                    return (
                      <div key={request.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {request.requester.firstName} {request.requester.lastName}
                              {selectedOffer && (
                                <>
                                  {" → "}
                                  {selectedOffer.offerer.firstName}{" "}
                                  {selectedOffer.offerer.lastName}
                                </>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <span>
                                {request.scheduleEntry.date.toLocaleDateString("es-ES", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                })}
                              </span>
                              <Badge
                                style={{
                                  backgroundColor: request.scheduleEntry.shiftType.color,
                                }}
                                className="text-white"
                              >
                                {request.scheduleEntry.shiftType.name}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <XCircle className="mr-2 h-4 w-4" />
                              Rechazar
                            </Button>
                            <Button size="sm">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Aprobar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {pendingApproval.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      No hay cambios pendientes de aprobación
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
