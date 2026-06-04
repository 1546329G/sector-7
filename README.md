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
│   ├── server.js          # Orquestador: levanta los 4 servidores
│   ├── load-env.js        # Carga .env raíz
│   ├── db.js              # Pool de conexiones MySQL (mysql2/promise)
│   ├── models/            # Modelos Sequelize (Profesor, Asistencia, Horario)
│   ├── routes/            # Rutas del servidor principal (reportes, periodos, guardar)
│   ├── services/          # Lógica de reportes y generación de Excel
│   ├── api1/              # CRUD profesores, asistencias, horarios, feriados (puerto 5009)
│   ├── api2/              # Gestión de horarios con detección de conflictos (puerto 5011)
│   └── api3/              # Autenticación y gestión de usuarios (puerto 5010)
├── frontend/
│   └── registro-asistencia/  # SPA React + TypeScript + Vite
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
PORT_API1=5009
PORT_API2=5011
PORT_API3=5010
JWT_SECRET=tu_secreto_jwt_aqui
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sector7
DB_DIALECT=mysql
```

Crear archivo `frontend/registro-asistencia/.env`:

```env
VITE_API1_URL=http://localhost:5009
VITE_API2_URL=http://localhost:5011
VITE_API3_URL=http://localhost:5010
VITE_MAIN_URL=http://localhost:3000
```

> Los puertos de las `VITE_*` deben coincidir con los `PORT_API*` del `.env` raíz.

### 3. Base de datos

Ejecutar el script SQL para crear las tablas necesarias. Las tablas principales son:

- `profesores` — id, nombre, horas_segun_contrato, estado, id_institucional
- `asistencias` — id (UUID), id_profesor, fecha, horas, tardanza, justificacion, estado
- `horarios` — id (formato HR...), id_profesor, hora_entrada, hora_salida, dia_semana, estado
- `feriados` — id, fecha, descripcion
- `users` / `usuarios` — id, username, password (bcrypt), rol (admin|reportes|docente|usuario), activo

### 4. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend/registro-asistencia
npm install
```

## Ejecución en local

### Backend (4 servidores en paralelo)

```bash
cd backend
npm run dev    # Con nodemon (recarga automática)
# o
npm start      # Sin nodemon
```

Esto levanta:

| Servidor | Puerto | Propósito |
|----------|--------|-----------|
| Principal | 3000 | Reportes, periodos, guardar asistencia, Excel |
| API 1 | 5009 | CRUD profesores, asistencias, feriados |
| API 2 | 5011 | Gestión de horarios con conflictos |
| API 3 | 5010 | Autenticación JWT, usuarios |

### Frontend

```bash
cd frontend/registro-asistencia
npm run dev
```

Acceder a `http://localhost:5173`.

Para build de producción:

```bash
npm run build       # tsc -b && vite build
npm run preview     # Vista previa del build
```

## APIs

### Servidor principal (`localhost:3000`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/reporte-asistencia` | Reporte de asistencia (modos: actual, historico, periodo, semana) |
| GET | `/reporte-asistencia/periodos` | Periodos quincenales (día 20 al 19) |
| GET | `/reporte-asistencia/semanas` | Semanas dentro de un periodo |
| POST | `/reporte-asistencia/guardar` | Guardar/actualizar asistencias |
| GET | `/generar-informe` | Datos para Excel en un rango de fechas |

### API 1 — Profesores y Asistencias (`localhost:5009`)

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

### API 2 — Horarios (`localhost:5011`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/horarios` | Listar horarios activos (con detección de conflictos) |
| POST | `/api/horarios` | Agregar horario (valida conflictos de hora/aula) |
| DELETE | `/api/horarios/:id` | Eliminar horario |

### API 3 — Autenticación (`localhost:5010`)

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

### Opción 1: Servidor VPS/Cloud (producción)

#### Backend

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

#### Frontend

```bash
cd frontend/registro-asistencia
npm ci && npm run build
```

El directorio `dist/` contiene los archivos estáticos. Servir con nginx, Apache o similar.

Ejemplo de configuración nginx:

```nginx
server {
    listen 80;
    server_name tudominio.com;

    # Frontend
    location / {
        root /var/www/sector7/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy inverso para APIs
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> Nota: El frontend actual espera URLs completas hacia cada API (`localhost:5009`, etc.). Para producción, se debe actualizar `frontend/registro-asistencia/src/config.ts` apuntando a las URLs del servidor desplegado, o configurar un proxy inverso que unifique todo bajo un mismo dominio.

### Opción 2: Docker

El proyecto incluye un Dockerfile para API 3 en `backend/api3/Dockerfile` (Node 18 Alpine). Para construir y ejecutar:

```bash
cd backend/api3
docker build -t sector7-api3 .
docker run -p 5010:5009 \
  -e DB_HOST=host \
  -e DB_USER=user \
  -e DB_PASSWORD=pass \
  -e DB_NAME=sector7 \
  -e JWT_SECRET=secreto \
  sector7-api3
```

Se puede extender el mismo patrón para los demás servicios o crear un `docker-compose.yml` que orqueste backend + frontend + MySQL.

### Opción 3: Cloud Run (Google Cloud)

El Dockerfile de API 3 incluye comentarios para desplegar en Cloud Run con Cloud SQL. Los pasos generales:

1. Crear instancia MySQL en Cloud SQL
2. Construir y subir la imagen a Artifact Registry
3. Desplegar en Cloud Run vinculando la conexión de Cloud SQL
4. Configurar variables de entorno en Cloud Run

## Notas importantes

- Los periodos de asistencia van del día 20 de cada mes al 19 del siguiente
- Los IDs de horarios usan formato `HR` + timestamp + 3 caracteres aleatorios
- Los IDs de asistencia usan UUID v4
- El backend usa CORS abierto para desarrollo (`app.use(cors())`) en API 1, 2 y 3. El servidor principal solo permite `http://localhost:5173`
- No hay migraciones automáticas: las tablas deben crearse manualmente en la base de datos
