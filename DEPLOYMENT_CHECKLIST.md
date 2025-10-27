# ✅ DEPLOYMENT CHECKLIST
## Sistema de Gestión Ecuestre FEI → Render.com

---

## 📋 PRE-DEPLOYMENT

### Archivos de Configuración
- [ ] `render.yaml` existe en raíz del repositorio
- [ ] `build.sh` existe y tiene permisos de ejecución (`chmod +x build.sh`)
- [ ] `backend/requirements.txt` actualizado con dependencias de producción
- [ ] `backend/gunicorn_config.py` creado
- [ ] `backend/config/settings.py` actualizado para producción
- [ ] `frontend/.env.example` creado
- [ ] `.env.production.example` creado en raíz

### Verificación de Código
- [ ] `.gitignore` incluye `.env`, `*.pyc`, `node_modules/`, etc.
- [ ] No hay archivos sensibles (`.env` con secrets reales)
- [ ] Branch `main` está actualizado
- [ ] Todos los tests pasan (si existen)

### Git & GitHub
- [ ] Repositorio creado en GitHub
- [ ] Código completo subido (`git push origin main`)
- [ ] Estructura correcta: `equestrian-fei-system/backend/` y `equestrian-fei-system/frontend/`

---

## 🌐 CONFIGURACIÓN RENDER.COM

