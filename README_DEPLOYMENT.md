# 🚀 DEPLOYMENT RÁPIDO - RENDER.COM
## Sistema Ecuestre FEI

---

## ✅ DECISIÓN: RENDER.COM (100% GRATIS)

**Costo: $0/mes** (Free Tier)
- ✅ Backend Django + Frontend React
- ✅ PostgreSQL 1GB incluido
- ✅ Redis 25MB incluido
- ✅ HTTPS/SSL automático
- ✅ Deploy automático desde GitHub

**Limitación:** Servicios duermen tras 15 min de inactividad
**Upgrade opcional:** $7/mes para servicio 24/7 sin dormido

---

## 📦 ARCHIVOS CREADOS PARA DEPLOYMENT

```
✅ render.yaml                        # Configuración principal de servicios
✅ build.sh                           # Script de build automático
✅ .env.production.example            # Variables de entorno
✅ backend/gunicorn_config.py         # Configuración servidor WSGI
✅ backend/requirements.txt           # Actualizado con dependencias producción
✅ backend/config/settings.py         # Actualizado para producción
✅ frontend/.env.example              # Variables frontend
✅ DEPLOYMENT_GUIDE.md                # Guía completa paso a paso
```

---

## 🎯 PASOS RÁPIDOS (5 MINUTOS)

### 1. Preparar Repositorio
```bash
# Verificar que estás en la rama main
git branch

# Commit todos los archivos nuevos
git add .
git commit -m "Add Render.com deployment configuration"
git push origin main
```

### 2. Crear Cuenta en Render.com
1. Ve a [https://render.com](https://render.com)
2. "Get Started for Free"
3. Login con GitHub
4. Autoriza acceso a repositorios

### 3. Deploy con Blueprint
1. Click **"New +"** → **"Blueprint"**
2. Selecciona tu repositorio
3. Render detecta `render.yaml` automáticamente
4. Revisa servicios:
   - ✅ equestrian-backend (Web Service)
   - ✅ equestrian-frontend (Static Site)
   - ✅ equestrian-db (PostgreSQL)
   - ✅ equestrian-redis (Redis)
5. Click **"Apply"**

### 4. Configurar URLs (IMPORTANTE)

**Espera a que termine el primer deploy (5-10 min)**

Obtendrás URLs como:
- Frontend: `https://equestrian-frontend.onrender.com`
- Backend: `https://equestrian-backend.onrender.com`

**Actualizar Backend:**
1. Ve a servicio `equestrian-backend`
2. Environment → `CORS_ALLOWED_ORIGINS`
3. Cambiar a: `https://equestrian-frontend.onrender.com`
4. Save Changes

**Actualizar Frontend:**
1. Ve a servicio `equestrian-frontend`
2. Environment → Agregar:
   - `VITE_API_BASE_URL` = `https://equestrian-backend.onrender.com/api`
   - `VITE_WS_URL` = `wss://equestrian-backend.onrender.com`
3. Save Changes (se redespliegue automáticamente)

---

## ✅ VERIFICACIÓN (2 MINUTOS)

### Backend Health Check
```bash
curl https://tu-backend.onrender.com/api/health/
```
✅ Debe responder: `{"status": "healthy", ...}`

### Frontend
1. Abre: `https://tu-frontend.onrender.com`
2. Login con: `admin` / `admin123`
3. ✅ Debe funcionar sin errores CORS

---

## 🐛 PROBLEMAS COMUNES

### Error CORS
**Solución:** Verifica que `CORS_ALLOWED_ORIGINS` en backend incluye la URL exacta del frontend (sin `/` al final)

### Frontend no conecta al Backend
**Solución:** Verifica `VITE_API_BASE_URL` en frontend apunta a backend con `/api` al final

### WebSockets no funcionan
**Solución:**
- Verifica `VITE_WS_URL` usa `wss://` (no `ws://`)
- Verifica que Redis está "Available" en Render.com

### Service Dormido
**Normal en Free Tier:** Primera request tarda 30-60s en despertar
**Solución:** Upgrade a Starter ($7/mes) o usa UptimeRobot (gratis)

---

## 💰 PLANES Y COSTOS

### Free Tier (Actual)
```
Backend:     $0
Frontend:    $0
PostgreSQL:  $0 (1GB)
Redis:       $0 (25MB)
────────────────
TOTAL:       $0/mes
```

### Producción Básica (Recomendado)
```
Backend Starter:  $7/mes (sin dormido)
Frontend:         $0
PostgreSQL:       $0 (1GB suficiente)
Redis:            $0 (25MB suficiente)
────────────────────────
TOTAL:            $7/mes
```

### Producción Completa (Crecimiento)
```
Backend Starter:      $7/mes
PostgreSQL Starter:   $7/mes (10GB)
Redis Starter:        $10/mes (256MB)
Frontend:             $0
─────────────────────────
TOTAL:                $24/mes
```

---

## 🎯 USUARIOS DE PRUEBA

El script `build.sh` crea automáticamente:

- 👑 **Admin:** `admin` / `admin123`
- 🏆 **Organizador:** `organizer1` / `org123`
- ⚖️ **Juez:** `judge1` / `judge123`

**⚠️ IMPORTANTE:** Cambia estas contraseñas en producción real

---

## 📚 DOCUMENTACIÓN COMPLETA

Para guía detallada paso a paso con screenshots y troubleshooting avanzado:
👉 **Ver `DEPLOYMENT_GUIDE.md`**

---

## 🔧 ACTUALIZAR LA APP

Render.com hace auto-deploy en cada push a `main`:

```bash
# Hacer cambios
git add .
git commit -m "Update feature X"
git push origin main

# ✅ Render.com despliega automáticamente
```

---

## 📊 RESUMEN DE BENEFICIOS

| Feature | Render.com | Heroku | Railway | Fly.io |
|---------|-----------|--------|---------|--------|
| **Free Tier** | ✅ Completo | ❌ No existe | ✅ $5 crédito | ✅ Limitado |
| **PostgreSQL** | ✅ Incluido | 💰 Desde $5 | ✅ Incluido | ✅ Incluido |
| **Redis** | ✅ Incluido | 💰 Desde $15 | ✅ Incluido | ⚠️ Manual |
| **WebSockets** | ✅ Nativo | ✅ Nativo | ✅ Nativo | ✅ Nativo |
| **Auto-deploy** | ✅ GitHub | ✅ GitHub | ✅ GitHub | ⚠️ CLI |
| **SSL/HTTPS** | ✅ Gratis | ✅ Gratis | ✅ Gratis | ✅ Gratis |
| **Configuración** | ✅ Fácil | ✅ Fácil | ✅ Fácil | ⚠️ Técnico |
| **Starter Plan** | $7/mes | $7/mes | $5/mes | $3/mes |

**🏆 GANADOR: RENDER.COM**
- Mejor equilibrio precio/features
- Free tier más generoso
- Configuración más simple
- Todo incluido (PostgreSQL + Redis)

---

## 🎉 ¡LISTO!

Con estos archivos configurados, tu sistema ecuestre FEI está listo para desplegarse en Render.com en menos de 10 minutos.

**Próximos pasos:**
1. ✅ Push a GitHub
2. ✅ Deploy en Render.com con Blueprint
3. ✅ Configurar URLs
4. ✅ Verificar funcionamiento
5. 🚀 ¡A producción!

**¿Dudas?** Revisa `DEPLOYMENT_GUIDE.md` para guía completa con troubleshooting.
