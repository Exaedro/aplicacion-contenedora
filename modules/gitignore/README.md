# Módulo de Alumnos

Módulo independiente para la gestión de alumnos que se integra con el contenedor principal.

## Estructura

```
modulo-alumnos/
├── manifest.json          # Configuración del módulo
├── package.json           # Dependencias Node.js
├── server.js              # Servidor Express del módulo
├── db/
│   ├── index.js          # Configuración de Sequelize
│   └── models/
│       └── User.js       # Modelo de Usuario
├── routes/
│   └── alumnos.js        # Rutas del API de alumnos
├── middlewares/
│   └── auth.js           # Middlewares de autenticación
└── utils/
    └── encrypt.js        # Utilidades de encriptación
```

## Instalación

1. Empaquetar el módulo en un archivo ZIP:
   ```bash
   # Desde la carpeta modulo-alumnos
   zip -r modulo-alumnos.zip .
   ```

2. Subir el ZIP al contenedor principal a través de la interfaz web o API.

## Configuración

El módulo utiliza las siguientes variables de entorno (heredadas del contenedor principal):

- `DB_HOST`: Host de MySQL (default: localhost)
- `DB_PORT`: Puerto de MySQL (default: 3306)
- `DB_NAME`: Nombre de la base de datos (default: modulo_gestion)
- `DB_USER`: Usuario de MySQL (default: root)
- `DB_PASS`: Contraseña de MySQL
- `JWT_SECRET`: Clave secreta para JWT (requerida para autenticación)
- `PORT`: Puerto asignado automáticamente por el contenedor

## Endpoints

Una vez instalado, el módulo estará disponible en: `/modulos/modulo-alumnos/api/alumnos`

- `GET /api/alumnos` - Listar todos los alumnos (requiere autenticación)
- `GET /api/alumnos/:id` - Obtener un alumno por ID (requiere autenticación)
- `POST /api/alumnos` - Crear un nuevo alumno (requiere admin o preceptor)
- `PUT /api/alumnos/:id` - Actualizar un alumno (requiere admin o preceptor)
- `DELETE /api/alumnos/:id` - Eliminar un alumno (requiere admin o preceptor)

## Base de Datos

El módulo se conecta a la tabla `usuarios` de la base de datos `modulo_gestion` y filtra por `rol = 'alumno'`.

## Requisitos en el contenedor principal

Para que los permisos funcionen correctamente (por ejemplo, que los roles `admin` o `preceptor` puedan crear/alocar alumnos):

El módulo obtiene el role real del usuario de dos formas:

- Si el JWT trae la propiedad `role` en el payload, el middleware la utilizará.
- Si el JWT no trae el role, el middleware del módulo buscará al usuario por `uid` en la tabla `usuarios` y usará el campo `rol` de la BD (esto evita depender de cambios en el servidor principal).

El frontend del módulo consulta `GET /api/alumnos/me` del propio módulo para saber el role del usuario conectado (cookie HTTP-only). Esto permite que el módulo trabaje de forma autónoma sin exigir modificaciones en la aplicación contenedora.

Comprueba que el servidor principal esté corriendo y que exista al menos un usuario con `rol = 'admin'` o `rol = 'preceptor'` antes de probar las rutas que requieren permisos.


