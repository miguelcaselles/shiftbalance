import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palmtree, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react"
import { VacationRequestActions } from "@/components/admin/vacation-request-actions"

export default async function AdminVacationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  // Obtener todas las solicitudes de vacaciones
  const vacationRequests = await db.vacationRequest.findMany({
    include: {
      employee: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const pendingRequests = vacationRequests.filter((r) => r.status === "PENDING")
  const approvedRequests = vacationRequests.filter((r) => r.status === "APPROVED")
  const rejectedRequests = vacationRequests.filter((r) => r.status === "REJECTED" || r.status === "CANCELLED")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Aprobada</Badge>
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rechazada</Badge>
      case "CANCELLED":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderRequestCard = (request: typeof vacationRequests[0]) => (
    <Card key={request.id} className="rounded-2xl">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Info principal */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              {getStatusBadge(request.status)}
              <Badge className="bg-emerald-500">{request.totalDays} días</Badge>
            </div>

            <div>
              <p className="font-semibold text-lg">
                {request.employee.firstName} {request.employee.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.employee.user.email}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {request.startDate.toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })}
                  {" - "}
                  {request.endDate.toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {request.reason && (
              <div className="text-sm">
                <span className="text-muted-foreground">Motivo: </span>
                <span>{request.reason}</span>
              </div>
            )}

            {request.reviewNotes && (
              <div className="text-sm bg-muted/50 rounded-lg p-3">
                <span className="text-muted-foreground font-medium">Notas del revisor: </span>
                <span>{request.reviewNotes}</span>
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
          {request.status === "PENDING" && (
            <VacationRequestActions requestId={request.id} />
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Vacaciones</h1>
          <p className="text-muted-foreground">
            Administra las solicitudes de vacaciones de los trabajadores
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
          <TabsTrigger value="approved" className="gap-2 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            Aprobadas
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
                <Palmtree className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No hay solicitudes pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(renderRequestCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRequests.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No hay solicitudes aprobadas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedRequests.map(renderRequestCard)}
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
