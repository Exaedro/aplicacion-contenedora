import { Router } from 'express';
import { User, Curso, Lista } from '../db/models/index.js';
import { authRequired } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/auth.js';
import { encryptPassword } from '../utils/encrypt.js';
import { Op } from 'sequelize';
import { sequelize } from '../db/index.js';

const router = Router();

/**
 * GET /api/alumnos
 * Obtiene todos los alumnos (usuarios con rol 'alumno')
 * Requiere autenticación
 */
router.get('/', authRequired, async (req, res) => {
  try {
    const alumnos = await User.findAll({
      where: { rol: 'alumno' },
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']],
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: Curso,
        as: 'cursos',
        through: { attributes: [] }, // No incluir datos de la tabla intermedia
        attributes: ['id', 'anio', 'division']
      }]
    });
    
    // Formatear cursos para cada alumno
    const alumnosFormateados = alumnos.map(alumno => {
      const alumnoData = alumno.toJSON();
      alumnoData.cursos = alumnoData.cursos.map(curso => ({
        id: curso.id,
        nombre: `${curso.anio}°${curso.division}`
      }));
      return alumnoData;
    });
    
    res.json({ ok: true, alumnos: alumnosFormateados });
  } catch (err) {
    console.error('Error al obtener alumnos:', err);
    res.status(500).json({ error: 'Error al obtener los alumnos' });
  }
});

/**
 * GET /api/alumnos/cursos/disponibles
 * Obtiene todos los cursos disponibles
 * Requiere autenticación
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar conflictos
 */
router.get('/cursos/disponibles', authRequired, async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      order: [['anio', 'ASC'], ['division', 'ASC']],
      attributes: ['id', 'anio', 'division']
    });

    const cursosFormateados = cursos.map(curso => ({
      id: curso.id,
      nombre: `${curso.anio}°${curso.division}`,
      anio: curso.anio,
      division: curso.division
    }));

    res.json({ ok: true, cursos: cursosFormateados });
  } catch (err) {
    console.error('Error al obtener cursos:', err);
    res.status(500).json({ error: 'Error al obtener los cursos' });
  }
});

/**
 * GET /api/alumnos/me
 * Devuelve información mínima del usuario autenticado (útil para la UI del módulo)
 */
router.get('/me', authRequired, (req, res) => {
  try {
    const u = req.user || {};
    // Normalizar role para los clientes
    const role = u.role || u.rol || null;
    res.json({ ok: true, user: { uid: u.uid, email: u.email, role } });
  } catch (err) {
    console.error('Error en /me', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * GET /api/alumnos/:id
 * Obtiene un alumno por ID
 * Requiere autenticación
 */
router.get('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const alumno = await User.findOne({
      where: { id, rol: 'alumno' },
      attributes: { exclude: ['password_hash'] }
    });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.json({ ok: true, alumno });
  } catch (err) {
    console.error('Error al obtener alumno:', err);
    res.status(500).json({ error: 'Error al obtener el alumno' });
  }
});

/**
 * POST /api/alumnos
 * Crea un nuevo alumno
 * Requiere autenticación y rol admin o preceptor
 */
