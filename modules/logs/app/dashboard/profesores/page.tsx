"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, Users, FileDown, FileSpreadsheet, Loader2 } from "lucide-react"
import { type Teacher } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { TeacherDialog } from "@/components/teacher-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { normalizeString } from "@/lib/utils"
import { exportTeachersToExcel } from "@/lib/export-utils"
import { TeachersProvider, useTeachers } from "@/hooks/use-teachers"

function ProfesoresContent() {
  const router = useRouter()
  const { teachers, loading, addTeacher, updateTeacher, deleteTeacher } = useTeachers()

  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | undefined>()
  const [statusFilter, setStatusFilter] = useState<"todos" | Teacher["estado"]>("todos")
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ open: boolean; teacherId: string | null }>({
    open: false,
    teacherId: null,
  })

  const filteredTeachers = teachers.filter((teacher) => {
    const normalizedQuery = normalizeString(searchQuery)
    const matchesSearch =
      normalizeString(teacher.nombres).includes(normalizedQuery) ||
      normalizeString(teacher.apellidos).includes(normalizedQuery) ||
      normalizeString(teacher.legajo).includes(normalizedQuery) ||
      normalizeString(teacher.email).includes(normalizedQuery)

    const matchesStatus = statusFilter === "todos" || teacher.estado === statusFilter

    return matchesSearch && matchesStatus
  })

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
      <Badge variant={variants[estado]} className={estado === "activo" ? "bg-primary" : ""}>
        {labels[estado]}
      </Badge>
    )
  }

  const handleAddTeacher = () => {
    setSelectedTeacher(undefined)
    setIsDialogOpen(true)
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setIsDialogOpen(true)
  }

  const handleDeleteTeacher = (id: string) => {
    setDeleteConfirmation({ open: true, teacherId: id })
  }

  const confirmDelete = async () => {
    if (deleteConfirmation.teacherId) {
      await deleteTeacher(deleteConfirmation.teacherId)
    }
    setDeleteConfirmation({ open: false, teacherId: null })
  }

  const handleSaveTeacher = async (teacher: Teacher) => {
    if (selectedTeacher) {
      await updateTeacher(teacher)
    } else {
      await addTeacher(teacher)
    }
    setIsDialogOpen(false)
  }

  const handleExportExcel = () => {
    exportTeachersToExcel(filteredTeachers, `profesores_${new Date().toISOString().split("T")[0]}.csv`)
  }

  const handleExportPDF = () => {
    window.print()
  }

  const stats = {
    total: teachers.length,
    activos: teachers.filter((t) => t.estado === "activo").length,
    licencia: teachers.filter((t) => t.estado === "licencia").length,
    inactivos: teachers.filter((t) => t.estado === "inactivo").length,
  }

  const activosTeachers = filteredTeachers.filter((t) => t.estado === "activo")
  const licenciaTeachers = filteredTeachers.filter((t) => t.estado === "licencia")
  const inactivosTeachers = filteredTeachers.filter((t) => t.estado === "inactivo")

  const TeachersTable = ({ teachers }: { teachers: Teacher[] }) => (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Legajo</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
            <TableHead className="hidden lg:table-cell">Tipo Contrato</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando profesores...
                  </div>
                ) : (
                  "No se encontraron profesores"
                )}
              </TableCell>
            </TableRow>
          ) : (
            teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium">{teacher.legajo}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {teacher.nombres} {teacher.apellidos}
                </TableCell>
                <TableCell className="hidden md:table-cell">{teacher.email}</TableCell>
                <TableCell className="hidden lg:table-cell">{teacher.telefono}</TableCell>
                <TableCell className="capitalize hidden lg:table-cell">
                  {teacher.tipo_contrato.replace(/_/g, " ")}
                </TableCell>
                <TableCell>{getEstadoBadge(teacher.estado)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/profesores/${teacher.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditTeacher(teacher)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteTeacher(teacher.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Profesores</h2>
            <p className="text-muted-foreground">Gestión de profesores y sus datos</p>
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
            <Button onClick={handleAddTeacher} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Profesor
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profesores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <div className="h-3 w-3 rounded-full bg-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Licencia</CardTitle>
              <div className="h-3 w-3 rounded-full bg-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.licencia}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
              <div className="h-3 w-3 rounded-full bg-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactivos}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, legajo o email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
          <TabsList>
            <TabsTrigger value="todos">Todos ({filteredTeachers.length})</TabsTrigger>
            <TabsTrigger value="activo">Activos ({activosTeachers.length})</TabsTrigger>
            <TabsTrigger value="licencia">En Licencia ({licenciaTeachers.length})</TabsTrigger>
            <TabsTrigger value="inactivo">Inactivos ({inactivosTeachers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="todos">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Profesores</CardTitle>
                <CardDescription>
                  {filteredTeachers.length} profesor{filteredTeachers.length !== 1 ? "es" : ""} encontrado
                  {filteredTeachers.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeachersTable teachers={filteredTeachers} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activo">
            <Card>
              <CardHeader>
                <CardTitle>Profesores Activos</CardTitle>
                <CardDescription>
                  {activosTeachers.length} profesor{activosTeachers.length !== 1 ? "es" : ""} activo
                  {activosTeachers.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeachersTable teachers={activosTeachers} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="licencia">
            <Card>
              <CardHeader>
                <CardTitle>Profesores en Licencia</CardTitle>
                <CardDescription>
                  {licenciaTeachers.length} profesor{licenciaTeachers.length !== 1 ? "es" : ""} en licencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeachersTable teachers={licenciaTeachers} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inactivo">
            <Card>
              <CardHeader>
                <CardTitle>Profesores Inactivos</CardTitle>
                <CardDescription>
                  {inactivosTeachers.length} profesor{inactivosTeachers.length !== 1 ? "es" : ""} inactivo
                  {inactivosTeachers.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeachersTable teachers={inactivosTeachers} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TeacherDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        teacher={selectedTeacher}
        onSave={handleSaveTeacher}
      />
      <ConfirmationDialog
        open={deleteConfirmation.open}
        onOpenChange={(open: any) => setDeleteConfirmation({ open, teacherId: null })}
        title="Eliminar Profesor"
        description="¿Está seguro de que desea eliminar este profesor? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </DashboardLayout>
  )
}

export default function ProfesoresPage() {
  return (
    <TeachersProvider>
      <ProfesoresContent />
    </TeachersProvider>
  )
}

