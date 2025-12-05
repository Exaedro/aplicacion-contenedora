"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, BookOpen, GraduationCap, Edit, Trash2 } from "lucide-react"
import type { Assignment } from "@/lib/mock-data"

interface Teacher {
  id: string
  nombres: string
  apellidos: string
  legajo: string
  email: string
}

interface AssignmentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: Assignment | null
  teachers: Teacher[]
  onEdit?: (assignment: Assignment) => void
  onDelete?: (assignmentId: string) => void
}

export function AssignmentDetailDialog({
  open,
  onOpenChange,
  assignment,
  teachers: allTeachers,
  onEdit,
  onDelete,
}: AssignmentDetailDialogProps) {
  if (!assignment) return null

  const teachers = allTeachers.filter((t) => assignment.profesor_ids.includes(t.id))

  const calculateDuration = () => {
    if (!assignment.hora_inicio || !assignment.hora_fin) return 0
    const [startHour, startMin] = assignment.hora_inicio.split(":").map(Number)
    const [endHour, endMin] = assignment.hora_fin.split(":").map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    return Math.round(((endMinutes - startMinutes) / 60) * 10) / 10
  }

  const duration = calculateDuration()

  const handleEdit = () => {
    onEdit?.(assignment)
    onOpenChange(false)
  }

  const handleDelete = () => {
    onDelete?.(assignment.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalles de la Asignación</DialogTitle>
          <DialogDescription>Información completa de la asignación</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Materia */}
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Materia</p>
              <p className="text-lg font-semibold">{assignment.materia}</p>
            </div>
          </div>

          {/* Curso y División */}
          <div className="flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Curso y División</p>
              <p className="text-lg font-semibold">
                {assignment.curso} - División {assignment.division}
              </p>
            </div>
          </div>

          {/* Profesores */}
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">{teachers.length === 1 ? "Profesor" : "Profesores"}</p>
              <div className="space-y-2">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="bg-secondary/50 p-3 rounded-lg">
                    <p className="font-medium">
                      {teacher.nombres} {teacher.apellidos}
                    </p>
                    <p className="text-sm text-muted-foreground">{teacher.legajo}</p>
                    <p className="text-xs text-muted-foreground">{teacher.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Horario */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Horario</p>
              <p className="text-lg font-semibold capitalize">
                {assignment.dia} • {assignment.hora_inicio} - {assignment.hora_fin}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Duración: {duration} hora{duration !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Turno */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Turno</p>
              <Badge variant="outline" className="capitalize mt-1">
                {assignment.turno}
              </Badge>
            </div>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            {onEdit && (
              <Button onClick={handleEdit} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
            {onDelete && (
              <Button onClick={handleDelete} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
