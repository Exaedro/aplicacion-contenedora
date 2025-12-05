"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileDown,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { type LeaveRequest } from "@/lib/mock-data"
import { LeaveRequestDialog } from "@/components/leave-request-dialog"
import { RejectionReasonDialog } from "@/components/rejection-reason-dialog"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import { LeaveRequestTable } from "./LeaveRequestTable"
import { normalizeString } from "@/lib/utils"
import { exportLeaveRequestsToExcel } from "@/lib/export-utils"
import { LeavesProvider, useLeaves } from "@/hooks/use-leaves"
import { TeachersProvider, useTeachers } from "@/hooks/use-teachers"

function LicenciasContent() {
  const { user } = useAuth()
  const { leaves, loading: leavesLoading, addLeaveRequest, updateLeaveRequest } = useLeaves()
  const { teachers, loading: teachersLoading } = useTeachers()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterEstado, setFilterEstado] = useState<string>("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | undefined>()
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; requestId: string | null }>({
    open: false,
    requestId: null,
  })

  const isDocente = user?.rol === "docente"
  const canApprove = user?.rol === "admin" || user?.rol === "secretaria"
  const loading = leavesLoading || teachersLoading

  const filteredRequests = leaves.filter((req) => {
    const teacher = teachers.find((t) => t.id === req.profesor_id)
    const normalizedQuery = normalizeString(searchQuery)
    const matchesSearch = teacher
      ? normalizeString(`${teacher.nombres} ${teacher.apellidos}`).includes(normalizedQuery)
      : false

    const matchesEstado = filterEstado === "todos" || req.estado === filterEstado
    const matchesUser = !isDocente || req.profesor_id === user?.id

    return matchesSearch && matchesEstado && matchesUser
  })

  const getTeacherName = (profesorId: string) => {
    const teacher = teachers.find((t) => t.id === profesorId)
    return teacher ? `${teacher.nombres} ${teacher.apellidos}` : "Desconocido"
  }

  const handleExportExcel = () => {
    exportLeaveRequestsToExcel(
      filteredRequests,
      getTeacherName,
      `licencias_${new Date().toISOString().split("T")[0]}.csv`,
    )
  }

  const handleExportPDF = () => {
    window.print()
  }

  const getEstadoBadge = (estado: LeaveRequest["estado"]) => {
    const variants = {
      pendiente: {
        variant: "outline" as const,
        label: "Pendiente",
        icon: Clock,
        className: "border-orange-500 text-orange-500",
      },
      aprobado: { variant: "default" as const, label: "Aprobado", icon: CheckCircle, className: "bg-primary" },
      rechazado: { variant: "destructive" as const, label: "Rechazado", icon: XCircle, className: "" },
    }

    const config = variants[estado]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTipoBadge = (tipo: LeaveRequest["tipo"]) => {
    const labels = {
      enfermedad: "Enfermedad",
      personal: "Personal",
      estudio: "Estudio",
      maternidad: "Maternidad",
      otro: "Otro",
    }

    return <Badge variant="secondary">{labels[tipo]}</Badge>
  }

  const handleNewRequest = () => {
    setSelectedRequest(undefined)
    setIsDialogOpen(true)
  }

  const handleSaveRequest = async (request: Partial<LeaveRequest>) => {
    if (selectedRequest && request.id) {
      await updateLeaveRequest(request as LeaveRequest)
    } else {
      await addLeaveRequest({
        tipo: request.tipo!,
        fecha_inicio: request.fecha_inicio!,
        fecha_fin: request.fecha_fin!,
        dias_solicitados: request.dias_solicitados!,
        motivo: request.motivo!,
        profesor_id: user?.id || "1",
        fecha_solicitud: format(new Date(), "yyyy-MM-dd"),
        estado: "pendiente",
      })
    }
    setIsDialogOpen(false)
  }

  const handleApprove = async (id: string) => {
    const request = leaves.find(r => r.id === id)
    if (request) {
      await updateLeaveRequest({
        ...request,
        estado: "aprobado",
        aprobado_por: user?.id
      })
    }
  }

  const handleReject = (id: string) => {
    setRejectionDialog({ open: true, requestId: id })
  }

  const confirmRejection = async (reason: string) => {
    if (rejectionDialog.requestId) {
      const request = leaves.find(r => r.id === rejectionDialog.requestId)
      if (request) {
        await updateLeaveRequest({
          ...request,
          estado: "rechazado",
          motivo_rechazo: reason
        })
      }
    }
    setRejectionDialog({ open: false, requestId: null })
  }

  const pendingRequests = filteredRequests.filter((r) => r.estado === "pendiente")
  const approvedRequests = filteredRequests.filter((r) => r.estado === "aprobado")
  const rejectedRequests = filteredRequests.filter((r) => r.estado === "rechazado")

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Licencias</h2>
            <p className="text-muted-foreground">Gestión de solicitudes de licencias</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar a Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} disabled>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar a PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isDocente && (
              <Button onClick={handleNewRequest} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Solicitud
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de profesor..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="todas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="todas">Todas ({filteredRequests.length})</TabsTrigger>
            <TabsTrigger value="pendientes">
              Pendientes ({pendingRequests.length})
              {pendingRequests.length > 0 && canApprove && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="aprobadas">Aprobadas ({approvedRequests.length})</TabsTrigger>
            <TabsTrigger value="rechazadas">Rechazadas ({rejectedRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="todas">
            <LeaveRequestTable
              requests={filteredRequests}
              getTeacherName={getTeacherName}
              getEstadoBadge={getEstadoBadge}
              getTipoBadge={getTipoBadge}
              canApprove={canApprove}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </TabsContent>

          <TabsContent value="pendientes">
            <LeaveRequestTable
              requests={pendingRequests}
              getTeacherName={getTeacherName}
              getEstadoBadge={getEstadoBadge}
              getTipoBadge={getTipoBadge}
              canApprove={canApprove}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </TabsContent>

          <TabsContent value="aprobadas">
            <LeaveRequestTable
              requests={approvedRequests}
              getTeacherName={getTeacherName}
              getEstadoBadge={getEstadoBadge}
              getTipoBadge={getTipoBadge}
              canApprove={canApprove}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </TabsContent>

          <TabsContent value="rechazadas">
            <LeaveRequestTable
              requests={rejectedRequests}
              getTeacherName={getTeacherName}
              getEstadoBadge={getEstadoBadge}
              getTipoBadge={getTipoBadge}
              canApprove={canApprove}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </TabsContent>
        </Tabs>

        {canApprove && pendingRequests.length > 0 && (
          <Card className="border-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-500 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Solicitudes Pendientes de Aprobación
              </CardTitle>
              <CardDescription>
                Hay {pendingRequests.length} solicitud{pendingRequests.length !== 1 ? "es" : ""} esperando su revisión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingRequests.slice(0, 3).map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                    <div>
                      <p className="font-medium">{getTeacherName(req.profesor_id)}</p>
                      <p className="text-sm text-muted-foreground">
                        {req.tipo} - {req.dias_solicitados} días
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(req.id)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Aprobar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(req.id)}>
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <LeaveRequestDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSaveRequest} />
      <RejectionReasonDialog
        open={rejectionDialog.open}
        onOpenChange={(open: any) => setRejectionDialog({ open, requestId: null })}
        onConfirm={confirmRejection}
      />
    </DashboardLayout>
  )
}

export default function LicenciasPage() {
  return (
    <TeachersProvider>
      <LeavesProvider>
        <LicenciasContent />
      </LeavesProvider>
    </TeachersProvider>
  )
}
