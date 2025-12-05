import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import cookieParser from 'cookie-parser';
import alumnosRouter from './routes/alumnos.js';
import { testConnection, sequelize } from './db/index.js';
// Importar modelos para inicializar relaciones
import { User, Curso, Lista } from './db/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Servir archivos estáticos desde la carpeta public
// IMPORTANTE: Debe ir ANTES de las rutas para que los archivos estáticos se sirvan correctamente
app.use(express.static(path.join(__dirname, 'public'), {
  index: false // No servir index.html automáticamente, lo manejamos manualmente
}));

// Middleware de logging para debugging - FORZAR SALIDA INMEDIATA
app.use((req, res, next) => {
  const logMsg = `[Módulo Alumnos] ${req.method} ${req.path}`;
  console.log(logMsg);
  console.error(logMsg); // También a stderr para asegurar visibilidad
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[Módulo Alumnos] Body:`, JSON.stringify(req.body));
    console.error(`[Módulo Alumnos] Body:`, JSON.stringify(req.body));
  }
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    console.log(`[Módulo Alumnos] Cookies:`, Object.keys(req.cookies));
    console.error(`[Módulo Alumnos] Cookies:`, Object.keys(req.cookies));
  }
  // Forzar flush
  if (process.stdout.write) process.stdout.write('');
  if (process.stderr.write) process.stderr.write('');
  next();
});

// Health check
app.get('/health', (_req, res) => {
  console.log('[Módulo Alumnos] Health check');
  console.error('[Módulo Alumnos] Health check');
  res.status(200).json({ ok: true, service: 'modulo-alumnos', timestamp: Date.now() });
});

// Endpoint de debug
app.get('/debug', async (req, res) => {
  try {
    const { User, Curso, Lista } = await import('./db/models/index.js');
    const totalAlumnos = await User.count({ where: { rol: 'alumno' } });
    const totalCursos = await Curso.count();
    const totalListas = await Lista.count();
    
    // Verificar conexión a la base de datos
    const dbTest = await sequelize.query('SELECT 1 as test');
    
    res.json({
      ok: true,
      debug: {
        totalAlumnos,
        totalCursos,
        totalListas,
        dbConnection: dbTest ? 'OK' : 'FAIL',
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Endpoint de prueba para verificar escritura en BD
app.post('/test-write', async (req, res) => {
  try {
    console.log('[Test Write] Iniciando prueba de escritura...');
    const transaction = await sequelize.transaction();
    
    try {
      // Intentar crear un registro de prueba en una tabla temporal
      const testResult = await sequelize.query(
        'SELECT COUNT(*) as count FROM usuarios WHERE rol = "alumno"',
        { transaction, type: sequelize.QueryTypes.SELECT }
      );
      
      await transaction.commit();
      
      console.log('[Test Write] Prueba exitosa:', testResult);
      res.json({
        ok: true,
        message: 'Prueba de escritura exitosa',
        result: testResult
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('[Test Write] Error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Rutas API primero
app.use('/api/alumnos', alumnosRouter);

// Ruta raíz - Redirigir a la página HTML o mostrar info JSON si es API
app.get('/', (req, res) => {
  // Si es una petición de API (Accept: application/json), devolver JSON
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({
      ok: true,
      service: 'Módulo de Alumnos',
      version: '1.0.0',
      endpoints: {
        alumnos: 'api/alumnos', // Sin barra inicial para rutas relativas
        health: 'health'
      },
      description: 'Módulo para la gestión de alumnos. Los alumnos se almacenan en la tabla usuarios con rol "alumno".'
    });
  }
  // Si no, servir el HTML
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en módulo alumnos:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Inicializar base de datos y servidor
async function start() {
  try {
    // Probar conexión a la base de datos
    await testConnection();
    
    // Sincronizar tablas (solo las tablas específicas del módulo: cursos y listas)
    // La tabla usuarios ya existe en el servidor principal, no la tocamos
    console.log('[Módulo Alumnos] Sincronizando tablas...');
    
    // Verificar que la tabla usuarios existe (no la sincronizamos porque es del servidor principal)
    try {
      await sequelize.query('SELECT 1 FROM usuarios LIMIT 1');
      console.log('[Módulo Alumnos] ✅ Tabla usuarios existe');
    } catch (err) {
      console.error('[Módulo Alumnos] ⚠️ Advertencia: La tabla usuarios no existe. El módulo necesita que el servidor principal haya creado esta tabla.');
      throw new Error('La tabla usuarios no existe. Debe ejecutarse primero el servidor principal para crear las tablas base.');
    }
    
    // Sincronizar Curso y Lista (las tablas específicas del módulo)
    // Usar { alter: true } para modificar tablas existentes sin borrar datos
    try {
      await Curso.sync({ alter: true });
      console.log('[Módulo Alumnos] ✅ Tabla cursos sincronizada');
    } catch (err) {
      console.error('[Módulo Alumnos] ⚠️ Error al sincronizar cursos:', err.message);
      // Continuar de todos modos
    }
    
    try {
      await Lista.sync({ alter: true });
      console.log('[Módulo Alumnos] ✅ Tabla listas sincronizada');
    } catch (err) {
      console.error('[Módulo Alumnos] ⚠️ Error al sincronizar listas:', err.message);
      // Continuar de todos modos
    }
    
    console.log('[Módulo Alumnos] ✅ Base de datos lista');
  } catch (err) {
    console.error('[Módulo Alumnos] ❌ Error al inicializar base de datos:', err);
    // Continuar de todos modos para que el servidor arranque
  }
  
  // Iniciar servidor y esperar a que esté completamente listo
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, async () => {
      console.log(`[Módulo Alumnos] Servidor corriendo en puerto ${PORT}`);
      
      // Esperar un momento para que el servidor esté completamente listo
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verificar que el servidor realmente está respondiendo
      try {
        const checkReady = () => {
          return new Promise((resolveCheck, rejectCheck) => {
            const req = http.request({
              hostname: 'localhost',
              port: PORT,
              path: '/health',
              method: 'GET',
              timeout: 2000
            }, (res) => {
              if (res.statusCode === 200) {
                resolveCheck(true);
              } else {
                rejectCheck(new Error(`Health check returned ${res.statusCode}`));
              }
            });
            
            req.on('error', rejectCheck);
            req.on('timeout', () => {
              req.destroy();
              rejectCheck(new Error('Health check timeout'));
            });
            
            req.end();
          });
        };
        
        // Intentar verificar hasta 5 veces con retry
        let attempts = 0;
        const maxAttempts = 5;
        while (attempts < maxAttempts) {
          try {
            await checkReady();
            console.log('[Módulo Alumnos] ✅ Servidor verificado y listo para recibir peticiones');
            resolve(server);
            return;
          } catch (err) {
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(r => setTimeout(r, 300));
            } else {
              // Si falla la verificación, igual resolvemos para que el servidor continúe
              console.warn('[Módulo Alumnos] ⚠️ No se pudo verificar el servidor, pero continuando...');
              resolve(server);
            }
          }
        }
      } catch (err) {
        console.warn('[Módulo Alumnos] ⚠️ Error al verificar servidor:', err.message);
        // Resolver de todos modos para que el servidor continúe
        resolve(server);
      }
    });
    
    server.on('error', (err) => {
      console.error('[Módulo Alumnos] ❌ Error al iniciar servidor:', err);
      reject(err);
    });
  });
}

start().catch(err => {
  console.error('[Módulo Alumnos] Error al iniciar:', err);
  process.exit(1);
});

