"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Search } from "lucide-react"
import { normalizeString } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useTeachers } from "@/hooks/use-teachers"
import { useSubjects } from "@/hooks/use-subjects"
import { useCourses } from "@/hooks/use-courses"

interface AssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment?: any
  onSave: (assignment: any) => void
}

export function AssignmentDialog({ open, onOpenChange, assignment, onSave }: AssignmentDialogProps) {
  const { teachers } = useTeachers()
  const { subjects } = useSubjects()
  const { courses } = useCourses()

  const [formData, setFormData] = useState({
    profesor_ids: [] as string[],
    materia: "",
    curso: "",
    division: "",
    turno: "mañana",
    dia: "lunes" as "lunes" | "martes" | "miércoles" | "jueves" | "viernes",
    hora_inicio: "07:35",
    hora_fin: "08:35",
  })

  const [teacherSearchQuery, setTeacherSearchQuery] = useState("")
  const [materiaSearchQuery, setMateriaSearchQuery] = useState("")
  const [isTeacherPopoverOpen, setIsTeacherPopoverOpen] = useState(false)
  const [isMateriaPopoverOpen, setIsMateriaPopoverOpen] = useState(false)

  // 15 35 45 55
  const getTimeSlots = () => {
    const slots = {
      mañana: ["07:35", "08:15", "08:35", "08:45", "08:55", "09:15", "09:35", "09:45", "09:55", "10:15", "10:35", "10:45", "10:55", "11:15", "11:35", "11:45", "11:55", "12:15", "12:35", "12:45", "12:55"],
      tarde: ["13:15", "13:35", "13:45", "13:55", "14:15", "14:35", "14:45", "14:55", "15:15", "15:35", "15:45", "15:55", "16:15", "16:35", "16:45", "16:55", "17:15", "17:35"],
      noche: ["19:15", "19:35", "19:45", "19:55", "20:15", "20:35", "20:45", "20:55", "21:15", "21:35", "21:45", "21:55", "22:15", "22:35", "22:45"],
    }
    return slots[formData.turno as keyof typeof slots] || []
  }

  const filteredTeachers = teachers.filter((teacher) => {
    // Exclude already selected teachers
    if (formData.profesor_ids.includes(teacher.id)) return false

    if (!teacherSearchQuery) return teacher.estado === "activo"

    const normalizedQuery = normalizeString(teacherSearchQuery)
    const normalizedFullName = normalizeString(`${teacher.nombres} ${teacher.apellidos}`)
    const normalizedEmail = normalizeString(teacher.email)
    const normalizedLegajo = normalizeString(teacher.legajo)

    return (
      teacher.estado === "activo" &&
      (normalizedFullName.includes(normalizedQuery) ||
        normalizedEmail.includes(normalizedQuery) ||
        normalizedLegajo.includes(normalizedQuery))
    )
  })

  const filteredMaterias = subjects.filter((subject) => {
    // Exclude already selected subject
    if (formData.materia && subject.nombre === formData.materia) return false

    if (!materiaSearchQuery) return true
    const normalizedQuery = normalizeString(materiaSearchQuery)
    const normalizedMateria = normalizeString(subject.nombre)
    return normalizedMateria.includes(normalizedQuery)
  })

  const selectedTeachers = teachers.filter((t) => formData.profesor_ids.includes(t.id))

  useEffect(() => {
    if (assignment) {
      setFormData(assignment)
    } else {
      // Get first available curso and division from database
      const firstCurso = courses.length > 0 ? courses[0].anio : ""
      const firstDivision = courses.length > 0 ? courses[0].division : ""

      setFormData({
        profesor_ids: [],
        materia: "",
        curso: firstCurso,
        division: firstDivision,
        turno: "mañana",
        dia: "lunes",
        hora_inicio: "07:35",
        hora_fin: "08:35",
      })
    }
  }, [assignment, open, courses])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const addTeacher = (teacherId: string) => {
    if (!formData.profesor_ids.includes(teacherId)) {
      setFormData({ ...formData, profesor_ids: [...formData.profesor_ids, teacherId] })
    }
    setTeacherSearchQuery("")
  }

  const removeTeacher = (teacherId: string) => {
    setFormData({ ...formData, profesor_ids: formData.profesor_ids.filter((id) => id !== teacherId) })
  }

  const selectMateria = (materia: string) => {
    setFormData({ ...formData, materia })
    setIsMateriaPopoverOpen(false)
    setMateriaSearchQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{assignment ? "Editar Asignación" : "Nueva Asignación"}</DialogTitle>
          <DialogDescription>
            {assignment ? "Modifique los datos de la asignación" : "Complete los datos de la nueva asignación"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Profesores *</Label>
            <Popover open={isTeacherPopoverOpen} onOpenChange={setIsTeacherPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar profesor...
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar por nombre, legajo o email..."
                    value={teacherSearchQuery}
                    onValueChange={setTeacherSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron profesores.</CommandEmpty>
                    <CommandGroup>
                      {filteredTeachers.map((teacher) => (
                        <CommandItem
                          key={teacher.id}
                          onSelect={() => {
                            addTeacher(teacher.id)
                            setIsTeacherPopoverOpen(false)
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {teacher.nombres} {teacher.apellidos}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {teacher.legajo} • {teacher.email}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedTeachers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTeachers.map((teacher) => (
                  <Badge key={teacher.id} variant="secondary" className="gap-1">
                    {teacher.nombres} {teacher.apellidos}
                    <button
                      type="button"
                      onClick={() => removeTeacher(teacher.id)}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Materia *</Label>
            <Popover open={isMateriaPopoverOpen} onOpenChange={setIsMateriaPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <Search className="mr-2 h-4 w-4" />
                  {formData.materia || "Buscar materia..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar materia..."
                    value={materiaSearchQuery}
                    onValueChange={setMateriaSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron materias.</CommandEmpty>
                    <CommandGroup>
                      {filteredMaterias.map((subject) => (
                        <CommandItem key={subject.id} onSelect={() => selectMateria(subject.nombre)}>
                          {subject.nombre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="curso">Curso *</Label>
              <Select value={formData.curso} onValueChange={(value) => setFormData({ ...formData, curso: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(courses.map(c => c.anio))).sort().map((anio) => (
                    <SelectItem key={anio} value={anio}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="division">División *</Label>
              <Select
                value={formData.division}
                onValueChange={(value) => setFormData({ ...formData, division: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(courses.map(c => String(c.division)))).sort().map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="turno">Turno *</Label>
            <Select
              value={formData.turno}
              onValueChange={(value) =>
                setFormData({ ...formData, turno: value, hora_inicio: getTimeSlots()[0] || "07:35" })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mañana">Mañana</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noche">Noche</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dia">Día *</Label>
            <Select value={formData.dia} onValueChange={(value: any) => setFormData({ ...formData, dia: value })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lunes">Lunes</SelectItem>
                <SelectItem value="martes">Martes</SelectItem>
                <SelectItem value="miércoles">Miércoles</SelectItem>
                <SelectItem value="jueves">Jueves</SelectItem>
                <SelectItem value="viernes">Viernes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Hora de Inicio *</Label>
              <Select
                value={formData.hora_inicio}
                onValueChange={(value) => setFormData({ ...formData, hora_inicio: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTimeSlots().map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_fin">Hora de Fin *</Label>
              <Select
                value={formData.hora_fin}
                onValueChange={(value) => setFormData({ ...formData, hora_fin: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTimeSlots().map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {assignment ? "Guardar Cambios" : "Crear Asignación"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