### Crear Cuenta
- [ ] Cuenta creada en [Render.com](https://render.com)
- [ ] Login con GitHub completado
- [ ] Autorización a repositorios concedida

### Deploy con Blueprint
- [ ] Click en "New +" → "Blueprint"
- [ ] Repositorio seleccionado
- [ ] `render.yaml` detectado automáticamente
- [ ] 4 servicios mostrados:
  - [ ] `equestrian-backend` (Web Service)
  - [ ] `equestrian-frontend` (Static Site)
  - [ ] `equestrian-db` (PostgreSQL Database)
  - [ ] `equestrian-redis` (Redis)
- [ ] Click en "Apply"

### Esperar Primer Deploy
- [ ] Backend: Build completado (5-8 min)
- [ ] Frontend: Build completado (2-3 min)
- [ ] Database: Creada y disponible
- [ ] Redis: Creado y disponible

---

## ⚙️ CONFIGURACIÓN POST-DEPLOY

### Anotar URLs
Después del primer deploy, anota tus URLs:

```
Frontend: https://__________________________.onrender.com
Backend:  https://__________________________.onrender.com
```

### Configurar Backend
- [ ] Ir a servicio `equestrian-backend`
- [ ] Click en "Environment"
- [ ] Verificar variables:
  - [ ] `SECRET_KEY` - Generado automáticamente ✅
  - [ ] `DEBUG` - `False` ✅
  - [ ] `DATABASE_URL` - Conectado automáticamente ✅
  - [ ] `REDIS_URL` - Conectado automáticamente ✅
- [ ] **ACTUALIZAR** `CORS_ALLOWED_ORIGINS`:
  ```
  https://tu-frontend.onrender.com,http://localhost:5173
  ```
- [ ] Click "Save Changes"

### Configurar Frontend
- [ ] Ir a servicio `equestrian-frontend`
- [ ] Click en "Environment"
- [ ] **AGREGAR** variables:
  - [ ] `VITE_API_BASE_URL` = `https://tu-backend.onrender.com/api`
  - [ ] `VITE_WS_URL` = `wss://tu-backend.onrender.com`
- [ ] Click "Save Changes"
- [ ] Esperar redespliegue automático (1-2 min)

---

## ✅ VERIFICACIÓN

### Backend API
- [ ] Abrir: `https://tu-backend.onrender.com/api/health/`
- [ ] Debe responder:
  ```json
  {
    "status": "healthy",
    "message": "FEI Equestrian System API is running",
    "version": "1.0.0"
  }
  ```

### Test Login API
```bash
curl -X POST https://tu-backend.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

- [ ] Responde con `access` y `refresh` tokens
- [ ] No hay errores de database
- [ ] Status 200 OK

### Frontend Web
- [ ] Abrir: `https://tu-frontend.onrender.com`
- [ ] Página de login carga correctamente
- [ ] Login con `admin` / `admin123` funciona
- [ ] Dashboard de admin carga sin errores
- [ ] No hay errores CORS en la consola (F12)
- [ ] Navegación entre páginas funciona

### WebSockets (Rankings)
- [ ] Login como admin
- [ ] Ir a "Competencias"
- [ ] Click en cualquier competencia → "Rankings"
- [ ] Abrir Developer Console (F12) → Network → WS
- [ ] Debe aparecer conexión WebSocket: `wss://tu-backend.onrender.com/ws/...`
- [ ] Estado: "Connected" (101)

### Base de Datos
- [ ] Ir a `equestrian-db` en Render.com
- [ ] Estado: "Available" ✅
- [ ] Usuarios de prueba creados (revisar logs de backend):
  ```
  ✅ Superuser 'admin' created
  ✅ Organizer 'organizer1' created
  ✅ Judge 'judge1' created
  ```

### Redis
- [ ] Ir a `equestrian-redis` en Render.com
- [ ] Estado: "Available" ✅
- [ ] En logs de backend buscar:
  ```
  ✅ Using Redis from REDIS_URL for Channel Layers
  ```

---

## 🔧 CONFIGURACIÓN ADICIONAL (Opcional)

### Auto-Deploy
- [ ] Ir a Backend → Settings
- [ ] "Auto-Deploy" está activado ✅
- [ ] Branch: `main` ✅
- [ ] Repetir para Frontend

### Health Check
- [ ] Backend → Settings → Health Check Path
- [ ] Debe ser: `/api/health/` ✅

### Notificaciones
- [ ] Settings → Notifications
- [ ] Email configurado para alertas de deploy
- [ ] Email configurado para alertas de errores

---

## 🐛 TROUBLESHOOTING

### Si Backend No Arranca
- [ ] Ver logs: Backend → Logs
- [ ] Buscar error específico
- [ ] Verificar que `build.sh` se ejecutó correctamente
- [ ] Verificar que migraciones corrieron: `Running migrations...`

### Si Frontend No Conecta al Backend
- [ ] Verificar CORS: `CORS_ALLOWED_ORIGINS` en backend
- [ ] Verificar API URL: `VITE_API_BASE_URL` en frontend
- [ ] Sin `/` al final de las URLs
- [ ] Protocolo correcto: `https://` no `http://`

### Si WebSockets No Funcionan
- [ ] `VITE_WS_URL` usa `wss://` (no `ws://`)
- [ ] Redis está "Available"
- [ ] `REDIS_URL` está configurado en backend
- [ ] En logs de backend: "Using Redis from REDIS_URL"

### Si Hay Errores CORS
- [ ] Backend CORS incluye URL exacta del frontend
- [ ] Frontend API URL apunta al backend correcto
- [ ] No hay espacios en las URLs
- [ ] Protocolo correcto (https/wss)

---

## 💰 COSTOS

### Plan Actual: FREE TIER
```
✅ Backend:     $0/mes
✅ Frontend:    $0/mes
✅ PostgreSQL:  $0/mes (1GB)
✅ Redis:       $0/mes (25MB)
─────────────────────────
TOTAL:          $0/mes
```

**Limitación:** Servicios duermen tras 15 min de inactividad

### Upgrade Recomendado: STARTER ($7/mes)
- [ ] Ir a Backend → Settings → Instance Type
- [ ] Cambiar a "Starter"
- [ ] Save Changes

**Beneficio:** Servicio 24/7 sin dormido, mejor performance

---

## 📊 MÉTRICAS Y MONITOREO

### Verificar Métricas
- [ ] Backend → Metrics
- [ ] CPU Usage < 50%
- [ ] Memory Usage < 400MB
- [ ] Response Time < 1s
- [ ] Error Rate < 1%

### Logs
- [ ] Backend logs no muestran errores críticos
- [ ] Frontend build exitoso
- [ ] Database migrations completadas

---

## 🎯 USUARIOS DE PRUEBA

Verificar que estos usuarios funcionan:

- [ ] **Admin:** `admin` / `admin123`
  - [ ] Puede acceder a `/admin`
  - [ ] Puede ver todas las secciones
  - [ ] Puede crear competencias
  - [ ] Puede crear categorías

- [ ] **Organizador:** `organizer1` / `org123`
  - [ ] Puede acceder a `/organizer`
  - [ ] Puede gestionar competencias
  - [ ] Puede ver participantes

- [ ] **Juez:** `judge1` / `judge123`
  - [ ] Puede acceder a `/judge`
  - [ ] Puede ver competencias asignadas
  - [ ] Puede acceder a sistema de calificación

---

## 🔒 SEGURIDAD (Producción Real)

Si vas a usar en producción con usuarios reales:

- [ ] Cambiar contraseña de usuario `admin`
- [ ] Eliminar usuarios de prueba (`organizer1`, `judge1`)
- [ ] Generar nuevo `SECRET_KEY` en Render.com
- [ ] Configurar dominio personalizado (opcional)
- [ ] Habilitar SSL/HTTPS (automático en Render)
- [ ] Configurar backups de database
- [ ] Implementar monitoring con Sentry (opcional)

---

## ✅ DEPLOYMENT EXITOSO

Si todos los checks anteriores están completados:

🎉 **¡FELICITACIONES!**

Tu **Sistema de Gestión Ecuestre FEI** está desplegado y funcionando en producción.

**URLs de tu aplicación:**
```
🌐 Frontend:     https://__________________________.onrender.com
🔌 Backend API:  https://__________________________.onrender.com
🏥 Health Check: https://__________________________.onrender.com/api/health/
```

**Próximos pasos:**
1. [ ] Compartir URL con usuarios de prueba
2. [ ] Crear usuarios reales
3. [ ] Cargar datos de competencias reales
4. [ ] Considerar upgrade a plan Starter ($7/mes)
5. [ ] Configurar dominio personalizado (opcional)

---

## 📚 RECURSOS

- 📖 **Guía Completa:** `DEPLOYMENT_GUIDE.md`
- 🚀 **Guía Rápida:** `README_DEPLOYMENT.md`
- 🔧 **Render.com Docs:** https://render.com/docs
- 💬 **Soporte:** https://community.render.com

---

## 📝 NOTAS

**Fecha de deployment:** _______________

**URLs anotadas:** ✅

**Plan actual:** Free Tier / Starter / Professional (marcar)

**Próximo upgrade programado:** _______________

**Contacto responsable:** _______________

---

**Versión del checklist:** 1.0
**Última actualización:** Octubre 2025
