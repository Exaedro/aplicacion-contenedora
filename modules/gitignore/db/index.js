import 'dotenv/config';
import { Sequelize } from 'sequelize';

const {
    DB_HOST = 'localhost',
    DB_PORT = '3306',
    DB_NAME = 'app_db', // Usar la misma base de datos que el servidor principal
    DB_USER = 'root',
    DB_PASS = '',
    DB_LOGGING = 'false',
    DB_DIALECT = 'mysql',
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: DB_DIALECT,
    logging: (msg) => {
        // Log todas las queries SQL para debugging - FORZAR SALIDA
        if (msg && typeof msg === 'string') {
            if (msg.includes('INSERT') || msg.includes('UPDATE') || msg.includes('DELETE') || msg.includes('SELECT') || msg.includes('COMMIT') || msg.includes('BEGIN')) {
                console.log('[Sequelize SQL]', msg);
                console.error('[Sequelize SQL]', msg); // También a stderr
            }
        }
    },
    timezone: '+00:00',
    dialectOptions: {
        dateStrings: true,
    },
    define: {
        underscored: true,
        paranoid: true,
        freezeTableName: false,
        timestamps: true,
    },
    pool: {
        max: 10,
        min: 0,
        idle: 10000,
        acquire: 30000,
    },
});

export async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('[Módulo Alumnos] ✅ Conexión a MySQL OK');
        return true;
    } catch (err) {
        console.error('[Módulo Alumnos] ❌ Error al conectar a MySQL:', err.message);
        return false;
    }
}


