# 🚀 GUÍA COMPLETA DE DEPLOYMENT - RENDER.COM
## Sistema de Gestión Ecuestre FEI

---

## 📋 TABLA DE CONTENIDOS

1. [Requisitos Previos](#requisitos-previos)
2. [Preparación del Repositorio](#preparación-del-repositorio)
3. [Configuración en Render.com](#configuración-en-rendercom)
4. [Deployment Paso a Paso](#deployment-paso-a-paso)
5. [Verificación Post-Deployment](#verificación-post-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Upgrade a Plan Pagado](#upgrade-a-plan-pagado)
8. [Mantenimiento](#mantenimiento)

---

## 📌 REQUISITOS PREVIOS

### ✅ Checklist Pre-Deployment

- [ ] Cuenta en [GitHub](https://github.com)
- [ ] Cuenta en [Render.com](https://render.com) (gratis)
- [ ] Repositorio Git del proyecto
- [ ] Código subido a GitHub
- [ ] Estructura del proyecto: `equestrian-fei-system/` con carpetas `backend/` y `frontend/`

### 📂 Estructura del Repositorio

```
tu-repositorio-github/
├── equestrian-fei-system/
│   ├── backend/
│   │   ├── apps/
│   │   ├── config/
│   │   ├── manage.py
│   │   ├── requirements.txt
│   │   └── gunicorn_config.py
│   └── frontend/
│       ├── src/
│       ├── package.json
│       └── vite.config.js
├── render.yaml
├── build.sh
├── .env.production.example
└── DEPLOYMENT_GUIDE.md
```

---

## 🔧 PREPARACIÓN DEL REPOSITORIO

### 1. Verificar Archivos de Configuración

Asegúrate de que existen estos archivos en la raíz del proyecto:

```bash
# En la raíz del repositorio
ls -la
```

Debes ver:
- ✅ `render.yaml` - Configuración de servicios
- ✅ `build.sh` - Script de build
- ✅ `.env.production.example` - Variables de entorno de ejemplo
- ✅ `equestrian-fei-system/backend/gunicorn_config.py` - Configuración del servidor
- ✅ `equestrian-fei-system/backend/requirements.txt` - Dependencias Python

### 2. Actualizar .gitignore

Asegúrate de que `.gitignore` incluye:

```gitignore
# Environment variables
.env
.env.local
.env.production

# Python
*.pyc
__pycache__/
*.py[cod]
*$py.class
venv/
*.sqlite3

# Django
staticfiles/
media/
logs/
backups/

# Node
node_modules/
dist/
.DS_Store
```

### 3. Commit y Push a GitHub

```bash
# Asegúrate de estar en la rama main
git branch

# Agregar todos los archivos nuevos
git add .

# Crear commit
git commit -m "Add Render.com deployment configuration"

# Push a GitHub
git push origin main
```

---

## 🌐 CONFIGURACIÓN EN RENDER.COM

### Paso 1: Crear Cuenta en Render.com

1. Ve a [https://render.com](https://render.com)
2. Haz clic en **"Get Started for Free"**
3. Regístrate con tu cuenta de GitHub (recomendado)
4. Autoriza a Render.com para acceder a tus repositorios

### Paso 2: Conectar Repositorio de GitHub

1. En el dashboard de Render.com, haz clic en **"New +"**
2. Selecciona **"Blueprint"** (para usar `render.yaml`)
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio del proyecto ecuestre

---

## 🚀 DEPLOYMENT PASO A PASO

### Opción A: Deployment Automático con Blueprint (RECOMENDADO)

#### 1. Usar render.yaml

Render.com detectará automáticamente el archivo `render.yaml` en tu repositorio.

1. Haz clic en **"New +"** → **"Blueprint"**
2. Selecciona tu repositorio
3. Render.com mostrará los servicios detectados:
   - ✅ **equestrian-backend** (Web Service)
   - ✅ **equestrian-frontend** (Static Site)
   - ✅ **equestrian-db** (PostgreSQL)
   - ✅ **equestrian-redis** (Redis)

4. Revisa la configuración y haz clic en **"Apply"**

#### 2. Configurar Variables de Entorno

Render.com configurará automáticamente la mayoría de variables, pero verifica:

**Backend Service:**
- ✅ `SECRET_KEY` - Generado automáticamente
- ✅ `DEBUG` - `False`
- ✅ `ALLOWED_HOSTS` - `.onrender.com,localhost,127.0.0.1`
- ✅ `DATABASE_URL` - Conectado automáticamente
- ✅ `REDIS_URL` - Conectado automáticamente
- ⚠️ `CORS_ALLOWED_ORIGINS` - **DEBES ACTUALIZARLO**

**Frontend Service:**
- ⚠️ `VITE_API_URL` - **DEBES CONFIGURARLO**
- ⚠️ `VITE_WS_URL` - **DEBES CONFIGURARLO**

#### 3. Actualizar CORS (MUY IMPORTANTE)

Una vez que el frontend esté desplegado, obtendrás una URL como:
```
https://equestrian-frontend.onrender.com
```

Actualiza la variable `CORS_ALLOWED_ORIGINS` en el backend:

1. Ve al servicio **equestrian-backend**
2. Click en **"Environment"**
3. Busca `CORS_ALLOWED_ORIGINS`
4. Actualiza a: `https://equestrian-frontend.onrender.com,http://localhost:5173`
5. Guarda cambios

#### 4. Actualizar URLs del Frontend

1. Ve al servicio **equestrian-frontend**
2. Click en **"Environment"**
3. Actualiza `VITE_API_URL` con la URL del backend:
   ```
   https://equestrian-backend.onrender.com
   ```
4. Actualiza `VITE_WS_URL`:
   ```
   wss://equestrian-backend.onrender.com
   ```
5. Guarda y espera a que se redespliegue

---

### Opción B: Deployment Manual (Alternativa)

Si prefieres crear los servicios manualmente:

#### 1. Crear PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Configuración:
   - **Name:** `equestrian-db`
   - **Database:** `equestrian_fei_db`
   - **User:** `postgres` (automático)
   - **Region:** Oregon (o más cercano)
   - **Plan:** Free

3. Click **"Create Database"**

#### 2. Crear Redis Instance

1. Click **"New +"** → **"Redis"**
2. Configuración:
   - **Name:** `equestrian-redis`
   - **Region:** Oregon (mismo que la DB)
   - **Plan:** Free
   - **Maxmemory Policy:** `allkeys-lru`

3. Click **"Create Redis"**

#### 3. Crear Backend Service

1. Click **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Configuración:
   - **Name:** `equestrian-backend`
   - **Region:** Oregon
   - **Branch:** main
   - **Root Directory:** `equestrian-fei-system/backend`
   - **Runtime:** Python 3
   - **Build Command:**
     ```bash
     chmod +x ../../build.sh && ../../build.sh
     ```
   - **Start Command:**
     ```bash
     gunicorn config.wsgi:application --config gunicorn_config.py
     ```
   - **Plan:** Free

4. **Environment Variables:**
   ```
   PYTHON_VERSION=3.11
   DEBUG=False
   ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1
   ```

5. **Advanced Settings:**
   - Health Check Path: `/api/health/`
   - Auto-Deploy: Yes

6. Click **"Create Web Service"**

#### 4. Conectar Database y Redis al Backend

1. En el servicio `equestrian-backend`, ve a **"Environment"**
2. Click **"Add Environment Variable"**
3. Agrega:
   - `DATABASE_URL`: Click "Add from Database" → selecciona `equestrian-db`
   - `REDIS_URL`: Click "Add from Redis" → selecciona `equestrian-redis`

#### 5. Crear Frontend Service

1. Click **"New +"** → **"Static Site"**
2. Conecta tu repositorio
3. Configuración:
   - **Name:** `equestrian-frontend`
   - **Branch:** main
   - **Root Directory:** `equestrian-fei-system/frontend`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory:** `dist`

4. **Environment Variables:**
   ```
   VITE_API_URL=https://equestrian-backend.onrender.com
   VITE_WS_URL=wss://equestrian-backend.onrender.com
   ```

5. Click **"Create Static Site"**

---

## ✅ VERIFICACIÓN POST-DEPLOYMENT

### 1. Verificar Backend

#### A. Health Check
```bash
curl https://equestrian-backend.onrender.com/api/health/
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "message": "FEI Equestrian System API is running",
  "version": "1.0.0"
}
```

#### B. Verificar Database
En los logs del backend, busca:
```
✅ Database migrations completed
✅ Superuser 'admin' created
```

#### C. Verificar Redis
```
✅ Using Redis from REDIS_URL for Channel Layers
```

#### D. Test Login API
```bash
curl -X POST https://equestrian-backend.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Respuesta esperada:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    ...
  }
}
```

### 2. Verificar Frontend

1. Abre en el navegador:
   ```
   https://equestrian-frontend.onrender.com
   ```

2. Debes ver la página de login

3. Prueba login con:
   - **Usuario:** `admin`
   - **Password:** `admin123`

4. Verifica que:
   - ✅ Login funciona
   - ✅ Dashboard carga correctamente
   - ✅ Navegación entre páginas funciona
   - ✅ API calls funcionan (no hay errores CORS)

### 3. Verificar WebSockets (Rankings en tiempo real)

1. Login como admin
2. Ve a una competencia
3. Click en **"Rankings"**
4. Abre Developer Console (F12)
5. En la pestaña Network, busca conexiones WebSocket
6. Debes ver: `wss://equestrian-backend.onrender.com/ws/...` conectado

---

## 🐛 TROUBLESHOOTING

### Problema 1: "Application failed to start"

**Síntoma:** El backend no arranca

**Soluciones:**

1. **Verifica logs en Render.com:**
   - Ve al servicio backend
   - Click en "Logs"
   - Busca errores

2. **Errores comunes:**

   **Error: "No module named 'gunicorn'"**
   ```bash
   # Solución: Asegúrate de que requirements.txt incluye gunicorn
   # Debe estar en equestrian-fei-system/backend/requirements.txt
   gunicorn==21.2.0
   ```

   **Error: "relation does not exist"**
   ```bash
   # Solución: Las migraciones no corrieron
   # Verifica que build.sh se ejecutó correctamente
   # Manualmente, ejecuta:
   python manage.py migrate
   ```

   **Error: "SECRET_KEY not set"**
   ```bash
   # Solución: Genera una nueva SECRET_KEY en Render.com
   # Environment → SECRET_KEY → Generate Value
   ```

### Problema 2: CORS Errors en Frontend

**Síntoma:** Errores en consola del navegador tipo:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solución:**

1. Verifica `CORS_ALLOWED_ORIGINS` en backend incluye la URL del frontend:
   ```
   https://equestrian-frontend.onrender.com
   ```

2. Verifica `VITE_API_URL` en frontend apunta al backend:
   ```
   https://equestrian-backend.onrender.com
   ```

3. **IMPORTANTE:** No incluir `/` al final de las URLs

### Problema 3: WebSockets No Conectan

**Síntoma:** Rankings en tiempo real no actualizan

**Solución:**

1. Verifica que Redis está corriendo:
   - Ve al servicio `equestrian-redis`
   - Debe estar "Available"

2. Verifica `REDIS_URL` en backend:
   - Environment → REDIS_URL → debe apuntar a tu Redis instance

3. Verifica `VITE_WS_URL` en frontend:
   ```
   wss://equestrian-backend.onrender.com
   ```

### Problema 4: Static Files No Cargan

**Síntoma:** CSS/JS no cargan, página sin estilos

**Backend:**
```bash
# Verifica que collectstatic corrió
python manage.py collectstatic --no-input
```

**Frontend:**
```bash
# Verifica que build completó
npm run build
# Debe crear carpeta dist/
```

### Problema 5: Database Connection Failed

**Síntoma:** Error "could not connect to server"

**Solución:**

1. Verifica que la database `equestrian-db` está "Available"
2. Verifica que `DATABASE_URL` está configurado en backend
3. Verifica que están en la misma región (Oregon)

### Problema 6: Service Dormido (Free Tier)

**Síntoma:** Primera request tarda 30-60 segundos

**Explicación:** Esto es normal en free tier. El servicio duerme tras 15 min de inactividad.

**Soluciones:**

1. **Keep-Alive Service** (Gratis):
   - Usa un servicio como [UptimeRobot](https://uptimerobot.com) (gratis)
   - Configura ping cada 14 minutos a `/api/health/`

2. **Upgrade a Starter Plan** ($7/mes):
   - Servicios nunca duermen
   - Mejor performance

---

## 💰 UPGRADE A PLAN PAGADO

### Free Tier vs Starter Plan

| Feature | Free | Starter ($7/mes) |
|---------|------|------------------|
| **RAM** | 512MB | 512MB |
| **CPU** | Compartido | Compartido |
| **Dormido** | Sí (15 min) | No |
| **Build Minutes** | 500/mes | 500/mes |
| **Bandwidth** | 100GB | 100GB |
| **PostgreSQL** | 1GB | 10GB |
| **Redis** | 25MB | 256MB |

### Cuándo Hacer Upgrade

**Debes hacer upgrade si:**
- ✅ Vas a producción real con usuarios
- ✅ Necesitas servicio 24/7 sin dormido
- ✅ Database > 1GB
- ✅ Necesitas más Redis para WebSockets

**Puedes quedarte en Free si:**
- ✅ Estás en desarrollo/testing
- ✅ Es un prototipo/demo
- ✅ No importa el tiempo de arranque inicial

### Cómo Hacer Upgrade

1. Ve al servicio (backend o frontend)
2. Click en **"Settings"**
3. Scroll a **"Instance Type"**
4. Selecciona **"Starter"**
5. Click **"Save Changes"**

**Costo Total Recomendado para Producción:**
```
Backend Starter:    $7/mes
PostgreSQL Starter: $7/mes
Redis Starter:      $10/mes
Frontend:           $0 (gratis)
─────────────────────────
TOTAL:              $24/mes
```

**Alternativa Económica:**
```
Backend Starter:    $7/mes
PostgreSQL Free:    $0 (1GB suficiente para empezar)
Redis Free:         $0 (25MB suficiente para empezar)
Frontend:           $0
─────────────────────────
TOTAL:              $7/mes
```

---

## 🔧 MANTENIMIENTO

### Actualizar la Aplicación

#### Deploy Automático (Recomendado)

Render.com hace auto-deploy en cada push a `main`:

```bash
# Hacer cambios en el código
git add .
git commit -m "Update feature X"
git push origin main

# Render.com detecta el push y despliega automáticamente
```

#### Deploy Manual

1. Ve al servicio en Render.com
2. Click **"Manual Deploy"**
3. Selecciona **"Deploy latest commit"**

### Ver Logs

```bash
# En Render.com Dashboard:
# 1. Selecciona el servicio
# 2. Click en "Logs"
# 3. Filtra por error/warning si es necesario
```

### Backup de Database

#### Automático (Solo planes pagados)
- Render.com hace backups automáticos diarios

#### Manual (Free tier)

```bash
# 1. Ir a la database en Render.com
# 2. Click en "Connections"
# 3. Copiar "External Database URL"

# 4. En tu máquina local:
pg_dump "postgresql://user:pass@host:5432/db" > backup.sql

# 5. Para restaurar:
psql "postgresql://user:pass@host:5432/db" < backup.sql
```

### Monitorear Performance

#### Métricas en Render.com:
- CPU Usage
- Memory Usage
- Response Time
- Error Rate

1. Ve al servicio
2. Click en **"Metrics"**
3. Revisa gráficas

#### Alertas:
1. Settings → Notifications
2. Configura email para alertas
3. Umbrales: CPU > 80%, Memory > 85%

### Rollback a Versión Anterior

Si un deploy causa problemas:

1. Ve al servicio
2. Click en **"Events"**
3. Encuentra el deploy anterior exitoso
4. Click **"Rollback to this deploy"**

---

## 🎯 CHECKLIST FINAL DE DEPLOYMENT

### Pre-Deployment
- [ ] Código subido a GitHub
- [ ] `render.yaml` configurado
- [ ] `build.sh` con permisos de ejecución
- [ ] `requirements.txt` actualizado
- [ ] `gunicorn_config.py` creado

### Deployment
- [ ] Cuenta Render.com creada
- [ ] Repositorio conectado
- [ ] Blueprint aplicado (render.yaml)
- [ ] Servicios creados (backend, frontend, db, redis)
- [ ] Variables de entorno configuradas

### Post-Deployment
- [ ] Backend health check ✅
- [ ] Frontend carga correctamente ✅
- [ ] Login funciona ✅
- [ ] API calls funcionan (sin CORS errors) ✅
- [ ] WebSockets conectan ✅
- [ ] Database tiene datos de prueba ✅

### Configuración Final
- [ ] `CORS_ALLOWED_ORIGINS` actualizado con URL frontend
- [ ] `VITE_API_URL` apunta a backend
- [ ] `VITE_WS_URL` apunta a backend WebSocket
- [ ] Auto-deploy activado
- [ ] Notificaciones configuradas

---

## 📚 RECURSOS ADICIONALES

### Documentación Oficial
- [Render.com Docs](https://render.com/docs)
- [Django Deployment](https://docs.djangoproject.com/en/5.0/howto/deployment/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

### Soporte
- [Render.com Community](https://community.render.com/)
- [Render.com Status](https://status.render.com/)

### Contacto del Proyecto
- GitHub: [Tu repositorio]
- Email: [Tu email]

---

## ✅ ¡DEPLOYMENT EXITOSO!

Si llegaste hasta aquí y todos los checks pasaron, tu **Sistema de Gestión Ecuestre FEI** está funcionando en producción.

**URLs de tu aplicación:**
- 🌐 **Frontend:** `https://equestrian-frontend.onrender.com`
- 🔌 **Backend API:** `https://equestrian-backend.onrender.com`
- 🏥 **Health Check:** `https://equestrian-backend.onrender.com/api/health/`

**Usuarios de prueba:**
- 👑 **Admin:** `admin` / `admin123`
- 🏆 **Organizador:** `organizer1` / `org123`
- ⚖️ **Juez:** `judge1` / `judge123`

**Próximos pasos:**
1. Cambiar contraseñas de usuarios de prueba
2. Crear usuarios reales
3. Configurar dominio personalizado (opcional)
4. Considerar upgrade a plan Starter para producción real

---

**¡Felicitaciones! 🎉**

Tu sistema ecuestre FEI está desplegado y listo para competencias internacionales.
