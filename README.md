# Sector-7 — Sistema de Gestión de Asistencia de Profesores

Sistema web para gestionar la asistencia de profesores: registro de horarios, control de asistencia diaria, generación de reportes y exportación a Excel.

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express (ES Modules) |
| Frontend | React 19 + TypeScript + Vite |
| Base de datos | MySQL |
| ORM | Sequelize 6 + mysql2/promise |
| Autenticación | JWT + bcryptjs |

## Estructura del proyecto

```
sector-7/
├── backend/
│   ├── server.js          # Servidor unificado (puerto 3044)
│   ├── load-env.js        # Carga .env raíz
│   ├── db.js              # Pool de conexiones MySQL (mysql2/promise)
│   ├── routes/            # Todas las rutas (API 1, 2, 3 y reportes)
│   ├── controllers/       # Controladores (auth, users, horarios)
│   ├── services/          # Lógica de reportes y generación de Excel
│   ├── models/            # Modelos (Sequelize + User)
│   ├── middleware/        # Auth JWT y autorización por roles
│   └── utils/             # Utilidades JWT
├── frontend/
│   ├── components/        # Componentes React
│   ├── src/               # Código fuente (App, config, main)
│   ├── css/               # Estilos
│   ├── img/               # Imágenes estáticas
│   ├── dist/              # Build de producción
│   ├── index.html
│   └── package.json
└── .env                   # Variables de entorno raíz
```

## Requisitos

- Node.js 18+
- npm
- MySQL 8+ (local o remoto)

## Configuración

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd sector-7
```

### 2. Variables de entorno

Crear archivo `.env` en la raíz del proyecto (`sector-7/.env`):

```env
PORT=3044
JWT_SECRET=tu_secreto_jwt_aqui
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sector7
DB_DIALECT=mysql
```

Crear archivo `frontend/.env`:

```env
VITE_API_URL=http://localhost:3044
```

### 3. Base de datos

Ejecutar el script SQL para crear las tablas necesarias. Las tablas principales son:

- `profesor` — id, nombre, horas_segun_contrato, estado, id_institucional
- `asistencia` — id (UUID), id_profesor, fecha, horas, tardanza, justificacion, estado
- `horario` — id (formato HR...), id_profesor, hora_entrada, hora_salida, dia_semana, aula, estado
- `feriados` — id, fecha, descripcion
- `usuarios` — id, username, password_hash (bcrypt), rol (admin|reportes|docente|usuario), activo

### 4. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Ejecución en local

### Backend (servidor unificado)

```bash
cd backend
npm run dev    # Con nodemon (recarga automática)
# o
npm start      # Sin nodemon
```

Esto levanta un solo servidor en el puerto **3044** que unifica:

| API | Rutas |
|-----|-------|
| API 1 | `/profesores`, `/asistencias`, `/horarios/profesor/:id`, `/feriados` |
| API 2 | `/api/horarios` |
| API 3 | `/api/auth/*`, `/api/users/*` |
| Reportes | `/reporte-asistencia`, `/reporte-asistencia/periodos`, `/reporte-asistencia/semanas`, `/reporte-asistencia/guardar`, `/generar-informe` |

### Frontend

```bash
cd frontend
npm run dev
```

Acceder a `http://localhost:5173`.

Para build de producción:

```bash
npm run build       # tsc -b && vite build
npm run preview     # Vista previa del build
```

## APIs

### Servidor unificado (`localhost:3044`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/reporte-asistencia` | Reporte de asistencia (modos: actual, historico, periodo, semana) |
| GET | `/reporte-asistencia/periodos` | Periodos quincenales (día 20 al 19) |
| GET | `/reporte-asistencia/semanas` | Semanas dentro de un periodo |
| POST | `/reporte-asistencia/guardar` | Guardar/actualizar asistencias |
| GET | `/generar-informe` | Datos para Excel en un rango de fechas |

### API 1 — Profesores y Asistencias

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/profesores` | Listar profesores |
| GET | `/profesores/buscar?q=` | Buscar profesor |
| GET | `/profesores/:id` | Obtener profesor |
| POST | `/profesores` | Crear profesor |
| PUT | `/profesores/:id` | Actualizar profesor |
| DELETE | `/profesores/:id` | Eliminar profesor |
| GET | `/asistencias` | Listar asistencias |
| POST | `/asistencias` | Registrar asistencia |
| GET | `/horarios/profesor/:id_profesor` | Horarios de un profesor |
| GET | `/feriados` | Listar feriados |
| POST | `/feriados` | Crear feriado |
| POST | `/horarios` | Crear horario |

### API 2 — Horarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/horarios` | Listar horarios activos (con detección de conflictos) |
| POST | `/api/horarios` | Agregar horario (valida conflictos de hora/aula) |
| DELETE | `/api/horarios/:id` | Eliminar horario |

### API 3 — Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión (body: {username, password}) |
| POST | `/api/auth/register` | Registrar usuario (body: {username, password, rol}) |
| GET | `/api/users` | Listar usuarios (JWT, roles: admin/reportes) |
| PUT | `/api/users/:id` | Actualizar usuario (JWT, admin) |
| PATCH | `/api/users/:id/toggle-status` | Activar/desactivar usuario (JWT, admin) |
| DELETE | `/api/users/:id` | Eliminar usuario (JWT, admin) |

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| `admin` | Acceso completo |
| `reportes` | Visualizar reportes y usuarios |
| `docente` | Acceso limitado a datos propios |
| `usuario` | Acceso básico |

## Despliegue

### Backend

```bash
cd backend
npm ci --production
node server.js
```

Se recomienda usar PM2 para gestión de procesos:

```bash
npm install -g pm2
pm2 start server.js --name sector7-backend
pm2 save
pm2 startup
```

### Frontend

```bash
cd frontend
npm ci && npm run build
```

El directorio `dist/` contiene los archivos estáticos. Servir con nginx, Apache o similar.

Ejemplo de configuración nginx:

```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        root /var/www/sector7/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3044/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Notas importantes

- Los periodos de asistencia van del día 20 de cada mes al 19 del siguiente
- Los IDs de horarios usan formato `HR` + timestamp + 3 caracteres aleatorios
- Los IDs de asistencia usan UUID v4
- El backend permite CORS desde `localhost:5173` y `localhost:5174` para desarrollo
- No hay migraciones automáticas: las tablas deben crearse manualmente en la base de datos
