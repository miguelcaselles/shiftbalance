import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeftRight, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { ChangeRequestActions } from "@/components/admin/change-request-actions"

export default async function AdminChangesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  // Obtener todas las solicitudes de cambio
  const changeRequests = await db.shiftChangeRequest.findMany({
    include: {
      requester: {
        include: { user: true },
      },
      scheduleEntry: {
        include: { shiftType: true, schedulePeriod: true },
      },
      targetShiftType: true,
      offers: {
        include: { offerer: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const pendingRequests = changeRequests.filter(
    (r) => r.status === "PENDING" || r.status === "OPEN" || r.status === "SELECTING" || r.status === "AWAITING_APPROVAL"
  )
  const completedRequests = changeRequests.filter((r) => r.status === "COMPLETED")
  const rejectedRequests = changeRequests.filter((r) => r.status === "REJECTED" || r.status === "CANCELLED")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>
      case "OPEN":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Abierta</Badge>
      case "SELECTING":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Seleccionando</Badge>
      case "AWAITING_APPROVAL":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Esperando aprobación</Badge>
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completada</Badge>
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rechazada</Badge>
      case "CANCELLED":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case "ABSENCE":
        return <Badge className="bg-red-500">Ausencia</Badge>
      case "SWAP":
        return <Badge className="bg-blue-500">Cambio de turno</Badge>
      case "COVERAGE":
        return <Badge className="bg-purple-500">Cobertura</Badge>
      default:
        return <Badge>{changeType}</Badge>
    }
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "LOW":
        return <Badge variant="outline" className="text-green-600 border-green-300">Baja</Badge>
      case "MEDIUM":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Media</Badge>
      case "HIGH":
        return <Badge variant="outline" className="text-red-600 border-red-300">Alta</Badge>
      default:
        return <Badge variant="outline">{urgency}</Badge>
    }
  }

  const renderRequestCard = (request: typeof changeRequests[0]) => (
    <Card key={request.id} className="rounded-2xl">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Info principal */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              {getStatusBadge(request.status)}
              {getChangeTypeBadge(request.changeType)}
              {getUrgencyBadge(request.urgency)}
            </div>

            <div>
              <p className="font-semibold text-lg">
                {request.requester.firstName} {request.requester.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.requester.user.email}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {request.scheduleEntry.date.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-white text-xs font-medium"
                style={{ backgroundColor: request.scheduleEntry.shiftType.color }}
              >
                {request.scheduleEntry.shiftType.code} - {request.scheduleEntry.shiftType.name}
              </div>
            </div>

            {request.changeType === "SWAP" && request.targetShiftType && (
              <div className="text-sm">
                <span className="text-muted-foreground">Quiere cambiar a: </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-white text-xs font-medium ml-1"
                  style={{ backgroundColor: request.targetShiftType.color }}
                >
                  {request.targetShiftType.code} - {request.targetShiftType.name}
                </span>
              </div>
            )}

            {request.reason && (
              <div className="text-sm">
                <span className="text-muted-foreground">Motivo: </span>
                <span>{request.reason}</span>
              </div>
            )}

            {request.offers.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {request.offers.length} oferta(s) de cobertura recibida(s)
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Solicitado el {request.createdAt.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Acciones */}
          {(request.status === "PENDING" || request.status === "OPEN" || request.status === "AWAITING_APPROVAL") && (
            <ChangeRequestActions requestId={request.id} currentStatus={request.status} />
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cambios de Turno</h1>
          <p className="text-muted-foreground">
            Administra las solicitudes de cambio de los trabajadores
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-yellow-100 px-4 py-2 dark:bg-yellow-900/30">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-700 dark:text-yellow-400">{pendingRequests.length} pendientes</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="pending" className="gap-2 rounded-lg">
            <Clock className="h-4 w-4" />
            Pendientes
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            Completadas
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2 rounded-lg">
            <XCircle className="h-4 w-4" />
            Rechazadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center">
                <ArrowLeftRight className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No hay solicitudes pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(renderRequestCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedRequests.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No hay solicitudes completadas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedRequests.map(renderRequestCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedRequests.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center">
                <XCircle className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No hay solicitudes rechazadas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedRequests.map(renderRequestCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
