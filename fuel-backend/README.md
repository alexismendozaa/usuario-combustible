<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="80" alt="Nest Logo" />
</p>

<h1 align="center">🔧 SmartFuel API</h1>

<p align="center">
  Backend REST API para la aplicación SmartFuel
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white" alt="Stripe" />
</p>

---

## 📋 Descripción

API REST completa para la gestión integral de vehículos, combustible, mantenimiento y pagos. Construida con NestJS, PostgreSQL y Prisma ORM.

---

## ✨ Características

- 🔐 **Autenticación JWT** - Access + Refresh tokens con rotación segura
- 📧 **Verificación de Email** - Confirmación de cuenta por correo
- 🔑 **Recuperación de Contraseña** - Flujo completo con tokens seguros
- 🚗 **Gestión de Vehículos** - CRUD completo con capacidad de tanque
- ⛽ **Registro de Combustible** - Tracking con geolocalización y cálculo de rendimiento
- 🔧 **Mantenimientos** - Programación por km/tiempo con alertas
- 📊 **Reportes y Analytics** - Estadísticas de consumo y gastos
- 🗺️ **Rutas GPS** - Almacenamiento de trayectos con coordenadas
- 🏪 **Gasolineras Cercanas** - Búsqueda por ubicación (Overpass API)
- 💳 **Pagos con Stripe** - Checkout Sessions + Webhooks
- 🖼️ **Avatares** - Subida de imágenes (S3 compatible)
- 📝 **Documentación Swagger** - API docs interactiva

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **NestJS** | Framework backend |
| **TypeScript** | Lenguaje de programación |
| **PostgreSQL** | Base de datos |
| **Prisma** | ORM |
| **JWT** | Autenticación |
| **Nodemailer** | Envío de emails |
| **Stripe** | Procesamiento de pagos |
| **Swagger** | Documentación API |
| **class-validator** | Validación de DTOs |

---

## 📁 Estructura del Proyecto

```
fuel-backend/
├── src/
│   ├── auth/              # Autenticación y autorización
│   │   ├── dto/           # DTOs de auth
│   │   ├── mail/          # Templates de email
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── jwt-auth.guard.ts
│   ├── users/             # Gestión de usuarios
│   ├── vehicles/          # Gestión de vehículos
│   ├── refuels/           # Registro de cargas
│   ├── maintenance/       # Mantenimientos
│   ├── routes/            # Rutas GPS
│   ├── reports/           # Reportes y analytics
│   ├── stations/          # Gasolineras cercanas
│   ├── payments/          # Pagos con Stripe
│   └── common/            # Filtros y excepciones
├── prisma/
│   ├── schema.prisma      # Esquema de BD
│   └── migrations/        # Migraciones
├── test/                  # Tests e2e
└── docker-compose.yml     # Configuración Docker
```

---

## 🚀 Instalación

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### 1. Clonar e instalar dependencias
```bash
cd fuel-backend
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/smartfuel"

# JWT
JWT_SECRET="tu-secreto-super-seguro"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="otro-secreto-seguro"
JWT_REFRESH_EXPIRES_IN="7d"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"
EMAIL_FROM="SmartFuel <noreply@smartfuel.com>"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Frontend URL (para emails)
FRONTEND_URL="http://localhost:3000"

# S3 (opcional, para avatares)
S3_ENDPOINT="https://s3.amazonaws.com"
S3_BUCKET="smartfuel-avatars"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
```

### 3. Ejecutar migraciones
```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Iniciar servidor
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

---

## 📖 API Endpoints

### 🔐 Autenticación (`/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar usuario |
| POST | `/auth/login` | Iniciar sesión |
| GET | `/auth/me` | Obtener usuario actual |
| POST | `/auth/refresh` | Renovar access token |
| POST | `/auth/logout` | Cerrar sesión |
| POST | `/auth/verify-email` | Verificar email con token |
| POST | `/auth/forgot-password` | Solicitar reset de contraseña |
| POST | `/auth/reset-password` | Resetear contraseña |

### 👤 Usuarios (`/users`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users/me` | Obtener perfil |
| PATCH | `/users/me` | Actualizar perfil |
| POST | `/users/me/avatar` | Subir avatar |
| DELETE | `/users/me/avatar` | Eliminar avatar |
| DELETE | `/users/me` | Eliminar cuenta |