router.post('/', authRequired, requireRole('admin', 'preceptor'), async (req, res) => {
  try {
    const logStart = '[Crear Alumno] ===== INICIO =====';
    console.log(logStart);
    console.error(logStart); // Forzar a stderr también
    
    const logUser = `[Crear Alumno] Usuario: ${req.user?.email} UID: ${req.user?.uid} Rol(payload): ${req.user?.role} Rol(DB): ${req.user?.rol}`;
    console.log(logUser);
    console.error(logUser);
    
    const logData = `[Crear Alumno] Datos: ${JSON.stringify({ 
      nombres: req.body.nombres, 
      apellidos: req.body.apellidos, 
      email: req.body.email,
      tieneContrasena: !!req.body.contrasena,
      curso_ids: req.body.curso_ids 
    })}`;
    console.log(logData);
    console.error(logData);
    
    const { nombres, apellidos, email, contrasena, curso_ids } = req.body;

    // Validaciones
    if (!nombres || !apellidos || !email || !contrasena) {
      return res.status(400).json({ error: 'Faltan campos requeridos: nombres, apellidos, email, contrasena' });
    }

    if (nombres.trim().length < 2 || nombres.trim().length > 80) {
      return res.status(400).json({ error: 'El nombre debe tener entre 2 y 80 caracteres' });
    }

    if (apellidos.trim().length < 2 || apellidos.trim().length > 80) {
      return res.status(400).json({ error: 'El apellido debe tener entre 2 y 80 caracteres' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Validación de contraseña igual que el módulo principal
    if (typeof contrasena !== 'string' || contrasena.length < 6) {
      return res.status(400).json({ error: 'La contraseña es demasiado corta.' });
    }

    // Validar que curso_ids sea obligatorio y tenga exactamente un curso
    if (!Array.isArray(curso_ids) || curso_ids.length === 0) {
      return res.status(400).json({ error: 'Debe asignar al menos un curso al alumno' });
    }

    if (curso_ids.length > 1) {
      return res.status(400).json({ error: 'Un alumno no puede tener más de un curso asignado' });
    }

    // Verificar si el email ya existe
    const emailExistente = await User.findOne({
      where: { email: email.trim().toLowerCase() }
    });

    if (emailExistente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Crear el alumno usando transacción para asegurar que todo se guarde
    const password_hash = encryptPassword(contrasena);
    console.log('[Crear Alumno] Creando usuario en BD...');
    
    // Usar transacción para asegurar atomicidad
    console.log('[Crear Alumno] Iniciando transacción...');
    const transaction = await sequelize.transaction();
    console.log('[Crear Alumno] Transacción iniciada');
    
    let alumno;
    try {
      console.log('[Crear Alumno] Intentando crear usuario en BD con datos:', {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim().toLowerCase(),
        rol: 'alumno',
        tienePassword: !!password_hash
      });
      
      alumno = await User.create({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim().toLowerCase(),
        password_hash,
        rol: 'alumno'
      }, { transaction });
      
      console.log('[Crear Alumno] Usuario creado en memoria, ID:', alumno.id);
      
      const logCreated = `[Crear Alumno] Usuario creado con ID: ${alumno.id}`;
      console.log(logCreated);
      console.error(logCreated);
      
      const logData = `[Crear Alumno] Datos: ${JSON.stringify(alumno.toJSON())}`;
      console.log(logData);
      console.error(logData);
      
      // Asignar curso (obligatorio, solo uno)
      const curso_id = curso_ids[0];
      
      // Verificar que el curso exista
      const curso = await Curso.findByPk(curso_id, { transaction });
      
      if (!curso) {
        throw new Error(`El curso con ID ${curso_id} no existe`);
      }

      // Crear la asignación del curso al alumno
      await Lista.create({
        id_alumno: alumno.id,
        id_curso: curso_id
      }, { transaction });
      
      console.log(`[Crear Alumno] Curso ${curso_id} asignado correctamente al alumno ${alumno.id}`);
      
      // Confirmar la transacción
      await transaction.commit();
      const logCommit = '[Crear Alumno] ✅ Transacción CONFIRMADA';
      console.log(logCommit);
      console.error(logCommit);
      
      // Esperar un momento para asegurar que la transacción se complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar que realmente se guardó en la BD
      const verificado = await User.findByPk(alumno.id);
      if (!verificado) {
        throw new Error('El usuario no se guardó en la base de datos');
      }
      const logVerified = `[Crear Alumno] ✅ Usuario VERIFICADO en BD: ${JSON.stringify(verificado.toJSON())}`;
      console.log(logVerified);
      console.error(logVerified);
      
      // Verificar que la asignación del curso también se guardó
      const asignacionVerificada = await Lista.findOne({
        where: { 
          id_alumno: alumno.id,
          id_curso: curso_id
        }
      });
      
      if (!asignacionVerificada) {
        throw new Error('La asignación del curso no se guardó en la base de datos');
      }
      console.log(`[Crear Alumno] ✅ Asignación de curso VERIFICADA: ${JSON.stringify(asignacionVerificada.toJSON())}`);
      console.error(`[Crear Alumno] ✅ Asignación de curso VERIFICADA: ${JSON.stringify(asignacionVerificada.toJSON())}`);
    } catch (createErr) {
      // Revertir la transacción en caso de error
      await transaction.rollback();
      const logError = `[Crear Alumno] ❌ ERROR - Transacción REVERTIDA: ${createErr.message}`;
      console.error(logError);
      console.log(logError);
      const logDetails = `[Crear Alumno] Detalles: ${JSON.stringify({
        name: createErr.name,
        message: createErr.message,
        errors: createErr.errors
      })}`;
      console.error(logDetails);
      console.log(logDetails);
      throw createErr;
    }


    // Obtener el alumno con sus cursos
    const alumnoConCursos = await User.findOne({
      where: { id: alumno.id },
      include: [{
        model: Curso,
        as: 'cursos',
        through: { attributes: [] },
        attributes: ['id', 'anio', 'division']
      }]
    });

    // Retornar sin password_hash
    const alumnoResponse = alumnoConCursos.toJSON();
    delete alumnoResponse.password_hash;
    alumnoResponse.cursos = alumnoResponse.cursos.map(curso => ({
      id: curso.id,
      nombre: `${curso.anio}°${curso.division}`
    }));

    const logSuccess = '[Crear Alumno] ===== ÉXITO FINAL =====';
    console.log(logSuccess);
    console.error(logSuccess);
    res.status(201).json({ ok: true, alumno: alumnoResponse });
  } catch (err) {
    console.error('[Crear Alumno] ===== ERROR =====');
    console.error('[Crear Alumno] Error completo:', err);
    console.error('[Crear Alumno] Stack:', err.stack);
    if (err.name === 'SequelizeValidationError') {
      console.error('[Crear Alumno] Errores de validación:', err.errors);
      return res.status(400).json({ error: err.errors[0]?.message || 'Error de validación' });
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
      console.error('[Crear Alumno] Error de constraint único:', err.errors);
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al crear el alumno', details: err.message });
  }
});

/**
 * PUT /api/alumnos/:id
 * Actualiza un alumno existente
 * Requiere autenticación y rol admin o preceptor
 */
router.put('/:id', authRequired, requireRole('admin', 'preceptor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, email, contrasena } = req.body;

    const alumno = await User.findOne({
      where: { id, rol: 'alumno' }
    });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Validaciones
    if (nombres !== undefined) {
      if (nombres.trim().length < 2 || nombres.trim().length > 80) {
        return res.status(400).json({ error: 'El nombre debe tener entre 2 y 80 caracteres' });
      }
      alumno.nombres = nombres.trim();
    }

    if (apellidos !== undefined) {
      if (apellidos.trim().length < 2 || apellidos.trim().length > 80) {
        return res.status(400).json({ error: 'El apellido debe tener entre 2 y 80 caracteres' });
      }
      alumno.apellidos = apellidos.trim();
    }

    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      // Verificar si el email ya existe en otro usuario
      const emailExistente = await User.findOne({
        where: { 
          email: email.trim().toLowerCase(),
          id: { [Op.ne]: id }
        }
      });

      if (emailExistente) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      alumno.email = email.trim().toLowerCase();
    }

    if (contrasena !== undefined) {
      if (contrasena.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }
      alumno.password_hash = encryptPassword(contrasena);
    }

    await alumno.save();

    // Retornar sin password_hash
    const alumnoResponse = alumno.toJSON();
    delete alumnoResponse.password_hash;

    res.json({ ok: true, alumno: alumnoResponse });
  } catch (err) {
    console.error('Error al actualizar alumno:', err);
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Error de validación' });
    }
    res.status(500).json({ error: 'Error al actualizar el alumno' });
  }
});

/**
 * DELETE /api/alumnos/:id
 * Elimina (soft delete) un alumno
 * Requiere autenticación y rol admin o preceptor
 */
router.delete('/:id', authRequired, requireRole('admin', 'preceptor'), async (req, res) => {
  try {
    const { id } = req.params;

    const alumno = await User.findOne({
      where: { id, rol: 'alumno' }
    });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Soft delete usando el método de Sequelize
    await alumno.destroy();

    res.json({ ok: true, message: 'Alumno eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar alumno:', err);
    res.status(500).json({ error: 'Error al eliminar el alumno' });
  }
});

/**
 * GET /api/alumnos/:id/cursos
 * Obtiene los cursos asignados a un alumno
 * Requiere autenticación
 */
router.get('/:id/cursos', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const alumno = await User.findOne({
      where: { id, rol: 'alumno' },
      include: [{
        model: Curso,
        as: 'cursos',
        through: { attributes: [] },
        attributes: ['id', 'anio', 'division']
      }]
    });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    const cursos = alumno.cursos.map(curso => ({
      id: curso.id,
      nombre: `${curso.anio}°${curso.division}`,
      anio: curso.anio,
      division: curso.division
    }));

    res.json({ ok: true, cursos });
  } catch (err) {
    console.error('Error al obtener cursos del alumno:', err);
    res.status(500).json({ error: 'Error al obtener los cursos' });
  }
});

/**
 * POST /api/alumnos/:id/cursos
 * Asigna cursos a un alumno
 * Requiere autenticación y rol admin o preceptor
 */
router.post('/:id/cursos', authRequired, requireRole('admin', 'preceptor'), async (req, res) => {
  try {
    console.log('[Asignar Cursos] ===== INICIO =====');
    console.log('[Asignar Cursos] Usuario que hace la petición:', req.user?.email, 'UID:', req.user?.uid, 'Rol(payload):', req.user?.role, 'Rol(DB):', req.user?.rol);
    const { id } = req.params;
    const { curso_ids } = req.body; // Array de IDs de cursos

    console.log(`[Asignar Cursos] Alumno ID: ${id}, Cursos recibidos:`, curso_ids);

    if (!Array.isArray(curso_ids)) {
      console.error('[Asignar Cursos] curso_ids no es un array:', typeof curso_ids);
      return res.status(400).json({ error: 'curso_ids debe ser un array' });
    }

    // Validar que solo se asigne un curso
    if (curso_ids.length === 0) {
      return res.status(400).json({ error: 'Debe asignar al menos un curso al alumno' });
    }

    if (curso_ids.length > 1) {
      return res.status(400).json({ error: 'Un alumno no puede tener más de un curso asignado' });
    }

    const alumno = await User.findOne({
      where: { id, rol: 'alumno' }
    });

    if (!alumno) {
      console.error(`[Asignar Cursos] Alumno ${id} no encontrado`);
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    console.log(`[Asignar Cursos] Alumno encontrado: ${alumno.nombres} ${alumno.apellidos}`);

    // Obtener el único curso
    const curso_id = curso_ids[0];
    
    // Verificar que el curso exista
    const curso = await Curso.findByPk(curso_id);

    if (!curso) {
      console.error(`[Asignar Cursos] Curso ${curso_id} no encontrado`);
      return res.status(400).json({ 
        error: `El curso con ID ${curso_id} no existe`
      });
    }

    console.log(`[Asignar Cursos] Curso encontrado: ${curso.anio}°${curso.division}`);

    // Usar transacción para asegurar atomicidad
    const transaction = await sequelize.transaction();
    
    try {
      // Eliminar asignaciones existentes
      const deleted = await Lista.destroy({
        where: { id_alumno: id },
        transaction
      });
      console.log(`[Asignar Cursos] Eliminadas ${deleted} asignaciones anteriores`);

      // Crear nueva asignación (solo un curso)
      const nuevaAsignacion = await Lista.create({
        id_alumno: parseInt(id),
        id_curso: parseInt(curso_id)
      }, { transaction });

      console.log('[Asignar Cursos] Asignación creada:', nuevaAsignacion.toJSON());
      
      // Confirmar la transacción
      await transaction.commit();
      console.log('[Asignar Cursos] Transacción confirmada');
      
      // Esperar un momento para asegurar que la transacción se complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar que realmente se guardó
      const verificada = await Lista.findOne({
        where: { 
          id_alumno: id,
          id_curso: curso_id
        }
      });
      
      if (!verificada) {
        throw new Error('La asignación no se guardó en la base de datos');
      }
      
      console.log(`[Asignar Cursos] Asignación verificada en BD:`, verificada.toJSON());
      console.error(`[Asignar Cursos] Asignación verificada en BD:`, verificada.toJSON());
    } catch (createErr) {
      // Revertir la transacción en caso de error
      await transaction.rollback();
      console.error('[Asignar Cursos] Error al crear asignación, transacción revertida:', createErr);
      console.error('[Asignar Cursos] Detalles del error:', {
        name: createErr.name,
        message: createErr.message,
        errors: createErr.errors
      });
      throw createErr;
    }

    // Obtener el curso asignado
    const cursoAsignado = await Curso.findByPk(curso_id, {
      attributes: ['id', 'anio', 'division']
    });

    const cursoFormateado = {
      id: cursoAsignado.id,
      nombre: `${cursoAsignado.anio}°${cursoAsignado.division}`,
      anio: cursoAsignado.anio,
      division: cursoAsignado.division
    };
    
    const cursosFormateados = [cursoFormateado];

    console.log(`[Asignar Cursos] Éxito. Cursos asignados:`, cursosFormateados);
    console.log('[Asignar Cursos] ===== ÉXITO =====');
    res.json({ ok: true, cursos: cursosFormateados });
  } catch (err) {
    console.error('[Asignar Cursos] ===== ERROR =====');
    console.error('[Asignar Cursos] Error completo:', err);
    console.error('[Asignar Cursos] Stack:', err.stack);
    res.status(500).json({ 
      error: 'Error al asignar cursos', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/**
 * GET /api/alumnos/cursos/:cursoId
 * Obtiene todos los alumnos de un curso específico
 * Requiere autenticación
 */
router.get('/cursos/:cursoId', authRequired, async (req, res) => {
  try {
    const { cursoId } = req.params;
    
    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const alumnos = await User.findAll({
      where: { rol: 'alumno' },
      include: [{
        model: Curso,
        as: 'cursos',
        through: { attributes: [] },
        where: { id: cursoId },
        attributes: ['id', 'anio', 'division']
      }],
      attributes: { exclude: ['password_hash'] },
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']]
    });

    const alumnosFormateados = alumnos.map(alumno => {
      const alumnoData = alumno.toJSON();
      delete alumnoData.password_hash;
      return alumnoData;
    });

    res.json({ 
      ok: true, 
      curso: {
        id: curso.id,
        nombre: `${curso.anio}°${curso.division}`,
        anio: curso.anio,
        division: curso.division
      },
      alumnos: alumnosFormateados 
    });
  } catch (err) {
    console.error('Error al obtener alumnos del curso:', err);
    res.status(500).json({ error: 'Error al obtener los alumnos del curso', details: err.message });
  }
});

export default router;


