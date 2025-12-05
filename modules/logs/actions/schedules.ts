'use server'

import { query } from "@/db/database"
import { Assignment } from "@/lib/mock-data"
import { revalidatePath } from "next/cache"

function mapRowToAssignment(row: any, profesorIds: string[]): Assignment {
    return {
        id: row.id.toString(),
        profesor_ids: profesorIds,
        materia: row.materia_nombre || row.materia,
        curso: row.curso_anio || row.curso,
        division: row.curso_division || row.division,
        turno: row.turno,
        dia: row.dia,
        hora_inicio: row.hora_inicio,
        hora_fin: row.hora_fin
    }
}

export async function getAssignmentsAction(): Promise<{ success: boolean; data?: Assignment[]; error?: string }> {
    try {
        const sql = `
            SELECT 
                a.id, 
                a.turno, 
                a.dia, 
                a.hora_inicio, 
                a.hora_fin,
                m.nombre as materia_nombre,
                c.anio as curso_anio,
                c.division as curso_division,
                GROUP_CONCAT(ap.profesor_id) as profesor_ids
            FROM asignaciones a
            LEFT JOIN materias m ON a.materia_id = m.id
            LEFT JOIN cursos c ON a.curso_id = c.id
            LEFT JOIN asignaciones_profesores ap ON a.id = ap.asignacion_id
            WHERE a.deleted_at IS NULL
            GROUP BY a.id, a.turno, a.dia, a.hora_inicio, a.hora_fin, m.nombre, c.anio, c.division
        `
        const result = await query(sql, []) as any[]

        const assignments = result.map(row => {
            const profesorIds = row.profesor_ids ? row.profesor_ids.split(',').map((id: string) => id.toString()) : []
            return mapRowToAssignment(row, profesorIds)
        })

        return { success: true, data: assignments }
    } catch (error: any) {
        console.error("Error fetching assignments:", error)
        return { success: false, error: error.message }
    }
}

export async function getAssignmentsByTeacherIdAction(teacherId: string): Promise<{ success: boolean; data?: Assignment[]; error?: string }> {
    try {
        const sql = `
            SELECT 
                a.id, 
                a.turno, 
                a.dia, 
                a.hora_inicio, 
                a.hora_fin,
                m.nombre as materia_nombre,
                c.anio as curso_anio,
                c.division as curso_division,
                GROUP_CONCAT(ap.profesor_id) as profesor_ids
            FROM asignaciones a
            LEFT JOIN materias m ON a.materia_id = m.id
            LEFT JOIN cursos c ON a.curso_id = c.id
            LEFT JOIN asignaciones_profesores ap ON a.id = ap.asignacion_id
            WHERE a.deleted_at IS NULL 
            AND a.id IN (
                SELECT asignacion_id 
                FROM asignaciones_profesores 
                WHERE profesor_id = ?
            )
            GROUP BY a.id, a.turno, a.dia, a.hora_inicio, a.hora_fin, m.nombre, c.anio, c.division
        `
        const result = await query(sql, [teacherId]) as any[]

        const assignments = result.map(row => {
            const profesorIds = row.profesor_ids ? row.profesor_ids.split(',').map((id: string) => id.toString()) : []
            return mapRowToAssignment(row, profesorIds)
        })

        return { success: true, data: assignments }
    } catch (error: any) {
        console.error("Error fetching assignments for teacher:", error)
        return { success: false, error: error.message }
    }
}

