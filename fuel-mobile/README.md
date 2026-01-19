# Fuel Manager - Aplicación Móvil

Aplicación móvil React Native + Expo para gestión de consumo de combustible y vehículos.

## Stack Tecnológico

- **React Native** + **Expo** (managed workflow)
- **TypeScript**
- **React Navigation** (Stack + Bottom Tabs)
- **Axios** (HTTP client con interceptores JWT)
- **expo-secure-store** (Almacenamiento seguro de tokens)
- **expo-location** (Tracking GPS)
- **react-native-maps** (Mapas y ubicación)
- **react-native-webview** (Stripe Checkout)
- **expo-image-picker** (Subida de avatares)

## Estructura del Proyecto

```
fuel-mobile/
├── src/
│   ├── components/         # Componentes reutilizables
│   │   └── common/         # Button, Input, LoadingSpinner
│   ├── config/             # Configuración y constantes
│   ├── context/            # Context API (AuthContext)
│   ├── hooks/              # Custom hooks (useRouteTracker)
│   ├── navigation/         # Configuración de navegación
│   ├── screens/            # Pantallas de la app
│   │   ├── auth/          # Login, Register, Verify, etc.
│   │   └── main/          # Dashboard, Vehicles, Refuels, etc.
│   ├── services/           # Servicios de API
│   │   └── api/           # Cliente HTTP y servicios específicos
│   └── utils/              # Utilidades (location, etc.)
├── App.tsx                 # Punto de entrada
└── app.json                # Configuración de Expo
```

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

Para producción, usa la URL de tu servidor:
```env
EXPO_PUBLIC_API_BASE_URL=https://tu-servidor.com
```

### 2. Instalación de Dependencias

```bash
npm install
```

### 3. Ejecutar en Desarrollo

```bash
# Iniciar Expo
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios
```

## Funcionalidades Implementadas

### Autenticación
- ✅ Registro de usuario
- ✅ Login con JWT + Refresh Token
- ✅ Verificación de email
- ✅ Recuperación de contraseña
- ✅ Manejo automático de tokens (refresh automático)
- ✅ Logout

### Usuario
- ✅ Ver perfil
- ✅ Actualizar nombre
- ✅ Subir/eliminar avatar (S3)
- ✅ Eliminar cuenta

### Vehículos
- ✅ Listar vehículos
- ✅ Crear vehículo (placeholder)
- ✅ Eliminar vehículo
- ✅ Ver detalle (placeholder)

### Combustible
- ✅ Listar recargas
- ✅ Crear recarga (placeholder)
- ✅ Eliminar recarga

### Rutas GPS
- ✅ Tracking GPS en tiempo real
- ✅ Listar rutas guardadas
- ✅ Guardar ruta con puntos GPS
- ✅ Calcular distancia y duración

### Mantenimientos
- ✅ Listar tareas de mantenimiento

### Pagos
- ✅ Listar pagos
- ⏳ Integración Stripe Checkout (próximamente)

## Integración con Backend

La aplicación está configurada para conectarse al backend NestJS existente. Asegúrate de:

1. **Configurar la URL base** en `.env`:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://tu-servidor:3000
   ```

2. **Backend debe estar corriendo** y accesible desde el dispositivo/emulador

3. **CORS configurado** en el backend para permitir requests desde la app móvil

## Build de APK para Android

### Opción 1: Expo Build Service (Recomendado para académico)

1. **Instalar EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Configurar proyecto**:
   ```bash
   eas build:configure
   ```

3. **Build APK**:
   ```bash
   eas build --platform android --profile preview
   ```

   El `--profile preview` genera un APK para testing (no requiere Google Play).

4. **Descargar APK**: Una vez completado, EAS te dará un enlace para descargar el APK.

### Opción 2: Build Local (Requiere Android Studio)

1. **Generar proyecto nativo**:
   ```bash
   npx expo prebuild --platform android
   ```

2. **Abrir en Android Studio** y construir el APK manualmente.

### Opción 3: Expo Go (Desarrollo/Testing)

Para testing rápido sin build:
```bash
npm start
```
Luego escanea el QR con Expo Go app.

## Configuración de Permisos

La app requiere los siguientes permisos:

- **Ubicación**: Para tracking GPS de rutas
- **Cámara/Galería**: Para subir avatares
- **Internet**: Para comunicación con el backend

Estos permisos se solicitan automáticamente cuando son necesarios.

## Próximas Mejoras

- [ ] Formularios completos (Vehículos, Recargas)
- [ ] Integración completa de Stripe Checkout con WebView
- [ ] Visualización de rutas en mapa
- [ ] Búsqueda de gasolineras cercanas en mapa
- [ ] Reportes y estadísticas
- [ ] Notificaciones push

## Notas Importantes

- La app está diseñada para **Android prioritariamente**
- No se publicará en Play Store/App Store (uso académico)
- Todas las funcionalidades usan el backend existente
- Los tokens se almacenan de forma segura usando `expo-secure-store`
- El refresh token se maneja automáticamente en los interceptores de Axios

## Troubleshooting

### Error de conexión con el backend

1. Verifica que `EXPO_PUBLIC_API_BASE_URL` esté configurado correctamente
2. Asegúrate de que el backend esté corriendo
3. En Android emulador, usa `http://10.0.2.2:3000` en lugar de `localhost`
4. En dispositivo físico, usa la IP local de tu máquina

### Error de permisos de ubicación

- Ve a Configuración de la app y otorga permisos manualmente
- La app solicita permisos automáticamente cuando inicia el tracking

### Problemas con FormData (avatares)

- Asegúrate de no establecer `Content-Type` manualmente cuando uses FormData
- El cliente HTTP maneja esto automáticamente

## Licencia

Proyecto académico - Uso interno