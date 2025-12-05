'use server'

import { query } from "@/db/database"
import { Teacher } from "@/lib/mock-data"
import { revalidatePath } from "next/cache"

// Helper to map DB result to Teacher interface
function mapRowToTeacher(row: any): Teacher {
    const especialidades = row.especialidades ? row.especialidades.split(',') : []
    
    return {
        id: row.usuario_id.toString(),
        legajo: row.legajo,
        nombres: row.nombres,
        apellidos: row.apellidos,
        email: row.email,
        telefono: row.telefono,
        fecha_nacimiento: row.fecha_nacimiento ? new Date(row.fecha_nacimiento).toISOString().split('T')[0] : '',
        direccion: row.direccion,
        ciudad: row.ciudad,
        provincia: row.provincia || '', // Assuming provincia might be missing in DB or needs to be added
        codigo_postal: row.codigo_postal,
        fecha_ingreso: row.fecha_ingreso ? new Date(row.fecha_ingreso).toISOString().split('T')[0] : '',
        estado: row.estado as "activo" | "inactivo" | "licencia",
        tipo_contrato: row.tipo_contrato as "planta_permanente" | "contrato" | "suplente",
        titulo_principal: row.titulo_principal,
        especialidades: especialidades,
        observaciones: row.observaciones
    }
}

export async function getTeachersAction(): Promise<{ success: boolean; data?: Teacher[]; error?: string }> {
    try {
        const sql = `
            SELECT 
                u.id as usuario_id, u.nombres, u.apellidos, u.email,
                pd.*
            FROM usuarios u
            JOIN profesores_datos pd ON u.id = pd.profesor_id
            WHERE u.rol = 'profesor' AND u.deleted_at IS NULL
        `
        const result = await query(sql, []) as any[]

        // query returns the data array directly based on the provided database.ts
        const teachers = result.map(mapRowToTeacher)

        return { success: true, data: teachers }
    } catch (error: any) {
        console.error("Error fetching teachers:", error)
        return { success: false, error: error.message }
    }
}

export async function getTeacherByIdAction(id: string): Promise<{ success: boolean; data?: Teacher; error?: string }> {
    try {
        const sql = `
            SELECT 
                u.id as usuario_id, u.nombres, u.apellidos, u.email,
                pd.*
            FROM usuarios u
            JOIN profesores_datos pd ON u.id = pd.profesor_id
            WHERE u.id = ? AND u.rol = 'profesor' AND u.deleted_at IS NULL
        `
        const result = await query(sql, [id]) as any[]

        if (result.length === 0) {
            return { success: false, error: "Profesor no encontrado" }
        }

        return { success: true, data: mapRowToTeacher(result[0]) }
    } catch (error: any) {
        console.error("Error fetching teacher:", error)
        return { success: false, error: error.message }
    }
}

export async function createTeacherAction(teacher: Omit<Teacher, 'id'>): Promise<{ success: boolean; data?: Teacher; error?: string }> {
    try {
        // 1. Insert into usuarios
        const userSql = `
            INSERT INTO usuarios (nombres, apellidos, email, rol, created_at, updated_at)
            VALUES (?, ?, ?, 'profesor', NOW(), NOW())
        `
        const userResult: any = await query(userSql, [teacher.nombres, teacher.apellidos, teacher.email])
        const newUserId = userResult.insertId

        // 2. Insert into profesores_datos
        const detailsSql = `
            INSERT INTO profesores_datos (
                profesor_id, legajo, telefono, fecha_nacimiento, direccion, ciudad, 
                codigo_postal, fecha_ingreso, estado, tipo_contrato, titulo_principal, especialidades, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `

        await query(detailsSql, [
            newUserId,
            teacher.legajo,
            teacher.telefono,
            teacher.fecha_nacimiento,
            teacher.direccion,
            teacher.ciudad,
            teacher.codigo_postal,
            teacher.fecha_ingreso,
            teacher.estado,
            teacher.tipo_contrato,
            teacher.titulo_principal,
            JSON.stringify(teacher.especialidades)
        ])

        revalidatePath('/dashboard/profesores')
        return { success: true, data: { ...teacher, id: newUserId.toString() } }
    } catch (error: any) {
        console.error("Error creating teacher:", error)
        return { success: false, error: error.message }
    }
}

export async function updateTeacherAction(teacher: Teacher): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Update usuarios
        const userSql = `
            UPDATE usuarios 
            SET nombres = ?, apellidos = ?, email = ?, updated_at = NOW()
            WHERE id = ?
        `
        await query(userSql, [teacher.nombres, teacher.apellidos, teacher.email, teacher.id])

        // 2. Update profesores_datos
        const detailsSql = `
            UPDATE profesores_datos 
            SET legajo = ?, telefono = ?, fecha_nacimiento = ?, direccion = ?, ciudad = ?, 
                codigo_postal = ?, fecha_ingreso = ?, estado = ?, tipo_contrato = ?, 
                titulo_principal = ?, especialidades = ?, updated_at = NOW()
            WHERE profesor_id = ?
        `

        await query(detailsSql, [
            teacher.legajo,
            teacher.telefono,
            teacher.fecha_nacimiento,
            teacher.direccion,
            teacher.ciudad,
            teacher.codigo_postal,
            teacher.fecha_ingreso,
            teacher.estado,
            teacher.tipo_contrato,
            teacher.titulo_principal,
            JSON.stringify(teacher.especialidades),
            teacher.id
        ])

        revalidatePath('/dashboard/profesores')
        return { success: true }
    } catch (error: any) {
        console.error("Error updating teacher:", error)
        return { success: false, error: error.message }
    }
}

export async function deleteTeacherAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Soft delete in usuarios
        const sql = `UPDATE usuarios SET deleted_at = NOW() WHERE id = ?`
        await query(sql, [id])

        // Soft delete in profesores_datos (optional, but good practice to mark both)
        const detailsSql = `UPDATE profesores_datos SET deleted_at = NOW() WHERE profesor_id = ?`
        await query(detailsSql, [id])

        revalidatePath('/dashboard/profesores')
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting teacher:", error)
        return { success: false, error: error.message }
    }
}
