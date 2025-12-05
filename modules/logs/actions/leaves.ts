'use server'

import { query } from "@/db/database"
import { LeaveRequest } from "@/lib/mock-data"
import { revalidatePath } from "next/cache"

function mapRowToLeaveRequest(row: any): LeaveRequest {
    return {
        id: row.id.toString(),
        profesor_id: row.profesor_id.toString(),
        tipo: row.tipo,
        fecha_inicio: row.fecha_inicio ? new Date(row.fecha_inicio).toISOString().split('T')[0] : '',
        fecha_fin: row.fecha_fin ? new Date(row.fecha_fin).toISOString().split('T')[0] : '',
        dias_solicitados: row.dias_solicitados,
        motivo: row.motivo,
        estado: row.estado,
        fecha_solicitud: row.fecha_solicitud ? new Date(row.fecha_solicitud).toISOString().split('T')[0] : '',
        aprobado_por: row.aprobado_por ? row.aprobado_por.toString() : undefined,
        observaciones: row.observaciones,
        motivo_rechazo: row.motivo_rechazo
    }
}

export async function getLeaveRequestsAction(): Promise<{ success: boolean; data?: LeaveRequest[]; error?: string }> {
    try {
        const sql = `SELECT * FROM licencias WHERE deleted_at IS NULL`
        const result = await query(sql, []) as any[]
        const leaves = result.map(mapRowToLeaveRequest)
        return { success: true, data: leaves }
    } catch (error: any) {
        console.error("Error fetching leave requests:", error)
        return { success: false, error: error.message }
    }
}

export async function getLeaveRequestsByTeacherIdAction(teacherId: string): Promise<{ success: boolean; data?: LeaveRequest[]; error?: string }> {
    try {
        const sql = `SELECT * FROM licencias WHERE profesor_id = ? AND deleted_at IS NULL`
        const result = await query(sql, [teacherId]) as any[]
        const leaves = result.map(mapRowToLeaveRequest)
        return { success: true, data: leaves }
    } catch (error: any) {
        console.error("Error fetching leave requests for teacher:", error)
        return { success: false, error: error.message }
    }
}

export async function createLeaveRequestAction(leave: Omit<LeaveRequest, 'id'>): Promise<{ success: boolean; data?: LeaveRequest; error?: string }> {
    try {
        const sql = `
            INSERT INTO licencias (
                profesor_id, tipo, fecha_inicio, fecha_fin, dias_solicitados, motivo, 
                estado, fecha_solicitud, aprobado_por, observaciones, motivo_rechazo, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `
        const result: any = await query(sql, [
            leave.profesor_id,
            leave.tipo,
            leave.fecha_inicio,
            leave.fecha_fin,
            leave.dias_solicitados,
            leave.motivo,
            leave.estado,
            leave.fecha_solicitud,
            leave.aprobado_por || null,
            leave.observaciones || null,
            leave.motivo_rechazo || null
        ])

        revalidatePath('/dashboard/profesores')
        return { success: true, data: { ...leave, id: result.insertId.toString() } }
    } catch (error: any) {
        console.error("Error creating leave request:", error)
        return { success: false, error: error.message }
    }
}

export async function updateLeaveRequestAction(leave: LeaveRequest): Promise<{ success: boolean; error?: string }> {
    try {
        const sql = `
            UPDATE licencias 
            SET tipo = ?, fecha_inicio = ?, fecha_fin = ?, dias_solicitados = ?, motivo = ?, 
                estado = ?, fecha_solicitud = ?, aprobado_por = ?, observaciones = ?, motivo_rechazo = ?, updated_at = NOW()
            WHERE id = ?
        `
        await query(sql, [
            leave.tipo,
            leave.fecha_inicio,
            leave.fecha_fin,
            leave.dias_solicitados,
            leave.motivo,
            leave.estado,
            leave.fecha_solicitud,
            leave.aprobado_por || null,
            leave.observaciones || null,
            leave.motivo_rechazo || null,
            leave.id
        ])

        revalidatePath('/dashboard/profesores')
        return { success: true }
    } catch (error: any) {
        console.error("Error updating leave request:", error)
        return { success: false, error: error.message }
    }
}

export async function deleteLeaveRequestAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const sql = `UPDATE licencias SET deleted_at = NOW() WHERE id = ?`
        await query(sql, [id])
        revalidatePath('/dashboard/profesores')
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting leave request:", error)
        return { success: false, error: error.message }
    }
}
