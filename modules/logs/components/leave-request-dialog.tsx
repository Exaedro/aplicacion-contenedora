"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { LeaveRequest } from "@/lib/mock-data"
import { differenceInDays } from "date-fns"

interface LeaveRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request?: LeaveRequest
  onSave: (request: Partial<LeaveRequest>) => void
}

export function LeaveRequestDialog({ open, onOpenChange, request, onSave }: LeaveRequestDialogProps) {
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    tipo: "personal",
    fecha_inicio: "",
    fecha_fin: "",
    dias_solicitados: 0,
    motivo: "",
  })

  useEffect(() => {
    if (request) {
      setFormData(request)
    } else {
      setFormData({
        tipo: "personal",
        fecha_inicio: "",
        fecha_fin: "",
        dias_solicitados: 0,
        motivo: "",
      })
    }
  }, [request, open])

  // Calculate days when dates change
  useEffect(() => {
    if (formData.fecha_inicio && formData.fecha_fin) {
      const start = new Date(formData.fecha_inicio)
      const end = new Date(formData.fecha_fin)
      const days = differenceInDays(end, start) + 1

      if (days > 0) {
        setFormData((prev) => ({ ...prev, dias_solicitados: days }))
      }
    }
  }, [formData.fecha_inicio, formData.fecha_fin])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{request ? "Editar Solicitud" : "Nueva Solicitud de Licencia"}</DialogTitle>
          <DialogDescription>
            {request ? "Modifique los datos de la solicitud" : "Complete los datos de la solicitud de licencia"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Licencia *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value as LeaveRequest["tipo"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enfermedad">Enfermedad</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="estudio">Estudio</SelectItem>
                <SelectItem value="maternidad">Maternidad/Paternidad</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha Inicio *</Label>
              <Input
                id="fecha_inicio"
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_fin">Fecha Fin *</Label>
              <Input
                id="fecha_fin"
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dias_solicitados">Días Solicitados</Label>
            <Input id="dias_solicitados" type="number" value={formData.dias_solicitados} disabled />
            <p className="text-xs text-muted-foreground">Se calcula automáticamente según las fechas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Describa el motivo de la solicitud..."
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {request ? "Guardar Cambios" : "Enviar Solicitud"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
