export interface Teacher {
  id: string
  legajo: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
  fecha_nacimiento: string
  direccion: string
  ciudad: string
  provincia: string
  codigo_postal: string
  fecha_ingreso: string
  estado: "activo" | "inactivo" | "licencia"
  tipo_contrato: "planta_permanente" | "contrato" | "suplente"
  titulo_principal: string
  especialidades: string[]
  observaciones?: string
}

export interface Assignment {
  id: string
  profesor_ids: string[]
  materia: string
  curso: string
  division: string
  turno: "mañana" | "tarde" | "noche"
  dia?: "lunes" | "martes" | "miércoles" | "jueves" | "viernes"
  hora_inicio?: string
  hora_fin?: string
}

export interface Attendance {
  id: string
  profesor_id: string
  fecha: string
  hora_entrada: string
  hora_salida?: string
  estado: "presente" | "ausente" | "tarde" | "justificado"
  observaciones?: string
}

export interface LeaveRequest {
  id: string
  profesor_id: string
  tipo: "enfermedad" | "personal" | "estudio" | "maternidad" | "otro"
  fecha_inicio: string
  fecha_fin: string
  dias_solicitados: number
  motivo: string
  estado: "pendiente" | "aprobado" | "rechazado"
  fecha_solicitud: string
  aprobado_por?: string
  observaciones?: string
  motivo_rechazo?: string
}

// Mock teachers data
export const mockTeachers: Teacher[] = [
  {
    id: "1",
    legajo: "DOC-001",
    nombres: "María",
    apellidos: "González",
    email: "maria.gonzalez@escuela.edu",
    telefono: "+54 11 1234-5678",
    fecha_nacimiento: "1985-03-15",
    direccion: "Av. Corrientes 1234",
    ciudad: "Buenos Aires",
    provincia: "Buenos Aires",
    codigo_postal: "C1043",
    fecha_ingreso: "2015-03-01",
    estado: "activo",
    tipo_contrato: "planta_permanente",
    titulo_principal: "Profesora en Matemática",
    especialidades: ["Matemática", "Física"],
  },
  {
    id: "2",
    legajo: "DOC-002",
    nombres: "Juan",
    apellidos: "Pérez",
    email: "juan.perez@escuela.edu",
    telefono: "+54 11 2345-6789",
    fecha_nacimiento: "1990-07-22",
    direccion: "Calle Falsa 456",
    ciudad: "Buenos Aires",
    provincia: "Buenos Aires",
    codigo_postal: "C1425",
    fecha_ingreso: "2018-08-15",
    estado: "activo",
    tipo_contrato: "contrato",
    titulo_principal: "Licenciado en Letras",
    especialidades: ["Lengua y Literatura", "Historia"],
  },
  {
    id: "3",
    legajo: "DOC-003",
    nombres: "Ana",
    apellidos: "Martínez",
    email: "ana.martinez@escuela.edu",
    telefono: "+54 11 3456-7890",
    fecha_nacimiento: "1988-11-30",
    direccion: "San Martín 789",
    ciudad: "Buenos Aires",
    provincia: "Buenos Aires",
    codigo_postal: "C1004",
    fecha_ingreso: "2016-02-20",
    estado: "licencia",
    tipo_contrato: "planta_permanente",
    titulo_principal: "Profesora en Biología",
    especialidades: ["Biología", "Química"],
    observaciones: "Licencia por maternidad hasta 30/12/2025",
  },
  {
    id: "4",
    legajo: "DOC-004",
    nombres: "Carlos",
    apellidos: "Rodríguez",
    email: "carlos.rodriguez@escuela.edu",
    telefono: "+54 11 4567-8901",
    fecha_nacimiento: "1982-05-18",
    direccion: "Belgrano 321",
    ciudad: "Buenos Aires",
    provincia: "Buenos Aires",
    codigo_postal: "C1092",
    fecha_ingreso: "2012-03-10",
    estado: "activo",
    tipo_contrato: "planta_permanente",
    titulo_principal: "Profesor en Educación Física",
    especialidades: ["Educación Física"],
  },
  {
    id: "5",
    legajo: "DOC-005",
    nombres: "Laura",
    apellidos: "Fernández",
    email: "laura.fernandez@escuela.edu",
    telefono: "+54 11 5678-9012",
    fecha_nacimiento: "1995-09-25",
    direccion: "Rivadavia 654",
    ciudad: "Buenos Aires",
    provincia: "Buenos Aires",
    codigo_postal: "C1002",
    fecha_ingreso: "2022-03-01",
    estado: "activo",
    tipo_contrato: "suplente",
    titulo_principal: "Profesora en Inglés",
    especialidades: ["Inglés"],
  },
]

// Mock assignments
export const mockAssignments: Assignment[] = [
  {
    id: "1",
    profesor_ids: ["1"],
    materia: "Matemática",
    curso: "1ro",
    division: "1ra",
    turno: "mañana",
    dia: "lunes",
    hora_inicio: "07:35",
    hora_fin: "09:35",
  },
  {
    id: "2",
    profesor_ids: ["1"],
    materia: "Física",
    curso: "1ro",
    division: "1ra",
    turno: "mañana",
    dia: "martes",
    hora_inicio: "09:55",
    hora_fin: "11:55",
  },
  {
    id: "3",
    profesor_ids: ["2"],
    materia: "Lengua y Literatura",
    curso: "1ro",
    division: "1ra",
    turno: "mañana",
    dia: "lunes",
    hora_inicio: "12:30",
    hora_fin: "14:30",
  },
  {
    id: "4",
    profesor_ids: ["4"],
    materia: "Educación Física",
    curso: "1ro",
    division: "1ra",
    turno: "mañana",
    dia: "viernes",
    hora_inicio: "10:35",
    hora_fin: "12:35",
  },
  {
    id: "5",
    profesor_ids: ["5"],
    materia: "Inglés",
    curso: "1ro",
    division: "1ra",
    turno: "mañana",
    dia: "jueves",
    hora_inicio: "07:50",
    hora_fin: "8:30",
  },
]

// Mock attendance
export const mockAttendance: Attendance[] = [
  {
    id: "1",
    profesor_id: "1",
    fecha: "2025-01-20",
    hora_entrada: "07:45",
    hora_salida: "13:30",
    estado: "presente",
  },
  {
    id: "2",
    profesor_id: "2",
    fecha: "2025-01-20",
    hora_entrada: "13:50",
    hora_salida: "19:15",
    estado: "presente",
  },
]

// Mock leave requests
export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "1",
    profesor_id: "3",
    tipo: "maternidad",
    fecha_inicio: "2024-11-01",
    fecha_fin: "2025-12-30",
    dias_solicitados: 425,
    motivo: "Licencia por maternidad",
    estado: "aprobado",
    fecha_solicitud: "2024-10-15",
    aprobado_por: "1",
  },
  {
    id: "2",
    profesor_id: "2",
    tipo: "personal",
    fecha_inicio: "2025-02-10",
    fecha_fin: "2025-02-12",
    dias_solicitados: 3,
    motivo: "Asuntos personales",
    estado: "pendiente",
    fecha_solicitud: "2025-01-15",
  },
]

export const MATERIAS = [
  "Matemática",
  "Lengua y Literatura",
  "Inglés",
  "Física",
  "Química",
  "Biología",
  "Historia",
  "Geografía",
  "Educación Física",
  "Música",
  "Artes Plásticas",
  "Tecnología",
  "Informática",
  "Filosofía",
  "Economía",
  "Educación Cívica",
  "Francés",
  "Italiano",
]
