"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, Plus, AlertCircle, FileDown, FileSpreadsheet, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AssignmentDialog } from "@/components/assignment-dialog"
import { AssignmentDetailDialog } from "@/components/assignment-detail-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import type { Assignment } from "@/lib/mock-data"
import { exportAssignmentsToExcel } from "@/lib/export-utils"
import { SchedulesProvider, useSchedules } from "@/hooks/use-schedules"
import { TeachersProvider, useTeachers } from "@/hooks/use-teachers"
import { SubjectsProvider } from "@/hooks/use-subjects"
import { CoursesProvider } from "@/hooks/use-courses"

type Turno = "mañana" | "tarde" | "noche"

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

const HORARIOS = {
  mañana: [
    { inicio: "07:35", fin: "08:35" },
    { inicio: "08:35", fin: "09:35" },
    { inicio: "09:55", fin: "10:55" },
    { inicio: "10:55", fin: "11:55" },
    { inicio: "11:55", fin: "12:55" },
  ],
  tarde: [
    { inicio: "13:30", fin: "14:30" },
    { inicio: "14:30", fin: "15:30" },
    { inicio: "15:50", fin: "16:50" },
    { inicio: "16:50", fin: "17:50" },
    { inicio: "17:50", fin: "18:50" },
  ],
  noche: [
    { inicio: "19:00", fin: "20:00" },
    { inicio: "20:00", fin: "21:00" },
    { inicio: "21:20", fin: "22:20" },
    { inicio: "22:20", fin: "23:20" },
  ],
}

