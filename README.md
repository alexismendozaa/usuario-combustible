<p align="center">
  <img src="fuel-mobile/assets/images/auth/logo-dark.png" alt="SmartFuel Logo" width="200" />
</p>

<h1 align="center">⛽ SmartFuel</h1>

<p align="center">
  <strong>Tu compañero inteligente para el control de combustible</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/Backend-NestJS-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/Mobile-React%20Native-61DAFB?style=for-the-badge&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## 📱 ¿Qué es SmartFuel?

**SmartFuel** es una aplicación móvil completa diseñada para ayudarte a **controlar, analizar y optimizar** el consumo de combustible de tus vehículos. Olvídate de las hojas de Excel o las notas en papel: con SmartFuel tienes todo en la palma de tu mano.

---

## ✨ Características Principales

### 🚗 Gestión de Vehículos
- Registra **múltiples vehículos** (autos, motos, camionetas)
- Almacena información detallada: marca, modelo, año, placa, tipo de combustible
- Configura la **capacidad del tanque** para cálculos precisos
- Seguimiento del **odómetro** actualizado automáticamente

### ⛽ Control de Recargas
- Registra cada carga de combustible con un solo tap
- Guarda: galones, costo, odómetro, método de pago
- Soporte para **cargas parciales o tanque lleno**
- Geolocalización automática de la estación
- Validación inteligente: no puedes cargar más de la capacidad del tanque

### 📊 Dashboard Inteligente
- **Combustible restante** calculado en tiempo real
- Visualización del **porcentaje del tanque** con colores intuitivos
- **Rendimiento promedio** (km/galón) calculado automáticamente
- Proyección de **gasto mensual**
- Historial de las últimas recargas

### 🔧 Mantenimiento Preventivo
- Programa mantenimientos por **kilómetros o tiempo**
- Alertas de mantenimientos pendientes
- Historial completo de servicios realizados
- Tipos: cambio de aceite, filtros, frenos, llantas y más

### 🗺️ Rutas GPS
- **Tracking en tiempo real** de tus recorridos
- Distancia recorrida y duración
- Historial de rutas con mapa interactivo
- Asocia rutas a vehículos específicos

### 🏪 Gasolineras Cercanas
- Encuentra estaciones de servicio cerca de ti
- Visualización en mapa
- Navegación directa a la estación

### 💳 Pagos Seguros
- Integración con **Stripe** para pagos premium
- Historial de transacciones
- Vouchers digitales automáticos

### 👤 Perfil de Usuario
- Foto de perfil personalizable
- Gestión de cuenta segura
- Verificación de email
- Recuperación de contraseña

---

## 📈 ¿Cómo Calcula el Combustible?

SmartFuel usa un algoritmo inteligente basado en tus datos reales:

### Rendimiento (km/galón)
```
Rendimiento = Distancia recorrida / Galones de la recarga anterior
```

### Combustible Restante
1. Suma los galones de tus recargas recientes
2. Resta el consumo estimado basado en km recorridos
3. Considera si hubo recargas parciales (no gastaste todo)
4. Muestra el porcentaje respecto a la capacidad del tanque

---

## 🛠️ Arquitectura del Proyecto

```
smartfuel/
├── fuel-backend/          # API REST con NestJS
│   ├── src/
│   │   ├── auth/          # Autenticación JWT
│   │   ├── vehicles/      # Gestión de vehículos
│   │   ├── refuels/       # Registro de cargas
│   │   ├── maintenance/   # Mantenimientos
│   │   ├── routes/        # Rutas GPS
│   │   ├── reports/       # Reportes y analytics
│   │   ├── stations/      # Gasolineras cercanas
│   │   ├── payments/      # Pagos con Stripe
│   │   └── users/         # Gestión de usuarios
│   └── prisma/            # Base de datos PostgreSQL
│
└── fuel-mobile/           # App React Native + Expo
    ├── src/
    │   ├── screens/       # Pantallas de la app
    │   ├── components/    # Componentes reutilizables
    │   ├── services/      # Conexión con API
    │   ├── context/       # Estado global (Auth, Vehicle)
    │   └── navigation/    # Navegación de la app
    └── assets/            # Imágenes y recursos
```

---

## 🚀 Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Mobile** | React Native + Expo |
| **Backend** | NestJS (Node.js + TypeScript) |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT (Access + Refresh Tokens) |
| **Maps** | React Native Maps + Expo Location |
| **Payments** | Stripe API |
| **Storage** | AWS S3 (avatares) |
| **Email** | Nodemailer (SMTP) |

---

## 📲 Capturas de Pantalla

<p align="center">
  <i>Dashboard • Vehículos • Recargas • Rutas GPS</i>
</p>

---

## 🏁 Inicio Rápido

### Requisitos Previos
- Node.js 18+
- PostgreSQL
- Expo CLI
- Cuenta de Stripe (opcional, para pagos)

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/smartfuel.git
cd smartfuel
```

### 2. Configurar Backend
```bash
cd fuel-backend
npm install
cp .env.example .env  # Configurar variables de entorno
npx prisma migrate deploy
npm run start:dev
```

### 3. Configurar Mobile
```bash
cd fuel-mobile
npm install
npx expo start
```

---

## 📄 Documentación

- [📖 Backend API Documentation](./fuel-backend/README.md)
- [📱 Mobile App Documentation](./fuel-mobile/README.md)

---

## 👥 Contribuidores

**Grupo 3**  
Programación para Dispositivos Móviles  
**Universidad Central del Ecuador**

---

## 📜 Licencia

Este proyecto es privado y está protegido por derechos de autor.

---

<p align="center">
  <strong>SmartFuel</strong> - Controla tu combustible, ahorra dinero 💰
</p>
