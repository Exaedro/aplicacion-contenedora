"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Teacher } from "@/lib/mock-data"

interface TeacherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher?: Teacher
  onSave: (teacher: Teacher) => void
}

export function TeacherDialog({ open, onOpenChange, teacher, onSave }: TeacherDialogProps) {
  const [formData, setFormData] = useState<Partial<Teacher>>({
    legajo: "",
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    fecha_nacimiento: "",
    direccion: "",
    ciudad: "",
    provincia: "",
    codigo_postal: "",
    fecha_ingreso: "",
    estado: "activo",
    tipo_contrato: "contrato",
    titulo_principal: "",
    especialidades: [],
    observaciones: "",
  })

  useEffect(() => {
    if (teacher) {
      setFormData(teacher)
    } else {
      setFormData({
        legajo: "",
        nombres: "",
        apellidos: "",
        email: "",
        telefono: "",
        fecha_nacimiento: "",
        direccion: "",
        ciudad: "",
        provincia: "",
        codigo_postal: "",
        fecha_ingreso: "",
        estado: "activo",
        tipo_contrato: "contrato",
        titulo_principal: "",
        especialidades: [],
        observaciones: "",
      })
    }
  }, [teacher, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData as Teacher)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{teacher ? "Editar Profesor" : "Nuevo Profesor"}</DialogTitle>
          <DialogDescription>
            {teacher ? "Modifique los datos del profesor" : "Complete los datos del nuevo profesor"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legajo">Legajo *</Label>
              <Input
                id="legajo"
                value={formData.legajo}
                onChange={(e) => setFormData({ ...formData, legajo: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => setFormData({ ...formData, estado: value as Teacher["estado"] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="licencia">Licencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>
              <Input
                id="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_ingreso">Fecha de Ingreso *</Label>
              <Input
                id="fecha_ingreso"
                type="date"
                value={formData.fecha_ingreso}
                onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección *</Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              required
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad *</Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_postal">Código Postal *</Label>
              <Input
                id="codigo_postal"
                value={formData.codigo_postal}
                onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_contrato">Tipo de Contrato *</Label>
              <Select
                value={formData.tipo_contrato}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_contrato: value as Teacher["tipo_contrato"] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planta_permanente">Planta Permanente</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="suplente">Suplente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="titulo_principal">Título Principal *</Label>
              <Input
                id="titulo_principal"
                value={formData.titulo_principal}
                onChange={(e) => setFormData({ ...formData, titulo_principal: e.target.value })}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {teacher ? "Guardar Cambios" : "Crear Profesor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