export async function createAssignmentAction(assignment: Omit<Assignment, 'id'>): Promise<{ success: boolean; data?: Assignment; error?: string }> {
    try {
        // 1. Get materia_id from materia name
        const materiaResult = await query(
            `SELECT id FROM materias WHERE nombre = ? LIMIT 1`,
            [assignment.materia]
        ) as any[]

        if (materiaResult.length === 0) {
            return { success: false, error: "Materia no encontrada" }
        }
        const materiaId = materiaResult[0].id

        // 2. Get curso_id from anio and division
        const cursoResult = await query(
            `SELECT id FROM cursos WHERE anio = ? AND division = ? LIMIT 1`,
            [assignment.curso, assignment.division]
        ) as any[]

        if (cursoResult.length === 0) {
            return { success: false, error: "Curso no encontrado" }
        }
        const cursoId = cursoResult[0].id

        // 3. Create the assignment
        const assignmentSql = `
            INSERT INTO asignaciones (
                curso_id, materia_id, turno, dia, hora_inicio, hora_fin, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `
        const assignmentResult: any = await query(assignmentSql, [
            cursoId,
            materiaId,
            assignment.turno,
            assignment.dia,
            assignment.hora_inicio,
            assignment.hora_fin
        ])

        const newAssignmentId = assignmentResult.insertId

        // 4. Create entries in asignaciones_profesores for each profesor
        if (assignment.profesor_ids && assignment.profesor_ids.length > 0) {
            for (const profesorId of assignment.profesor_ids) {
                await query(
                    `INSERT INTO asignaciones_profesores (asignacion_id, profesor_id) VALUES (?, ?)`,
                    [newAssignmentId, profesorId]
                )
            }
        }

        revalidatePath('/dashboard/horarios')
        return { success: true, data: { ...assignment, id: newAssignmentId.toString() } }
    } catch (error: any) {
        console.error("Error creating assignment:", error)
        return { success: false, error: error.message }
    }
}

export async function updateAssignmentAction(assignment: Assignment): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Get materia_id
        const materiaResult = await query(
            `SELECT id FROM materias WHERE nombre = ? LIMIT 1`,
            [assignment.materia]
        ) as any[]

        if (materiaResult.length === 0) {
            return { success: false, error: "Materia no encontrada" }
        }
        const materiaId = materiaResult[0].id

        // 2. Get curso_id
        const cursoResult = await query(
            `SELECT id FROM cursos WHERE anio = ? AND division = ? LIMIT 1`,
            [assignment.curso, assignment.division]
        ) as any[]

        if (cursoResult.length === 0) {
            return { success: false, error: "Curso no encontrado" }
        }
        const cursoId = cursoResult[0].id

        // 3. Update the assignment
        const updateSql = `
            UPDATE asignaciones 
            SET curso_id = ?, materia_id = ?, turno = ?, dia = ?, 
                hora_inicio = ?, hora_fin = ?, updated_at = NOW()
            WHERE id = ?
        `
        await query(updateSql, [
            cursoId,
            materiaId,
            assignment.turno,
            assignment.dia,
            assignment.hora_inicio,
            assignment.hora_fin,
            assignment.id
        ])

        // 4. Delete existing profesor assignments
        await query(`DELETE FROM asignaciones_profesores WHERE asignacion_id = ?`, [assignment.id])

        // 5. Re-create profesor assignments
        if (assignment.profesor_ids && assignment.profesor_ids.length > 0) {
            for (const profesorId of assignment.profesor_ids) {
                await query(
                    `INSERT INTO asignaciones_profesores (asignacion_id, profesor_id) VALUES (?, ?)`,
                    [assignment.id, profesorId]
                )
            }
        }

        revalidatePath('/dashboard/horarios')
        return { success: true }
    } catch (error: any) {
        console.error("Error updating assignment:", error)
        return { success: false, error: error.message }
    }
}

export async function deleteAssignmentAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Soft delete in asignaciones (the FK constraint should handle asignaciones_profesores)
        const sql = `UPDATE asignaciones SET deleted_at = NOW() WHERE id = ?`
        await query(sql, [id])

        // Also delete from pivot table
        await query(`DELETE FROM asignaciones_profesores WHERE asignacion_id = ?`, [id])

        revalidatePath('/dashboard/horarios')
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting assignment:", error)
        return { success: false, error: error.message }
    }
}
