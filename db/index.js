import 'dotenv/config';
import { Sequelize } from 'sequelize';

const {
    DB_HOST = 'localhost',
    DB_PORT = '3306',
    DB_NAME = 'app_db',
    DB_USER = 'root',
    DB_PASS = '',
    DB_LOGGING = 'false',
    DB_DIALECT = 'mysql',
    DB_TIMEZONE = 'America/Argentina/Buenos_Aires',
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: DB_DIALECT, // 'mysql'
    logging: DB_LOGGING === 'true' ? console.log : false,
    timezone: '+00:00', // guarda en UTC; maneja TZ en tu app
    dialectOptions: {
        // Para MySQL 8 (caching_sha2_plugin) mysql2 ya soporta; no suele hacer falta tocar esto.
        // dateStrings evita problemas de TZ; opcional:
        dateStrings: true,
        // Opcional si tu MySQL requiere SSL local (normalmente no):
        // ssl: { rejectUnauthorized: false }
    },
    define: {
        underscored: true,
        paranoid: true,        // soft deletes con deleted_at
        freezeTableName: false, // usa pluralization por defecto
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
        console.log('✅ Conexión a MySQL OK');
    } catch (err) {
        console.error('❌ Error al conectar a MySQL:', err.message);
        throw err;
    }
}
