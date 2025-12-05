import type { Teacher, Assignment, LeaveRequest } from "./mock-data"

// Convert data to CSV format
export function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = []

  // Add headers
  csvRows.push(headers.join(","))

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      // Escape quotes and wrap in quotes if contains comma
      const escaped = ("" + value).replace(/"/g, '""')
      return `"${escaped}"`
    })
    csvRows.push(values.join(","))
  }

  return csvRows.join("\n")
}

// Download CSV file
export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Export teachers to Excel (CSV)
export function exportTeachersToExcel(teachers: Teacher[], filename = "profesores.csv") {
  const data = teachers.map((t) => ({
    Legajo: t.legajo,
    Nombres: t.nombres,
    Apellidos: t.apellidos,
    Email: t.email,
    Teléfono: t.telefono,
    "Fecha Nacimiento": t.fecha_nacimiento,
    Dirección: t.direccion,
    Ciudad: t.ciudad,
    Provincia: t.provincia,
    "Código Postal": t.codigo_postal,
    "Fecha Ingreso": t.fecha_ingreso,
    Estado: t.estado,
    "Tipo Contrato": t.tipo_contrato.replace(/_/g, " "),
    "Título Principal": t.titulo_principal,
    Especialidades: t.especialidades.join("; "),
    Observaciones: t.observaciones || "",
  }))

  const headers = Object.keys(data[0])
  const csv = convertToCSV(data, headers)
  downloadCSV(filename, csv)
}

// Export assignments to Excel (CSV)
export function exportAssignmentsToExcel(
  assignments: Assignment[],
  getTeacherNames: (ids: string[]) => string,
  filename = "horarios.csv",
) {
  const data = assignments.map((a) => ({
    "Profesor(es)": getTeacherNames(a.profesor_ids),
    Materia: a.materia,
    Curso: a.curso,
    División: a.division,
    Turno: a.turno,
    Día: a.dia || "",
    "Hora Inicio": a.hora_inicio || "",
    "Hora Fin": a.hora_fin || "",
  }))

  const headers = Object.keys(data[0])
  const csv = convertToCSV(data, headers)
  downloadCSV(filename, csv)
}

// Export leave requests to Excel (CSV)
export function exportLeaveRequestsToExcel(
  requests: LeaveRequest[],
  getTeacherName: (id: string) => string,
  filename = "licencias.csv",
) {
  const data = requests.map((r) => ({
    Profesor: getTeacherName(r.profesor_id),
    Tipo: r.tipo,
    "Fecha Inicio": r.fecha_inicio,
    "Fecha Fin": r.fecha_fin,
    "Días Solicitados": r.dias_solicitados,
    Motivo: r.motivo,
    Estado: r.estado,
    "Fecha Solicitud": r.fecha_solicitud,
    Observaciones: r.observaciones || "",
  }))

  const headers = Object.keys(data[0])
  const csv = convertToCSV(data, headers)
  downloadCSV(filename, csv)
}

// Export to PDF using browser print
export function exportToPDF(elementId: string, filename: string) {
  // This will trigger the browser's print dialog
  // Users can save as PDF from there
  const printContent = document.getElementById(elementId)
  if (!printContent) return

  const originalTitle = document.title
  document.title = filename

  window.print()

  document.title = originalTitle
}

// Generate PDF-friendly HTML for teachers
export function generateTeachersPDFContent(teachers: Teacher[]): string {
  return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="text-align: center; margin-bottom: 30px;">Lista de Profesores</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Legajo</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nombre</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Email</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Teléfono</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${teachers
            .map(
              (t) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.legajo}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.nombres} ${t.apellidos}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.email}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.telefono}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.estado}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
}
