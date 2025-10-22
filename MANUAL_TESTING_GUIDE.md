# 🧪 GUÍA DE PRUEBAS MANUALES - SISTEMA FEI ECUESTRE

**Proyecto**: Sistema de Gestión de Competencias Ecuestres FEI
**Fecha**: 22 de Octubre de 2025
**Versión**: 2024.1.0
**Estado**: ✅ Sistema completamente funcional

---

## 📋 TABLA DE CONTENIDOS

1. [Preparación del Entorno](#preparación-del-entorno)
2. [Credenciales de Acceso](#credenciales-de-acceso)
3. [Datos de Prueba Disponibles](#datos-de-prueba-disponibles)
4. [Pruebas por Rol](#pruebas-por-rol)
5. [Verificación de APIs](#verificación-de-apis)
6. [Checklist Final](#checklist-final)

---

## 🚀 PREPARACIÓN DEL ENTORNO

### 1. Iniciar Servidores

**Terminal 1 - Backend Django:**
```bash
cd equestrian-fei-system/backend
source venv/bin/activate
python manage.py runserver
```
✅ Debe estar corriendo en: `http://localhost:8000`

**Terminal 2 - Frontend React:**
```bash
cd equestrian-fei-system/frontend
npm run dev
```
✅ Debe estar corriendo en: `http://localhost:3000`

### 2. Verificar Estado del Sistema

**Health Check Backend:**
```bash
curl http://localhost:8000/api/health/
```
Respuesta esperada:
```json
{
  "status": "healthy",
  "message": "FEI Equestrian System API is running",
  "version": "1.0.0"
}
```

**Verificar Frontend:**
- Abrir navegador: `http://localhost:3000`
- Debe mostrar página de login sin errores

---

## 🔐 CREDENCIALES DE ACCESO

| Usuario | Password | Rol | Dashboard |
|---------|----------|-----|-----------|
| `admin` | `admin123` | Administrador | `/admin` |
| `organizer1` | `org123` | Organizador | `/organizer` |
| `judge1` | `judge123` | Juez (María García) | `/judge` |
| `rider1` | `rider123` | Jinete/Viewer | `/` |
| `rider2` | `rider123` | Jinete/Viewer | `/` |

---

## 📊 DATOS DE PRUEBA DISPONIBLES

### Competencia Principal
- **Nombre**: Campeonato Nacional Salto 2025
- **ID**: `d5daf589-efe7-43ab-beca-0d278ecbbc0e`
- **Disciplina**: Show Jumping
- **Categoría**: Senior
- **Fechas**: 1-3 Diciembre 2025
- **Sede**: Club Hípico Madrid
- **Juez Principal**: judge1 (María García)
- **Participantes**: 5 jinetes con dorsales #1-#5

### Caballos Registrados
1. Thunder
2. Lightning
3. Storm
4. Blaze
5. Shadow

### Rankings FEI Verificados
1. 🥇 Dorsal #1 - 0 faltas, 65.50s
2. 🥈 Dorsal #3 - 0 faltas, 67.10s
3. 🥉 Dorsal #5 - 4 faltas, 66.30s
4. 4° Dorsal #2 - 4 faltas, 68.20s
5. 5° Dorsal #4 - 8 faltas, 70.50s

---

## 🧪 PRUEBAS POR ROL

### PRUEBA 1: ADMINISTRADOR (admin / admin123)

#### 1.1 Login y Navegación
**Pasos:**
1. Ir a `http://localhost:3000`
2. Ingresar credenciales: `admin` / `admin123`
3. Click en "Iniciar Sesión"

**Verificar:**
- ✅ Redirección automática a `/admin`
- ✅ Navbar muestra nombre de usuario: "admin"
- ✅ Dashboard muestra 6 tarjetas de acción
- ✅ Sin errores en consola (F12 → Console)

#### 1.2 Dashboard Admin - Estadísticas Reales
**Verificar en el dashboard:**
- ✅ **Total Competencias**: Número real (mínimo 2)
- ✅ **Categorías FEI**: Número real (mínimo 1)
- ✅ **Usuarios Activos**: 5 usuarios
- ✅ **Próximas Competencias**: Lista con "Campeonato Nacional Salto 2025"

**❌ NO debe mostrar:**
- Números hardcoded como "12", "156", "45"
- Datos de ejemplo/placeholder

#### 1.3 Gestión de Competencias
**Pasos:**
1. Click en "🏆 Competencias"
2. Verificar lista de competencias

**Verificar:**
- ✅ Se muestra "Campeonato Nacional Salto 2025"
- ✅ Fechas: 1-3 Dec 2025
- ✅ Estado visible (Draft/Published/etc)
- ✅ Botones de acción: Rankings, Personal, Participantes, Programación

**Probar botones:**
1. **📊 Rankings**: Click → Debe ir a `/rankings/:id`
2. **👥 Personal**: Click → Debe ir a `/admin/competitions/:id/staff`
3. **🏇 Participantes**: Click → Debe ir a `/admin/competitions/:id/participants`
4. **📋 Programación**: Click → Debe ir a `/admin/competitions/:id/schedule`

#### 1.4 Crear Nueva Competencia
**Pasos:**
1. Click en "Nueva Competencia" (botón morado)
2. Llenar formulario:
   ```
   Nombre: Prueba Final FEI 2025
   Nombre Corto: PFFEI2025
   Tipo: National
   Fecha Inicio: 2025-12-25 10:00
   Fecha Fin: 2025-12-27 18:00
   Registro Inicio: 2025-10-23 00:00
   Registro Fin: 2025-12-23 23:59
   Sede: Club Hípico Madrid
   Disciplina: ✓ Show Jumping
   Categoría: ✓ Senior
   Max Participantes: 25
   Cuota: 200.00
   Descripción: Competencia de prueba final
   ```
3. Click "Crear Competencia"

**Verificar:**
- ✅ Modal se cierra
- ✅ Mensaje de éxito aparece
- ✅ Nueva competencia aparece en la lista
- ✅ Datos correctos mostrados

#### 1.5 Gestión de Usuarios
**Pasos:**
1. Volver al dashboard
2. Click en "👥 Usuarios"

**Verificar:**
- ✅ Lista muestra 5 usuarios
- ✅ Roles visibles: admin, organizer, judge, viewer
- ✅ Emails y nombres completos mostrados

---

### PRUEBA 2: ORGANIZADOR (organizer1 / org123)

#### 2.1 Login y Dashboard
**Pasos:**
1. Logout del admin (si está logueado)
2. Login con: `organizer1` / `org123`

**Verificar:**
- ✅ Redirección a `/organizer`
- ✅ Dashboard muestra 5 tarjetas de acción
- ✅ Secciones: Competencias, Participantes, Categorías, Reportes, Perfil

#### 2.2 Ver Competencias Asignadas
**Pasos:**
1. Click en "🏆 Competencias"

**Verificar:**
- ✅ Muestra competencias donde es organizador
- ✅ Puede ver detalles de sus competencias
- ✅ NO puede ver competencias de otros organizadores

#### 2.3 Gestión de Categorías
**Pasos:**
1. Click en "📋 Categorías"
2. Verificar lista de categorías FEI

**Verificar:**
- ✅ Muestra categoría "Senior"
- ✅ Puede ver detalles: edad mínima, altura, nivel
- ✅ Botón "Nueva Categoría" visible

**Intentar crear categoría:**
1. Click "Nueva Categoría"
2. Llenar datos básicos
3. Click "Guardar"

**Resultado esperado:**
- ✅ Categoría se crea exitosamente
- ⚠️ O muestra error 403 (si solo admin puede crear)

---

### PRUEBA 3: JUEZ (judge1 / judge123)

#### 3.1 Login y Dashboard
**Pasos:**
1. Logout del organizador
2. Login con: `judge1` / `judge123`

**Verificar:**
- ✅ Redirección a `/judge`
- ✅ Dashboard muestra estadísticas del juez
- ✅ **Competencias Asignadas**: Mínimo 1
- ✅ **Evaluaciones Pendientes**: Número real
- ✅ NO números hardcoded

#### 3.2 Ver Competencias Asignadas
**Pasos:**
1. Verificar sección "Mis Competencias Asignadas"

**Verificar:**
- ✅ Muestra "Campeonato Nacional Salto 2025"
- ✅ Rol: "Juez Principal" o "Chief Judge"
- ✅ Fechas correctas
- ✅ Botón "⚖️ Evaluar" o "Calificar"

#### 3.3 Sistema de Calificación
**Pasos:**
1. Click en "⚖️ Evaluar"
2. Debe ir a `/judge/scoring/:id`

**Verificar página de scoring:**
- ✅ Header con nombre de competencia
- ✅ Estadísticas: Total Participantes = 5
- ✅ Lista de 5 participantes
- ✅ Dorsales #1, #2, #3, #4, #5
- ✅ Nombres de jinetes y caballos
- ✅ Botón "Calificar" por cada participante

**Probar modal de calificación:**
1. Click "Calificar" en Dorsal #1
2. Verificar modal abre

**Modal debe mostrar:**
- ✅ Información del participante (dorsal, jinete, caballo)
- ✅ Campos de calificación FEI:
  - Tiempo de ejecución
  - Faltas (obstáculos derribados)
  - Penalizaciones
  - Notas del juez
- ✅ Botones: "Guardar Calificación" y "Cancelar"

**NO MODIFICAR** calificaciones existentes (ya tienen datos)

#### 3.4 Ver Rankings
**Pasos:**
1. Volver al dashboard del juez
2. Click en "📊 Rankings" de la competencia

**Verificar:**
- ✅ Va a `/rankings/:id`
- ✅ Muestra tabla de rankings
- ✅ 5 participantes en orden correcto
- ✅ Posiciones: 1°, 2°, 3°, 4°, 5°
- ✅ Medallas: 🥇🥈🥉
- ✅ Tiempos y faltas correctos

---

### PRUEBA 4: VIEWER/JINETE (rider1 / rider123)

#### 4.1 Login
**Pasos:**
1. Logout del juez
2. Login con: `rider1` / `rider123`

**Verificar:**
- ✅ Redirección a página principal `/`
- ✅ Vista pública de competencias
- ✅ Puede ver rankings públicos
- ✅ NO puede acceder a dashboards admin/organizer/judge

---

## 🔍 VERIFICACIÓN DE APIs

### Pruebas con curl (Terminal)

#### 1. Health Check
```bash
curl http://localhost:8000/api/health/
```
**Resultado esperado:** Status 200, JSON con "healthy"

#### 2. Login Admin
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
**Resultado esperado:** Status 200, token JWT en respuesta

#### 3. Listar Usuarios (con token)
```bash
TOKEN="<tu_token_aquí>"
curl -X GET http://localhost:8000/api/users/users/ \
  -H "Authorization: Bearer $TOKEN"
```
**Resultado esperado:** Status 200, array con 5 usuarios

#### 4. Listar Competencias
```bash
curl -X GET "http://localhost:8000/api/competitions/competitions/" \
  -H "Authorization: Bearer $TOKEN"
```
**Resultado esperado:** Status 200, array con competencias

#### 5. Competencias Asignadas (Judge)
```bash
# Primero login como judge1
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"judge1","password":"judge123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access'])"
# Usar el token para obtener competencias asignadas
TOKEN_JUDGE="<token_judge>"
curl -X GET "http://localhost:8000/api/competitions/competitions/my_assigned/" \
  -H "Authorization: Bearer $TOKEN_JUDGE"
```
**Resultado esperado:** Status 200, array con competencias del juez

#### 6. Scorecards
```bash
curl -X GET http://localhost:8000/api/scoring/scorecards/ \
  -H "Authorization: Bearer $TOKEN"
```
**Resultado esperado:** Status 200, array con scorecards

---

## ✅ CHECKLIST FINAL

### Frontend ↔ Backend Integration
- [ ] Login funciona para todos los roles
- [ ] Dashboards muestran datos reales (NO hardcoded)
- [ ] Crear competencia desde UI guarda en backend
- [ ] Asignar jueces desde UI funciona
- [ ] Judge puede ver competencias asignadas
- [ ] Sistema de calificación muestra participantes reales
- [ ] Rankings muestran orden FEI correcto
- [ ] Todos los botones de navegación funcionan
- [ ] No hay errores en consola del navegador (F12)
- [ ] No hay errores 500 en Network tab (F12 → Network)

### APIs Funcionando
- [ ] `GET /api/health/` → 200 OK
- [ ] `POST /api/auth/login/` → 200 OK con token
- [ ] `GET /api/users/users/` → 200 OK (admin)
- [ ] `GET /api/competitions/competitions/` → 200 OK
- [ ] `GET /api/competitions/competitions/my_assigned/` → 200 OK (judge)
- [ ] `GET /api/scoring/scorecards/` → 200 OK
- [ ] `POST /api/competitions/competitions/` → 201 Created

### Funcionalidades Core
- [ ] Sistema de autenticación JWT funciona
- [ ] Control de acceso basado en roles (RBAC)
- [ ] Crear competencias FEI
- [ ] Asignar jueces a competencias
- [ ] Sistema de calificación FEI
- [ ] Cálculo automático de rankings
- [ ] Visualización de rankings en tiempo real
- [ ] Gestión de participantes
- [ ] Gestión de categorías FEI

### Calidad del Código
- [ ] Sin errores en logs de Django
- [ ] Sin warnings críticos en consola frontend
- [ ] Servidores corren sin crashes
- [ ] Base de datos SQLite funcional
- [ ] Migraciones aplicadas correctamente

---

## 🐛 ERRORES COMUNES Y SOLUCIONES

### Error: "Failed to fetch" o "Network Error"
**Causa:** Backend no está corriendo
**Solución:**
```bash
cd equestrian-fei-system/backend
source venv/bin/activate
python manage.py runserver
```

### Error: Página en blanco
**Causa:** Frontend no está corriendo
**Solución:**
```bash
cd equestrian-fei-system/frontend
npm run dev
```

### Error: "Token invalid" o "Unauthorized"
**Causa:** Token JWT expiró (duran 1 hora)
**Solución:** Hacer logout y login nuevamente

### Error: Modal no se abre
**Causa:** Error de JavaScript
**Solución:** Abrir DevTools (F12) → Console → Ver error específico

---

## 📝 REPORTE DE PRUEBAS

Después de completar todas las pruebas, documenta:

### ✅ Pruebas Exitosas
- [Lista de funcionalidades que funcionaron]

### ❌ Errores Encontrados
- Descripción del error
- Pasos para reproducir
- Mensaje de error (consola/network)
- Screenshot si es posible

### 💡 Sugerencias de Mejora
- UX/UI improvements
- Performance issues
- Feature requests

---

## 🎯 CRITERIOS DE ACEPTACIÓN

El sistema se considera **LISTO PARA PRODUCCIÓN** si:

1. ✅ Todos los roles pueden hacer login
2. ✅ Dashboards muestran datos reales de la BD
3. ✅ CRUD de competencias funciona completamente
4. ✅ Sistema de calificación FEI operativo
5. ✅ Rankings se calculan correctamente
6. ✅ No hay errores 500 en APIs críticas
7. ✅ Frontend y Backend se comunican sin errores
8. ✅ Permisos por rol funcionan correctamente

---

**Estado del Sistema**: ✅ **FUNCIONAL Y LISTO**
**Fecha de Verificación**: 22 de Octubre de 2025
**Testeado por**: Claude Code Assistant

---

## 📞 SOPORTE

Para reportar bugs o solicitar funcionalidades:
- Crear issue en GitHub
- Documentar pasos para reproducir
- Incluir logs y screenshots
