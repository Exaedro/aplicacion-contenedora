'use server'

import { query } from "@/db/database"

export interface Course {
    id: string
    anio: string
    division: string
}

export async function getCoursesAction(): Promise<{ success: boolean; data?: Course[]; error?: string }> {
    try {
        const sql = `SELECT id, anio, division FROM cursos ORDER BY anio ASC, division ASC`
        const result = await query(sql, []) as any[]

        const courses = result.map(row => ({
            id: row.id.toString(),
            anio: row.anio,
            division: row.division
        }))

        return { success: true, data: courses }
    } catch (error: any) {
        console.error("Error fetching courses:", error)
        return { success: false, error: error.message }
    }
}
