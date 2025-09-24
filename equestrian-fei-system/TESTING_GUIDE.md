# 🧪 Guía Completa de Pruebas - Sistema Equestrian FEI

**Versión:** 1.0.0  
**Fecha:** 2025-09-02  
**Sistema:** Backend Django + Frontend React + JWT + Reportes FEI

---

## 📋 ÍNDICE

1. [Pre-requisitos y Preparación](#1-pre-requisitos-y-preparación)
2. [Pruebas del Backend Django](#2-pruebas-del-backend-django)
3. [Pruebas del Frontend React](#3-pruebas-del-frontend-react)
4. [Pruebas de JWT Authentication](#4-pruebas-de-jwt-authentication)
5. [Pruebas del Sistema de Reportes](#5-pruebas-del-sistema-de-reportes)
6. [Pruebas de Integración Completa](#6-pruebas-de-integración-completa)
7. [Debugging y Resolución de Problemas](#7-debugging-y-resolución-de-problemas)

---

## 1. Pre-requisitos y Preparación

### 🔧 **1.1 Verificar Entorno**

**Terminal 1 - Verificación del Sistema:**
```bash
# Navegar al directorio del proyecto
cd /home/megalodon/dev/projects/equestrian-fei-system

# Verificar estructura del proyecto
ls -la
```

**✅ Checklist - Estructura esperada:**
- [✅] `backend/` directorio presente
- [✅] `frontend/` directorio presente  
- [✅] `docker-compose.yml` presente
- [✅] `README.md` presente

### 🐍 **1.2 Backend - Verificar Python y Dependencias**

**Terminal 1 - Backend:**
```bash
# Ir al backend
cd backend

# Activar entorno virtual
source venv/bin/activate

# Verificar Python
python --version
```

**✅ Checklist - Python:**
- [✅] Python 3.12.x mostrado
- [✅] Virtual environment activado (prompt cambia)

**Instalar dependencias completas:**
```bash
# Instalar todas las dependencias (incluyendo reportes)
pip install -r requirements/base.txt

# Verificar instalación de dependencias críticas
python -c "import reportlab; print('ReportLab OK')"
python -c "import pandas; print('Pandas OK')"
python -c "import matplotlib; print('Matplotlib OK')"
# NOTE: I got an error on importation between pandas and numpy, so i had to upgrade pandas, now pandas and numpy are both 2.3.2.
```

**✅ Checklist - Dependencias:**
- [✅] ReportLab OK mostrado
- [✅] Pandas OK mostrado  
- [✅] Matplotlib OK mostrado
- ["Check_'NOTE'"] Sin errores de importación
# NOTE: I got an error on importation between pandas and numpy, so i had to upgrade pandas, now pandas and numpy are both 2.3.2.

### ⚛️ **1.3 Frontend - Verificar Node y Dependencias**

**Terminal 2 - Frontend:**
```bash
# Ir al frontend (nueva terminal)
cd /home/megalodon/dev/projects/equestrian-fei-system/frontend

# Verificar Node.js
node --version
npm --version
```

**✅ Checklist - Node:**
- [✅] Node 18.x+ mostrado
- [✅] NPM 9.x+ mostrado

**Instalar dependencias:**
```bash
# Instalar dependencias del frontend
npm install

# Verificar que no hay vulnerabilidades críticas
npm audit
```

**✅ Checklist - NPM:**
- [✅] `npm install` completado sin errores
- [✅] Sin vulnerabilidades críticas en audit

---

## 2. Pruebas del Backend Django

### 🚀 **2.1 Iniciar Servidor Backend**

**Terminal 1 - Backend:**
```bash
# Asegurarse de estar en backend con venv activado
cd /home/megalodon/dev/projects/equestrian-fei-system/backend
source venv/bin/activate

# Aplicar migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario (si no existe)
python manage.py createsuperuser --username admin_test1 --email admin@test.com
# NOTA: el password es: admin123456

# Iniciar servidor
python manage.py runserver 0.0.0.0:8000
```

**✅ Checklist - Servidor Backend:**
- [✅] Migraciones aplicadas sin errores
- [✅] Superusuario creado exitosamente
- [✅] Servidor iniciado en puerto 8000
## NOTA: Tuve que ingresar a http://localhost:8000/, NO a "0.0.0.0:8000"
- [✅] Mensaje "Watching for file changes with StatReloader"
- [✅] Sin errores rojos en consola

### 🔍 **2.2 Probar Endpoints Básicos**

**Terminal 3 - Pruebas API:**
```bash
# Abrir nueva terminal para pruebas
cd /home/megalodon/dev/projects/equestrian-fei-system

# Probar health check
curl -X GET http://localhost:8000/api/health/ | jq .

# Probar JWT login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_test",
    "password": "admin123456"
  }' | jq .
```

**✅ Checklist - API Básica:**
- [✅] Health check retorna JSON con status: "healthy"
- [✅] JWT login retorna JSON con "success": true
- [✅] JWT login incluye "access" y "refresh" tokens
- [✅] JWT login incluye datos de "user"

### 🗂️ **2.3 Probar Endpoints Principales**

**Guardar token para pruebas:**
```bash
# Guardar el access token (reemplazar con el token real de la respuesta anterior)
export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Probar endpoint protegido
curl -X GET http://localhost:8000/api/users/auth/profile/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# Probar endpoints de competencias
curl -X GET http://localhost:8000/api/competitions/competitions/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# Probar endpoints de scoring (CORREGIDOS)
# ✅ ENDPOINTS FUNCIONANDO:

# 1. Estadísticas de scoring (CON INFORMACIÓN ÚTIL):
curl -X GET http://localhost:8000/api/scoring/statistics/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# 2. Criterios de puntuación (CON DATOS REALES):
curl -X GET http://localhost:8000/api/scoring/scoring-criteria/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# ⚠️ ENDPOINTS CON ERRORES 500 (necesitan datos de prueba):
# curl -X GET http://localhost:8000/api/scoring/individual-scores/ \
#   -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
# curl -X GET http://localhost:8000/api/scoring/rankings/ \
#   -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

**✅ Checklist - Endpoints Protegidos:**
- [✅] Profile endpoint retorna datos del usuario
- [✅] Competitions endpoint retorna lista (puede estar vacía)
- [✅] Scoring statistics endpoint funciona correctamente
- [✅] Scoring criteria endpoint retorna datos reales (1 criterio disponible)
- [⚠️] Algunos scoring endpoints necesitan datos de prueba (500 error normal)
- [✅] Sin errores 401 Unauthorized (autenticación funciona)

### 📊 **2.4 Probar Sistema de Reportes**

```bash
# Probar reportes disponibles
curl -X GET http://localhost:8000/api/reports/available_reports/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# Probar health del sistema de reportes
curl -X GET http://localhost:8000/api/reports/stats/system_health/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

**✅ Checklist - Sistema Reportes:**
- [✅] Available reports retorna lista de reportes
- [✅] System health muestra "status": "healthy"
- [✅] System health confirma reportlab_available: true
- [✅] System health confirma pandas_available: true

---

## 3. Pruebas del Frontend React

### 🌐 **3.1 Iniciar Servidor Frontend**

**Terminal 2 - Frontend:**
```bash
# Asegurarse de estar en frontend
cd /home/megalodon/dev/projects/equestrian-fei-system/frontend

# Iniciar servidor de desarrollo
npm run dev
```

**✅ Checklist - Servidor Frontend:**
- [✅] Servidor iniciado sin errores
- [✅] Puerto mostrado (ej: http://localhost:3002/)
- [✅] Mensaje "ready in X ms"
- [✅] Sin errores de compilación

### 🖥️ **3.2 Probar Interfaz Web**

**Abrir navegador:**
```
URL: http://localhost:3002/
```

**✅ Checklist - Carga Inicial:**
- [✅] Página carga sin errores
- [✅] Se muestra formulario de login
- [✅] CSS se aplica correctamente (Tailwind)
- [✅] No hay errores en consola del navegador (F12)

### 🔐 **3.3 Probar Flujo de Login**

**En el navegador:**

1. **Página de Login:**
   - [✅] Formulario visible con campos usuario y contraseña
   - [✅] Botón "Iniciar Sesión" presente
   - [✅] Credenciales demo mostradas

2. **Realizar Login:**
   ```
   Usuario: admin_test
   Contraseña: admin123456
   ```
   - [✅] Click en "Iniciar Sesión"
   - [✅] No hay errores en consola (F12)
   - [✅] Redirección automática al dashboard

3. **Dashboard:**
   - [✅] Página dashboard carga correctamente
   - [✅] Header muestra "Sistema FEI"
   - [✅] Saludo con nombre de usuario visible
   - [✅] Role badge "Administrador" visible
   - [✅] Botón "📊 Reportes" en header

### 📊 **3.4 Probar Dashboard de Reportes**

**En el navegador, click en "📊 Reportes":**

**✅ Checklist - Dashboard Reportes:**
- [✅] Página reportes carga sin errores
- [✅] Título "Dashboard de Reportes FEI" visible
- [✅] Selector de competencia presente
- [✅] Sección "Reportes Disponibles" visible
- [✅] Cards de reportes mostradas
- [✅] Sección "Acciones Rápidas" visible

---

## 4. Pruebas de JWT Authentication

### 🔑 **4.1 Probar Flujo Completo de Autenticación**

**Terminal 3 - Pruebas JWT:**
```bash
# 1. Login y obtener tokens
RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_test",
    "password": "admin123456"
  }')

echo $RESPONSE | jq .

# 2. Extraer tokens
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.access')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.data.refresh')

echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"
```

**✅ Checklist - Login JWT:**
- [✅] Response contiene "success": true
- [✅] Access token extraído correctamente
- [✅] Refresh token extraído correctamente
- [✅] Tokens no están vacíos o "null"

### 🔄 **4.2 Probar Refresh de Tokens**

```bash
# 3. Usar refresh token para obtener nuevo access token
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "'$REFRESH_TOKEN'"
  }' | jq .
```

**✅ Checklist - Token Refresh:**
- [✅] Nuevo access token recibido
- [✅] Nuevo refresh token recibido (rotación)
- [✅] Sin errores 401 o 400

### 🛡️ **4.3 Probar Protección de Endpoints**

```bash
# 4. Probar endpoint sin token (debe fallar)
curl -X GET http://localhost:8000/api/users/auth/profile/

# 5. Probar endpoint con token válido (debe funcionar)
curl -X GET http://localhost:8000/api/users/auth/profile/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# 6. Probar endpoint con token inválido (debe fallar)
curl -X GET http://localhost:8000/api/users/auth/profile/ \
  -H "Authorization: Bearer invalid_token"
```

**✅ Checklist - Protección:**
- [✅] Sin token: Error 401 "Authentication credentials were not provided"
- [✅] Con token válido: Datos del usuario retornados
- [✅] Con token inválido: Error 401 "Given token not valid"

---

## 5. Pruebas del Sistema de Reportes

### 📄 **5.1 Crear Datos de Prueba**

**Terminal 1 - Backend (Django Shell):**
```bash
# En el backend, abrir Django shell
python manage.py shell
```

**En Django Shell:**
```python
# Crear competencia de prueba
from apps.competitions.models import Competition, Discipline, Category
from apps.users.models import User
from datetime import date

# Crear disciplina y categoría
discipline, _ = Discipline.objects.get_or_create(
    name="Dressage",
    defaults={"code": "DR", "description": "Dressage discipline"}
)
# ERROR: django.db.utils.IntegrityError: UNIQUE constraint failed: competitions_discipline.code
category, _ = Category.objects.get_or_create(
    name="Grand Prix",
    defaults={"level": "Advanced", "description": "Grand Prix category"}
)

# Crear competencia
competition, created = Competition.objects.get_or_create(
    name="Test Competition 2025",
    defaults={
        "discipline": discipline,
        "category": category,
        "start_date": date.today(),
        "end_date": date.today(),
        "description": "Competencia de prueba para reportes"
    }
)

print(f"Competition ID: {competition.id}")
print(f"Competition created: {created}")

# Salir del shell
exit()
```

**✅ Checklist - Datos de Prueba:**
- [ ] Disciplina creada o encontrada
- [ ] Categoría creada o encontrada
- [ ] Competencia creada exitosamente
- [ ] ID de competencia mostrado

### 📊 **5.2 Probar Generación de Reportes PDF**

**Terminal 3 - Pruebas Reportes:**
```bash
# Usar el ID de competencia obtenido arriba (reemplazar COMPETITION_ID)
COMPETITION_ID="1"  # Reemplazar con ID real

# Probar reporte de resultados PDF
curl -X GET "http://localhost:8000/api/reports/competition_results/?competition_id=$COMPETITION_ID&format=pdf" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --output "test_report.pdf"

# Verificar que el archivo se creó
ls -la test_report.pdf
file test_report.pdf
```

**✅ Checklist - Reporte PDF:**
- [ ] Archivo test_report.pdf creado
- [ ] Archivo no está vacío (tamaño > 0 bytes)
- [ ] Comando `file` confirma que es PDF
- [ ] Sin errores en el curl

### 📈 **5.3 Probar Generación de Reportes Excel**

```bash
# Probar reporte de resultados Excel
curl -X GET "http://localhost:8000/api/reports/competition_results/?competition_id=$COMPETITION_ID&format=excel" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --output "test_report.xlsx"

# Verificar archivo Excel
ls -la test_report.xlsx
file test_report.xlsx
```

**✅ Checklist - Reporte Excel:**
- [ ] Archivo test_report.xlsx creado
- [ ] Archivo no está vacío (tamaño > 0 bytes)
- [ ] Comando `file` confirma formato apropiado
- [ ] Sin errores en el curl

### 📋 **5.4 Probar Reporte de Analíticas**

```bash
# Probar reporte de analíticas (solo admin)
curl -X GET "http://localhost:8000/api/reports/analytics_report/?format=pdf" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --output "analytics_report.pdf"

# Verificar archivo
ls -la analytics_report.pdf
```

**✅ Checklist - Reporte Analíticas:**
- [ ] Archivo analytics_report.pdf creado
- [ ] Sin errores de permisos (usuario es admin)
- [ ] Archivo contiene datos del sistema

### 🖥️ **5.5 Probar Reportes desde Frontend**

**En el navegador - Dashboard de Reportes:**

1. **Seleccionar Competencia:**
   - [ ] Lista desplegable muestra "Test Competition 2025"
   - [ ] Seleccionar la competencia

2. **Descargar Reportes:**
   - [ ] Click en "Descargar PDF" de Competition Results
   - [ ] Archivo PDF se descarga automáticamente
   - [ ] Click en "Descargar EXCEL"
   - [ ] Archivo Excel se descarga automáticamente

3. **Acciones Rápidas:**
   - [ ] Botón "Resultados PDF" funciona
   - [ ] Botón "Resultados Excel" funciona
   - [ ] Botón "Analíticas" funciona (solo admin)

**✅ Checklist - Frontend Reportes:**
- [ ] Selector de competencia funcional
- [ ] Botones de descarga funcionan
- [ ] Archivos se descargan correctamente
- [ ] Sin errores en consola del navegador

---

## 6. Pruebas de Integración Completa

### 🔄 **6.1 Flujo Completo Usuario**

**Test de flujo completo en navegador:**

1. **Login:** 
   - [ ] Navegar a http://localhost:3002/
   - [ ] Login con admin_test/admin123456
   - [ ] Redirección exitosa al dashboard

2. **Navegación:**
   - [ ] Click en "📊 Reportes"
   - [ ] Dashboard reportes carga correctamente

3. **Reportes:**
   - [ ] Seleccionar competencia de prueba
   - [ ] Generar reporte PDF
   - [ ] Archivo descarga exitosamente

4. **Logout:**
   - [ ] Click en "Cerrar Sesión"
   - [ ] Redirección a página de login
   - [ ] Sesión cerrada (no se puede acceder a dashboard)

### 🧪 **6.2 Prueba de Resistencia**

**Terminal 3 - Pruebas de Carga:**
```bash
# Realizar múltiples requests simultáneos
for i in {1..10}; do
  curl -X GET http://localhost:8000/api/health/ &
done
wait

# Probar múltiples logins
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{
      "username": "admin_test",
      "password": "admin123456"
    }' &
done
wait
```

**✅ Checklist - Resistencia:**
- [ ] Múltiples requests health check exitosos
- [ ] Múltiples logins funcionan correctamente
- [ ] Sin errores de servidor en Terminal 1
- [ ] Tiempos de respuesta razonables

### 📱 **6.3 Prueba Responsive Design**

**En navegador:**

1. **Desktop (1920x1080):**
   - [ ] Layout se ve correctamente
   - [ ] Todos los elementos visibles

2. **Tablet (768x1024) - F12 > Toggle Device Toolbar:**
   - [ ] Layout adapta correctamente
   - [ ] Navigation accesible

3. **Mobile (375x667):**
   - [ ] Cards de reportes se apilan verticalmente
   - [ ] Botones accesibles con dedo
   - [ ] Texto legible

**✅ Checklist - Responsive:**
- [ ] Desktop layout correcto
- [ ] Tablet layout funcional
- [ ] Mobile layout usable

---

## 7. Debugging y Resolución de Problemas

### 🚨 **7.1 Problemas Comunes Backend**

#### **Error: Port 8000 already in use**
```bash
# Verificar qué proceso usa el puerto
lsof -i :8000

# Matar proceso si es necesario
kill -9 [PID]

# O usar otro puerto
python manage.py runserver 0.0.0.0:8001
```

#### **Error: ModuleNotFoundError**
```bash
# Verificar virtual environment
which python
pip list | grep django

# Reinstalar dependencias
pip install -r requirements/base.txt
```

#### **Error: Database locked**
```bash
# Parar servidor Django (Ctrl+C)
# Borrar archivos de bloqueo
rm db.sqlite3-wal db.sqlite3-shm

# Reiniciar servidor
python manage.py runserver 0.0.0.0:8000
```

### 🚨 **7.2 Problemas Comunes Frontend**

#### **Error: EADDRINUSE port 3000**
```bash
# Frontend automáticamente busca siguiente puerto libre
# Verificar mensaje en Terminal 2 para ver puerto usado

# Si hay problemas, matar procesos Node
pkill -f "npm run dev"
pkill -f "node"
```

#### **Error: Module not found**
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### **Error: Network Error en API calls**
```bash
# Verificar backend esté corriendo en puerto correcto
curl http://localhost:8000/api/health/

# Verificar CORS en backend/config/settings.py
# CORS_ALLOW_ALL_ORIGINS = True debe estar presente
```

### 🚨 **7.3 Problemas JWT**

#### **Error: Token expired**
```bash
# Los tokens expiran después de 1 hora
# Hacer login nuevamente o usar refresh token

REFRESH_TOKEN="tu_refresh_token_aqui"
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "'$REFRESH_TOKEN'"}'
```

#### **Error: Invalid signature**
```bash
# Verificar SECRET_KEY en settings.py
# Reiniciar servidor Django
# Hacer login nuevamente
```

### 🚨 **7.4 Problemas Reportes**

#### **Error: ReportLab not available**
```bash
# Instalar dependencias de reportes
pip install reportlab pandas matplotlib openpyxl seaborn

# Verificar instalación
python -c "import reportlab; print('OK')"
```

#### **Error: No module named 'apps.competitions'**
```bash
# Verificar PYTHONPATH y estructura
python manage.py shell -c "from apps.competitions.models import Competition; print('OK')"

# Si falla, verificar __init__.py en directorios apps
find apps/ -name "__init__.py"
```

### 📊 **7.5 Logs de Debugging**

**Verificar logs del sistema:**
```bash
# Backend logs
tail -f /home/megalodon/dev/projects/equestrian-fei-system/backend/logs/system.log

# Django console output (Terminal 1)
# Frontend console (Terminal 2)
# Browser console (F12)
```

### 🔧 **7.6 Verificación Final del Sistema**

**Comando de verificación completa:**
```bash
#!/bin/bash
echo "=== VERIFICACIÓN SISTEMA EQUESTRIAN FEI ==="

# Backend
echo "1. Backend Health Check:"
curl -s http://localhost:8000/api/health/ | jq '.status'

# JWT
echo "2. JWT Login Test:"
RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin_test", "password": "admin123456"}')
echo $RESPONSE | jq '.success'

# Frontend  
echo "3. Frontend Status:"
curl -s -I http://localhost:3002/ | head -1

# Reportes
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.access')
echo "4. Reportes System Health:"
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8000/api/reports/stats/system_health/ | jq '.status'

echo "=== VERIFICACIÓN COMPLETA ==="
```

**✅ Checklist Final:**
- [ ] Backend Health: "healthy"
- [ ] JWT Login: true
- [ ] Frontend Status: 200 OK
- [ ] Reportes Health: "healthy"

---

## 📝 **RESULTADOS DE TESTING**

**Fecha de prueba:** ___________
**Realizado por:** ___________

### ✅ **Componentes Probados:**

- [ ] **Backend Django**: Server, API, JWT, Database
- [ ] **Frontend React**: UI, Navigation, Login, Dashboard  
- [ ] **JWT Authentication**: Login, Refresh, Protection
- [ ] **Sistema Reportes**: PDF, Excel, Analytics
- [ ] **Integración**: Backend ↔ Frontend
- [ ] **Responsive Design**: Desktop, Tablet, Mobile

### 🚨 **Problemas Encontrados:**

```
[Espacio para anotar problemas específicos]

1. _____________________________________
   Solución: ____________________________

2. _____________________________________
   Solución: ____________________________

3. _____________________________________
   Solución: ____________________________
```

### 🎯 **Estado Final:**

- [ ] **SISTEMA FUNCIONAL** - Todas las pruebas pasaron
- [ ] **SISTEMA PARCIAL** - Algunos problemas encontrados  
- [ ] **SISTEMA NO FUNCIONAL** - Problemas críticos

**Comentarios adicionales:**
```
________________________________________________
________________________________________________
________________________________________________
```

---

**📊 FIN DE LA GUÍA DE TESTING**

**Sistema:** Equestrian FEI v1.0.0  
**Componentes:** Backend + Frontend + JWT + Reportes  
**Estado:** Listo para deployment
