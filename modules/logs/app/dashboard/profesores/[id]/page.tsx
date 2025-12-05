"use client"

import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, Loader2 } from "lucide-react"
import { TeachersProvider, useTeachers } from "@/hooks/use-teachers"
import { SchedulesProvider, useSchedules } from "@/hooks/use-schedules"
import { useEffect, useState } from "react"
import { Teacher } from "@/types/teacher"
import { Assignment } from "@/lib/mock-data"

function TeacherDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { getTeacherById } = useTeachers()
  const { getAssignmentsByTeacherId } = useSchedules()
  const [teacher, setTeacher] = useState<Teacher | undefined>()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (typeof params.id === 'string') {
        setLoading(true)
        try {
          const teacherData = await getTeacherById(params.id)
          setTeacher(teacherData)

          const assignmentsData = await getAssignmentsByTeacherId(params.id)
          setAssignments(assignmentsData)
        } catch (error) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchData()
  }, [params.id, getTeacherById, getAssignmentsByTeacherId])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!teacher) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Profesor no encontrado</p>
          <Button onClick={() => router.push("/dashboard/profesores")} className="mt-4">
            Volver a Profesores
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const getEstadoBadge = (estado: Teacher["estado"]) => {
    const variants = {
      activo: "default",
      inactivo: "secondary",
      licencia: "outline",
    } as const

    const labels = {
      activo: "Activo",
      inactivo: "Inactivo",
      licencia: "Licencia",
    }

    return (
      <Badge variant={variants[estado as keyof typeof variants]} className={estado === "activo" ? "bg-primary" : ""}>
        {labels[estado as keyof typeof labels]}
      </Badge>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/profesores")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold tracking-tight">
              {teacher.nombres} {teacher.apellidos}
            </h2>
            <p className="text-muted-foreground">Legajo: {teacher.legajo}</p>
          </div>
          {getEstadoBadge(teacher.estado)}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{teacher.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Teléfono</p>
                  <p className="text-sm text-muted-foreground">{teacher.telefono}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Dirección</p>
                  <p className="text-sm text-muted-foreground">
                    {teacher.direccion}
                    <br />
                    {teacher.ciudad}, {teacher.provincia} ({teacher.codigo_postal})
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fecha de Nacimiento</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(teacher.fecha_nacimiento).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Profesional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Título Principal</p>
                  <p className="text-sm text-muted-foreground">{teacher.titulo_principal}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tipo de Contrato</p>
                  <p className="text-sm text-muted-foreground capitalize">{teacher.tipo_contrato.replace(/_/g, " ")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fecha de Ingreso</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(teacher.fecha_ingreso).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Asignaciones Actuales</CardTitle>
            <CardDescription>Materias y cursos asignados</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tiene asignaciones activas</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{assignment.materia}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.curso} {assignment.division} - Turno {assignment.turno}
                      </p>
                      {assignment.dia && assignment.hora_inicio && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {assignment.dia.charAt(0).toUpperCase() + assignment.dia.slice(1)} {assignment.hora_inicio} - {assignment.hora_fin}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observations */}
        {teacher.observaciones && (
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{teacher.observaciones}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function TeacherDetailPage() {
  return (
    <TeachersProvider>
      <SchedulesProvider>
        <TeacherDetailContent />
      </SchedulesProvider>
    </TeachersProvider>
  )
}