function HorariosContent() {
  const [selectedTurno, setSelectedTurno] = useState<Turno>("mañana")
  const [selectedCurso, setSelectedCurso] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { assignments, loading: assignmentsLoading, addAssignment, updateAssignment, deleteAssignment } = useSchedules()
  const { teachers, loading: teachersLoading } = useTeachers()
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | undefined>()
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ open: boolean; assignmentId: string | null }>({
    open: false,
    assignmentId: null,
  })

  const loading = assignmentsLoading || teachersLoading

  const cursoOptions = useMemo(() => {
    return Array.from(new Set(assignments.map((a) => `${a.curso}°${a.division}`))).sort()
  }, [assignments])

  // Set selectedCurso when assignments first load
  useEffect(() => {
    if (assignments.length > 0 && !selectedCurso && cursoOptions.length > 0) {
      setSelectedCurso(cursoOptions[0])
    }
  }, [assignments.length, cursoOptions])

  const filteredAssignments = assignments.filter((a) => {
    if (!selectedCurso) return false
    const turnoMatch = a.turno === selectedTurno
    const cursoMatch = `${a.curso}°${a.division}` === selectedCurso
    return turnoMatch && cursoMatch
  })

  const getTeacherNames = (profesorIds: string[]) => {
    const matchedTeachers = teachers.filter((t) => profesorIds.includes(t.id))
    if (matchedTeachers.length === 0) return "Sin asignar"
    if (matchedTeachers.length === 1) return `${matchedTeachers[0].nombres} ${matchedTeachers[0].apellidos}`
    return `${matchedTeachers.length} profesores`
  }

  const handleSaveAssignment = async (assignment: any) => {
    if (assignment.id) {
      await updateAssignment(assignment)
    } else {
      await addAssignment(assignment)
    }
    setIsDialogOpen(false)
    setEditingAssignment(undefined)
  }

  const calculateDuration = (horaInicio: string, horaFin: string) => {
    const [startHour, startMin] = horaInicio.split(":").map(Number)
    const [endHour, endMin] = horaFin.split(":").map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    return Math.round((endMinutes - startMinutes) / 60)
  }

  const handleExportExcel = () => {
    exportAssignmentsToExcel(
      filteredAssignments,
      getTeacherNames,
      `horarios_${new Date().toISOString().split("T")[0]}.csv`,
    )
  }

  const handleExportPDF = () => {
    window.print()
  }

  const conflicts = assignments.filter((a1) =>
    assignments.some(
      (a2) =>
        a1.id !== a2.id &&
        a1.profesor_ids.some((id) => a2.profesor_ids.includes(id)) &&
        a1.dia === a2.dia &&
        a1.hora_inicio === a2.hora_inicio,
    ),
  )

  const getAssignmentForSlot = (horaInicio: string, diaIndex: number) => {
    const diaNames = ["lunes", "martes", "miércoles", "jueves", "viernes"]
    const diaName = diaNames[diaIndex]

    return filteredAssignments.filter((assignment) => {
      return assignment.dia === diaName && assignment.hora_inicio === horaInicio
    })
  }

  const shouldHideCell = (horaInicio: string, diaIndex: number) => {
    const diaNames = ["lunes", "martes", "miércoles", "jueves", "viernes"]
    const diaName = diaNames[diaIndex]
    const horarios = HORARIOS[selectedTurno as keyof typeof HORARIOS]
    const currentSlotIndex = horarios.findIndex((h) => h.inicio === horaInicio)

    for (let i = 0; i < currentSlotIndex; i++) {
      const previousSlot = horarios[i]
      const assignment = filteredAssignments.find((a) => {
        if (a.dia !== diaName || a.hora_inicio !== previousSlot.inicio) return false
        if (!a.hora_fin) return false
        const duration = calculateDuration(a.hora_inicio, a.hora_fin)
        return duration > 1
      })

      if (assignment) {
        const duration = calculateDuration(assignment.hora_inicio!, assignment.hora_fin!)
        if (i + duration > currentSlotIndex) {
          return true
        }
      }
    }

    return false
  }

  const getRowSpan = (assignment: Assignment) => {
    if (!assignment.hora_inicio || !assignment.hora_fin) return 1
    return calculateDuration(assignment.hora_inicio, assignment.hora_fin)
  }

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setIsDetailDialogOpen(true)
  }

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment)
    setIsDialogOpen(true)
  }

  const handleDeleteAssignment = (assignmentId: string) => {
    setDeleteConfirmation({ open: true, assignmentId })
  }


  const confirmDelete = async () => {
    if (deleteConfirmation.assignmentId) {
      await deleteAssignment(deleteConfirmation.assignmentId)
    }
    setDeleteConfirmation({ open: false, assignmentId: null })
  }



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
            <h2 className="text-3xl font-bold tracking-tight">Horarios</h2>
            <p className="text-muted-foreground">Gestión de horarios y asignaciones</p>
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
            <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Asignación
            </Button>
          </div>
        </div>

        {conflicts.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Conflictos Detectados
              </CardTitle>
              <CardDescription>Se encontraron asignaciones con posibles conflictos de horario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conflicts.slice(0, 3).map((conflict) => (
                  <div key={conflict.id} className="text-sm p-3 bg-destructive/10 rounded-lg">
                    <span className="font-medium">{getTeacherNames(conflict.profesor_ids)}</span> tiene múltiples
                    asignaciones en {conflict.curso} {conflict.division} - Turno {conflict.turno}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Turno:</span>
            <Select value={selectedTurno} onValueChange={(value) => setSelectedTurno(value as Turno)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mañana">Mañana</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noche">Noche</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Curso:</span>
            <Select value={selectedCurso} onValueChange={setSelectedCurso}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cursoOptions.map((curso) => (
                  <SelectItem key={curso} value={curso}>
                    {curso}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* <Card>
          <CardHeader>
            <CardTitle>Grilla de Horarios</CardTitle>
            <CardDescription>
              Vista semanal de asignaciones - Turno {selectedTurno + ` - ${selectedCurso}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Hora</TableHead>
                    {DIAS_SEMANA.map((dia) => (
                      <TableHead key={dia} className="text-center min-w-[150px]">
                        {dia}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HORARIOS[selectedTurno as keyof typeof HORARIOS].map((horario) => (
                    <TableRow key={horario.inicio}>
                      <TableCell className="font-medium text-sm">
                        {horario.inicio} - {horario.fin}
                      </TableCell>
                      {DIAS_SEMANA.map((dia, diaIndex) => {
                        if (shouldHideCell(horario.inicio, diaIndex)) {
                          return null
                        }

                        const slotAssignments = getAssignmentForSlot(horario.inicio, diaIndex)
                        const assignment = slotAssignments[0]

                        return (
                          <TableCell
                            key={`${dia}-${horario.inicio}`}
                            className="p-2 align-top h-full relative"
                            rowSpan={assignment ? getRowSpan(assignment) : 1}
                          >
                            <div className="h-full min-h-20 flex items-stretch ">
                              {assignment && (
                                <button
                                  onClick={() => handleAssignmentClick(assignment)}
                                  className="bg-primary/10 p-3 h-full rounded absolute border-l-2 border-primary w-full text-left hover:bg-primary/20 transition-colors flex flex-col flex-1"
                                  style={{ width: "92%", height: "90%" }}
                                >
                                  <p className="font-medium text-sm">{assignment.materia}</p>
                                  <p className="text-muted-foreground text-[10px] mt-1">
                                    {getTeacherNames(assignment.profesor_ids)}
                                  </p>
                                  {assignment.hora_fin && (
                                    <Badge variant="secondary" className="mt-auto text-[10px] w-fit">
                                      {calculateDuration(assignment.hora_inicio!, assignment.hora_fin)}h
                                    </Badge>
                                  )}
                                </button>
                              )}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Asignaciones</CardTitle>
            <CardDescription>
              {filteredAssignments.length} asignación{filteredAssignments.length !== 1 ? "es" : ""} encontrada
              {filteredAssignments.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesor(es)</TableHead>
                    <TableHead>Materia</TableHead>
                    <TableHead className="hidden md:table-cell">Curso</TableHead>
                    <TableHead className="hidden md:table-cell">División</TableHead>
                    <TableHead className="hidden lg:table-cell">Turno</TableHead>
                    <TableHead>Horario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No se encontraron asignaciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssignments.map((assignment) => (
                      <TableRow
                        key={assignment.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleAssignmentClick(assignment)}
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {getTeacherNames(assignment.profesor_ids)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{assignment.materia}</TableCell>
                        <TableCell className="hidden md:table-cell">{assignment.curso}</TableCell>
                        <TableCell className="hidden md:table-cell">{assignment.division}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline" className="capitalize">
                            {assignment.turno}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {assignment.hora_inicio} - {assignment.hora_fin}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AssignmentDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingAssignment(undefined)
        }}
        assignment={editingAssignment}
        onSave={handleSaveAssignment}
      />
      <AssignmentDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        assignment={selectedAssignment}
        teachers={teachers}
        onEdit={handleEditAssignment}
        onDelete={handleDeleteAssignment}
      />
      <ConfirmationDialog
        open={deleteConfirmation.open}
        onOpenChange={(open) => setDeleteConfirmation({ open, assignmentId: null })}
        title="Eliminar Asignación"
        description="¿Está seguro de que desea eliminar esta asignación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </DashboardLayout>
  )
}

export default function HorariosPage() {
  return (
    <TeachersProvider>
      <SubjectsProvider>
        <CoursesProvider>
          <SchedulesProvider>
            <HorariosContent />
          </SchedulesProvider>
        </CoursesProvider>
      </SubjectsProvider>
    </TeachersProvider>
  )
}
