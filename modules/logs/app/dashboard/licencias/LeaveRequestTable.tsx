"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, CheckCircle, XCircle } from "lucide-react"
import type { LeaveRequest } from "@/lib/mock-data"
import { format } from "date-fns"

interface LeaveRequestTableProps {
  requests: LeaveRequest[]
  getTeacherName: (id: string) => string
  getEstadoBadge: (estado: LeaveRequest["estado"]) => React.ReactNode
  getTipoBadge: (tipo: LeaveRequest["tipo"]) => React.ReactNode
  canApprove: boolean
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function LeaveRequestTable({
  requests,
  getTeacherName,
  getEstadoBadge,
  getTipoBadge,
  canApprove,
  onApprove,
  onReject,
}: LeaveRequestTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitudes de Licencia</CardTitle>
        <CardDescription>
          {requests.length} solicitud{requests.length !== 1 ? "es" : ""} encontrada{requests.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Solicitud</TableHead>
                {canApprove && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canApprove ? 8 : 7} className="text-center text-muted-foreground py-8">
                    No se encontraron solicitudes
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{getTeacherName(request.profesor_id)}</TableCell>
                    <TableCell>{getTipoBadge(request.tipo)}</TableCell>
                    <TableCell>{format(new Date(request.fecha_inicio), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{format(new Date(request.fecha_fin), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{request.dias_solicitados} días</TableCell>
                    <TableCell>{getEstadoBadge(request.estado)}</TableCell>
                    <TableCell>{format(new Date(request.fecha_solicitud), "dd/MM/yyyy")}</TableCell>
                    {canApprove && (
                      <TableCell className="text-right">
                        {request.estado === "pendiente" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onApprove(request.id)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                                Aprobar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onReject(request.id)} className="text-destructive">
                                <XCircle className="mr-2 h-4 w-4" />
                                Rechazar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
