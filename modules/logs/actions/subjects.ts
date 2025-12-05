'use server'

import { query } from "@/db/database"

export interface Subject {
    id: string
    nombre: string
}

export async function getSubjectsAction(): Promise<{ success: boolean; data?: Subject[]; error?: string }> {
    try {
        const sql = `SELECT id, nombre FROM materias ORDER BY nombre ASC`
        const result = await query(sql, []) as any[]

        const subjects = result.map(row => ({
            id: row.id.toString(),
            nombre: row.nombre
        }))

        return { success: true, data: subjects }
    } catch (error: any) {
        console.error("Error fetching subjects:", error)
        return { success: false, error: error.message }
    }
}
