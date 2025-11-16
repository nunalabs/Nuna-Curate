# 🚀 CÓMO ACCEDER AL FRONTEND - NUNA CURATE

---

## ✅ **OPCIÓN 1: DESARROLLO LOCAL (RECOMENDADO)**

La forma más rápida para ver el frontend:

### Paso 1: Instalar dependencias (si no lo has hecho)
```bash
pnpm install
```

### Paso 2: Levantar el servidor de desarrollo
```bash
# Opción A: Levantar solo el frontend
cd apps/web
pnpm dev

# Opción B: Levantar todos los apps (frontend + backend)
# Desde la raíz del proyecto:
pnpm dev
```

### Paso 3: Abrir en el navegador
```
http://localhost:3000
```

**Ventajas:**
- ✅ Hot reload automático
- ✅ Más rápido para desarrollo
- ✅ Fácil debugging
- ✅ No requiere Docker

---

## 🐳 **OPCIÓN 2: DOCKER - DESARROLLO**

Para ambiente completo con base de datos y backend:

### Paso 1: Levantar servicios de desarrollo
```bash
# Desde la raíz del proyecto
docker-compose up -d
```

### Paso 2: Ver logs (opcional)
```bash
docker-compose logs -f
```

### Paso 3: Acceder
```
Frontend: http://localhost:3000
Backend:  http://localhost:4000
PgAdmin:  http://localhost:5050
Redis UI: http://localhost:8081
```

### Detener servicios
```bash
docker-compose down
```

**Ventajas:**
- ✅ Ambiente completo (PostgreSQL, Redis)
- ✅ Más cercano a producción
- ✅ No contamina tu sistema local

---

## 🚢 **OPCIÓN 3: DOCKER - PRODUCCIÓN**

Para probar la versión de producción optimizada:

### Paso 1: Configurar environment
```bash
cp .env.production.example .env.production
# Editar .env.production con tus valores
```

### Paso 2: Validar configuración
```bash
./deployment/pre-deploy-check.sh
```

### Paso 3: Desplegar
```bash
./deployment/deploy-production.sh
# Seleccionar opción 1 (Fresh deployment)
```

### Paso 4: Acceder
```
Frontend: http://localhost
Backend:  http://localhost/api
```

**Ventajas:**
- ✅ Build optimizado de producción
- ✅ Nginx reverse proxy
- ✅ Caching configurado
- ✅ Exactamente como en producción

---

## 🔧 **TROUBLESHOOTING**

### Puerto 3000 ya está en uso
```bash
# Ver qué proceso está usando el puerto
lsof -i :3000

# Matar el proceso
kill -9 <PID>

# O usar otro puerto
PORT=3001 pnpm dev
```

### Dependencias no instaladas
```bash
# Limpiar e instalar
pnpm clean
pnpm install
```

### Variables de entorno
```bash
# Crear archivo .env.local para desarrollo
cp .env.example .env.local
# Editar con tus valores
```

### Docker no arranca
```bash
# Ver logs
docker-compose logs frontend

# Reconstruir imagen
docker-compose build --no-cache frontend

# Reiniciar
docker-compose restart frontend
```

---

## 📱 **VERIFICAR QUE FUNCIONA**

Cuando el frontend esté corriendo, deberías ver:

1. **Página de inicio** de Nuna Curate
2. **Navegación** funcionando
3. **Wallet connect** (Freighter para Stellar)
4. **Sin errores** en la consola del navegador

### Health Check
```bash
# Verificar que el frontend responde
curl http://localhost:3000

# O en el navegador:
http://localhost:3000/api/health
```

---

## 🎯 **QUICK START (Lo Más Rápido)**

```bash
# 1. Ir al directorio del proyecto
cd /Users/munay/dev/Nuna-Curate

# 2. Instalar (si es primera vez)
pnpm install

# 3. Levantar frontend
cd apps/web
pnpm dev

# 4. Abrir navegador en:
# http://localhost:3000
```

---

## 📊 **PUERTOS POR DEFECTO**

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 4000 | http://localhost:4000 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| PgAdmin | 5050 | http://localhost:5050 |
| Redis Commander | 8081 | http://localhost:8081 |
| Nginx (Prod) | 80 | http://localhost |

---

## 🌐 **ACCESO DESDE OTRA MÁQUINA**

Si quieres acceder desde otro dispositivo en tu red:

```bash
# 1. Obtener tu IP local
ifconfig | grep "inet " | grep -v 127.0.0.1

# 2. Acceder desde otro dispositivo:
# http://TU_IP:3000
# Ejemplo: http://192.168.1.100:3000
```

Para permitir esto en Next.js:
```bash
# En apps/web/.env.local
NEXT_PUBLIC_API_URL=http://TU_IP:4000
```

---

**Recomendación**: Para desarrollo diario, usa **OPCIÓN 1** (pnpm dev).
