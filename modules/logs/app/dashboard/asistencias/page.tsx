"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardCheck, Clock, UserCheck, UserX, CalendarIcon, Search, Download, LogIn, LogOut } from "lucide-react"
import { mockAttendance, mockTeachers, type Attendance } from "@/lib/mock-data"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

export default function AsistenciasPage() {
  const { user } = useAuth()
  const [attendances, setAttendances] = useState<Attendance[]>(mockAttendance)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [filterEstado, setFilterEstado] = useState<string>("todos")

  const isDocente = user?.rol === "docente"

  // Filter attendances
  const filteredAttendances = attendances.filter((att) => {
    const matchesSearch = mockTeachers.some((t) => {
      if (t.id !== att.profesor_id) return false
      const fullName = `${t.nombres} ${t.apellidos}`.toLowerCase()
      return fullName.includes(searchQuery.toLowerCase())
    })

    const matchesEstado = filterEstado === "todos" || att.estado === filterEstado

    const matchesDate = att.fecha === format(selectedDate, "yyyy-MM-dd")

    // If docente, only show their own attendance
    const matchesUser = !isDocente || att.profesor_id === user?.id

    return matchesSearch && matchesEstado && matchesDate && matchesUser
  })

  const getTeacherName = (profesorId: string) => {
    const teacher = mockTeachers.find((t) => t.id === profesorId)
    return teacher ? `${teacher.nombres} ${teacher.apellidos}` : "Desconocido"
  }

  const getEstadoBadge = (estado: Attendance["estado"]) => {
    const variants = {
      presente: { variant: "default" as const, label: "Presente", className: "bg-primary" },
      ausente: { variant: "destructive" as const, label: "Ausente", className: "" },
      tarde: { variant: "outline" as const, label: "Tarde", className: "border-orange-500 text-orange-500" },
      justificado: { variant: "secondary" as const, label: "Justificado", className: "" },
    }

    const config = variants[estado]
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const handleClockIn = () => {
    if (!user) return

    const now = new Date()
    const newAttendance: Attendance = {
      id: Date.now().toString(),
      profesor_id: user.id,
      fecha: format(now, "yyyy-MM-dd"),
      hora_entrada: format(now, "HH:mm"),
      estado: "presente",
    }

    setAttendances([...attendances, newAttendance])
  }

  const handleClockOut = () => {
    if (!user) return

    const today = format(new Date(), "yyyy-MM-dd")
    const todayAttendance = attendances.find((a) => a.profesor_id === user.id && a.fecha === today && !a.hora_salida)

    if (todayAttendance) {
      const now = new Date()
      setAttendances(
        attendances.map((a) => (a.id === todayAttendance.id ? { ...a, hora_salida: format(now, "HH:mm") } : a)),
      )
    }
  }

  // Stats
  const todayAttendances = attendances.filter((a) => a.fecha === format(selectedDate, "yyyy-MM-dd"))
  const stats = {
    total: todayAttendances.length,
    presentes: todayAttendances.filter((a) => a.estado === "presente").length,
    ausentes: todayAttendances.filter((a) => a.estado === "ausente").length,
    tarde: todayAttendances.filter((a) => a.estado === "tarde").length,
  }

  // Check if user has clocked in today
  const hasCheckedInToday = isDocente
    ? attendances.some(
        (a) => a.profesor_id === user?.id && a.fecha === format(new Date(), "yyyy-MM-dd") && !a.hora_salida,
      )
    : false

  const hasCheckedOutToday = isDocente
    ? attendances.some(
        (a) => a.profesor_id === user?.id && a.fecha === format(new Date(), "yyyy-MM-dd") && a.hora_salida,
      )
    : false

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Asistencias</h2>
            <p className="text-muted-foreground">Control de asistencias y fichajes</p>
          </div>
          {isDocente && (
            <div className="flex gap-2">
              <Button
                onClick={handleClockIn}
                disabled={hasCheckedInToday || hasCheckedOutToday}
                className="bg-primary hover:bg-primary/90"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Fichar Entrada
              </Button>
              <Button onClick={handleClockOut} disabled={!hasCheckedInToday || hasCheckedOutToday} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Fichar Salida
              </Button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total del Día</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presentes</CardTitle>
              <UserCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.presentes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausentes</CardTitle>
              <UserX className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.ausentes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Llegadas Tarde</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.tarde}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="presente">Presente</SelectItem>
              <SelectItem value="ausente">Ausente</SelectItem>
              <SelectItem value="tarde">Tarde</SelectItem>
              <SelectItem value="justificado">Justificado</SelectItem>
            </SelectContent>
          </Select>

          {!isDocente && (
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          )}
        </div>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Asistencias</CardTitle>
            <CardDescription>
              {filteredAttendances.length} registro{filteredAttendances.length !== 1 ? "s" : ""} para{" "}
              {format(selectedDate, "PPP", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora Entrada</TableHead>
                    <TableHead>Hora Salida</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No se encontraron registros de asistencia
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttendances.map((attendance) => (
                      <TableRow key={attendance.id}>
                        <TableCell className="font-medium">{getTeacherName(attendance.profesor_id)}</TableCell>
                        <TableCell>{format(new Date(attendance.fecha), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{attendance.hora_entrada}</TableCell>
                        <TableCell>{attendance.hora_salida || "-"}</TableCell>
                        <TableCell>{getEstadoBadge(attendance.estado)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {attendance.observaciones || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {!isDocente && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumen Semanal</CardTitle>
                <CardDescription>Asistencias de los últimos 7 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Promedio de asistencia</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total de profesores</span>
                    <span className="font-medium">{mockTeachers.filter((t) => t.estado === "activo").length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ausencias sin justificar</span>
                    <span className="font-medium text-destructive">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
                <CardDescription>Situaciones que requieren atención</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-destructive mt-1.5" />
                    <div>
                      <p className="font-medium">2 profesores sin fichar hoy</p>
                      <p className="text-muted-foreground text-xs">Verificar estado</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
                    <div>
                      <p className="font-medium">3 llegadas tarde esta semana</p>
                      <p className="text-muted-foreground text-xs">Revisar patrones</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