### 🚗 Vehículos (`/vehicles`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/vehicles` | Listar vehículos |
| POST | `/vehicles` | Crear vehículo |
| GET | `/vehicles/:id` | Obtener vehículo |
| PATCH | `/vehicles/:id` | Actualizar vehículo |
| DELETE | `/vehicles/:id` | Eliminar vehículo |

**Campos del vehículo:**
```json
{
  "name": "Mi Auto",
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "plate": "ABC-123",
  "fuelType": "gasoline",
  "odometerKm": 50000,
  "tankCapacity": 12.5
}
```

### ⛽ Recargas (`/refuels`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/refuels` | Listar recargas |
| POST | `/refuels` | Crear recarga |
| GET | `/refuels/:id` | Obtener recarga |
| PATCH | `/refuels/:id` | Actualizar recarga |
| DELETE | `/refuels/:id` | Eliminar recarga |
| GET | `/refuels/current-odometer/:vehicleId` | Obtener odómetro actual |

**Campos de la recarga:**
```json
{
  "vehicleId": "uuid",
  "odometerKm": 51000,
  "liters": 10.5,
  "totalCost": 28.50,
  "paymentMethod": "cash",
  "fullTank": true,
  "note": "Gasolinera del centro",
  "lat": -0.1234,
  "lng": -78.5678
}
```

**Validaciones:**
- El odómetro no puede ser menor al anterior
- Los galones no pueden exceder la capacidad del tanque

### 🔧 Mantenimiento (`/maintenance`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/maintenance/items` | Listar tareas |
| POST | `/maintenance/items` | Crear tarea |
| PATCH | `/maintenance/items/:id` | Actualizar tarea |
| DELETE | `/maintenance/items/:id` | Eliminar tarea |
| POST | `/maintenance/items/:id/complete` | Marcar como realizada |
| GET | `/maintenance/logs` | Historial de mantenimientos |

### 📊 Reportes (`/reports`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/reports/timeline/:vehicleId` | Timeline de recargas |
| GET | `/reports/summary/:vehicleId` | Resumen del vehículo |
| GET | `/reports/monthly/:vehicleId` | Métricas mensuales |

**Resumen incluye:**
- Total de recargas
- Total de galones
- Total gastado
- Distancia total recorrida
- Rendimiento promedio (km/gal)
- Costo promedio por km

### 🗺️ Rutas (`/routes`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/routes` | Listar rutas |
| POST | `/routes` | Guardar ruta |
| GET | `/routes/:id` | Obtener ruta |
| DELETE | `/routes/:id` | Eliminar ruta |

### 🏪 Gasolineras (`/stations`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/stations/nearby` | Buscar cercanas |

Query params: `?lat=-0.123&lng=-78.567&radiusKm=5`

### 💳 Pagos (`/payments`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/payments/checkout` | Crear sesión de pago |
| GET | `/payments` | Listar pagos |
| POST | `/payments/webhook` | Webhook de Stripe |

---

## 📊 Modelo de Datos

```
User
 ├── Vehicle (1:N)
 │    ├── Refuel (1:N)
 │    ├── MaintenanceItem (1:N)
 │    │    └── MaintenanceLog (1:N)
 │    └── Route (1:N)
 ├── Payment (1:N)
 ├── EmailVerificationToken (1:N)
 ├── PasswordResetToken (1:N)
 └── RefreshToken (1:N)
```

---

## 🧮 Lógica de Cálculos

### Rendimiento (km/galón)
```
Rendimiento = Distancia recorrida / Galones de la recarga ANTERIOR
```

Los galones que cargaste en la recarga anterior son los que consumiste para llegar a la siguiente recarga.

### Combustible Restante
1. Suma los galones de recargas recientes
2. Resta el consumo estimado basado en km recorridos
3. Considera recargas parciales (acumula si no gastó todo)
4. Limita al máximo de la capacidad del tanque

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## 📝 Swagger Documentation

Una vez iniciado el servidor, accede a:
```
http://localhost:3000/api
```

---

## 🐳 Docker

```bash
docker-compose up -d
```

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados.
