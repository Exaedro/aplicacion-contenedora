import mysql, { QueryResult } from 'mysql2/promise'

const CONFIGURATION = {
    user: "root",
    database: "contenedor",
    password: "",
    host: "localhost"
}

export async function query(sql: string, values: any[]): Promise<QueryResult> {
    try {
        const connection = await mysql.createConnection(CONFIGURATION)

        const [data] = await connection.query(sql, values)
        await connection.end()

        return data
    } catch(err: any) {
        console.error(err)
        throw new Error('No se pudo conectar con la base de datos.')
    }
}

export async function testConnection(): Promise<Error | boolean> {
    try {
        const connection = await mysql.createConnection(CONFIGURATION)
        await connection.query('SELECT 1')
        await connection.end()
        return true
    } catch(err: any) {
        throw new Error(err.message)
    }
}