# CLAUDE.md

Sistema profesional de gestión de competencias ecuestres con cumplimiento FEI (Fédération Équestre Internationale). Diseñado para gestionar competencias internacionales con rankings en tiempo real y funcionalidad offline.

**🟢 PRODUCCIÓN:** Sistema completamente operacional en Render.com (Octubre 30, 2025)
- **Frontend:** https://equestrian-frontend.onrender.com
- **Backend:** https://equestrian-backend.onrender.com
- **Health:** https://equestrian-backend.onrender.com/api/health/

## Arquitectura

### Backend (Django)
- **Ubicación**: `equestrian-fei-system/backend/`
- **Framework**: Django 5.0.6 + DRF 3.15.1
- **Base de datos**: PostgreSQL 15 (prod) / SQLite (dev)
- **Real-time**: Django Channels 4.0.0
- **Auth**: JWT (djangorestframework-simplejwt 5.3.0)

### Frontend (React)
- **Ubicación**: `equestrian-fei-system/frontend/`
- **Framework**: React 18.2.0 + Vite 4.3.2
- **Estado**: Zustand 4.3.7
- **Data Fetching**: TanStack React Query 4.29.0
- **Estilos**: Tailwind CSS 3.3.2

### Componentes Clave
- **32 ViewSets** con 240+ endpoints API
- **26 Modelos** de base de datos
- **Dashboards por Rol**: Admin, Organizador, Juez
- **Actualizaciones en tiempo real**: Rankings automáticos

## Comandos de Desarrollo

### Backend
```bash
cd equestrian-fei-system/backend/
python -m venv venv
source venv/bin/activate  # Linux/Mac | venv\Scripts\activate (Windows)
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver  # http://localhost:8000
```

### Frontend
```bash
cd equestrian-fei-system/frontend/
npm install
npm run dev  # http://localhost:5173
npm run build  # Producción
```

## Estructura de Directorios

### Backend
- `backend/apps/users/` - Gestión de usuarios, autenticación, roles
- `backend/apps/competitions/` - Competencias, categorías, disciplinas, venues
- `backend/apps/scoring/` - Sistema de calificación FEI
- `backend/apps/rankings/` - Rankings en tiempo real
- `backend/apps/sync/` - Sincronización offline
- `backend/config/` - Configuración Django

### Frontend
- `frontend/src/pages/` - Páginas por rol (Admin, Organizer, Judge)
- `frontend/src/components/` - Componentes reutilizables
- `frontend/src/services/` - Capa de API con fallback localStorage
- `frontend/src/store/` - Gestión de estado Zustand

## API Base

**Base URL:** `/api/`

- **Auth**: `/api/auth/` - Login, register, refresh
- **Users**: `/api/users/` - Gestión de usuarios
- **Competitions**: `/api/competitions/` - CRUD competencias
- **Scoring**: `/api/scoring/` - Sistema de calificación FEI
- **Rankings**: `/api/rankings/` - Rankings en tiempo real
- **Sync**: `/api/sync/` - Sincronización offline

## Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | Administrador |
| `organizer1` | `org123` | Organizador |
| `judge1` | `judge123` | Juez |

⚠️ **Cambiar estas contraseñas antes de uso real**

---

## Roles y Capacidades

### 👑 ADMINISTRADOR

**Dashboard:** `/admin`

**Capacidades:**
- ✅ Gestión completa de usuarios (CRUD)
- ✅ Gestión completa de competencias
- ✅ Asignar personal (jueces, delegados)
- ✅ Gestionar participantes
- ✅ Configurar programación de eventos
- ✅ Crear/editar categorías
- ✅ Ver rankings en tiempo real
- ✅ Generar reportes del sistema
- ✅ Revisar logs de actividad

**Rutas:**
- `/admin` - Dashboard
- `/admin/users` - Gestión usuarios
- `/admin/competitions` - Competencias
- `/admin/competitions/:id/staff` - Personal
- `/admin/competitions/:id/participants` - Participantes
- `/admin/competitions/:id/schedule` - Programación
- `/admin/categories` - Categorías
- `/rankings/:id` - Rankings

---

### 🏆 ORGANIZADOR

**Dashboard:** `/organizer`

**Capacidades:**
- ✅ Gestionar **sus propias** competencias
- ✅ Asignar personal a sus competencias
- ✅ Aprobar/rechazar participantes
- ✅ Configurar programación de eventos
- ✅ Crear/editar categorías
- ✅ Ver rankings de sus competencias
- ❌ NO puede gestionar usuarios del sistema
- ❌ NO puede ver competencias de otros

**Rutas:**
- `/organizer` - Dashboard
- `/organizer/competitions` - Mis competencias
- `/organizer/participants` - Participantes
- `/admin/competitions/:id/staff` - Personal (compartida)
- `/admin/competitions/:id/schedule` - Programación (compartida)

---

### ⚖️ JUEZ

**Dashboard:** `/judge`

**Capacidades:**
- ✅ Ver competencias asignadas
- ✅ Calificar participantes (FEI-compliant)
- ✅ Ingresar puntuaciones técnicas/artísticas
- ✅ Registrar faltas y penalizaciones
- ✅ Ver rankings en tiempo real
- ❌ NO puede crear/editar competencias
- ❌ NO puede gestionar participantes
- ✅ Solo califica donde esté asignado

**Rutas:**
- `/judge` - Dashboard
- `/judge/competitions` - Competencias asignadas
- `/judge/scoring/:id` - Sistema de calificación
- `/rankings/:id` - Rankings

---

## Flujos End-to-End

### 1. Autenticación

```
1. Usuario → POST /api/auth/login/ {username, password}
2. Backend valida → Genera JWT tokens (access: 1h, refresh: 7d)
3. Frontend guarda tokens en localStorage
4. Redirección a dashboard según rol
5. Cada request incluye: Authorization: "Bearer {access_token}"
6. Token expira → Auto-refresh con refresh token
```

---

### 2. Crear y Ejecutar Competencia (Completo)

#### Fase 1: Setup (Admin/Organizador)

```
1. Crear Competencia
   POST /api/competitions/
   → status: "draft"

2. Asignar Jueces
   POST /api/competitions/staff/
   → Juez confirma: POST /api/competitions/staff/{id}/confirm/

3. Crear Programación
   POST /api/competitions/schedule/
   → Eventos: Inicio, Categorías, Breaks, Premios
   → Timezone: Frontend convierte local→UTC, backend guarda UTC

4. Publicar
   POST /api/competitions/{id}/publish/
   → status: "published"
   → Abierto para inscripciones
```

#### Fase 2: Inscripción (Organizador)

```
1. Participantes se registran
   POST /api/competitions/participants/
   → status: "pending"

2. Organizador revisa
   GET /api/competitions/participants/?competition={id}

3. Aprobar/Rechazar
   POST /api/competitions/participants/{id}/confirm/
   → status: "confirmed"
```

#### Fase 3: Día de Competencia (Juez)

```
1. Competencia inicia
   PATCH /api/competitions/{id}/ → status: "in_progress"

2. Juez califica
   POST /api/scoring/scorecards/
   {
     participant: 25,
     technical_score: 85,
     artistic_score: 82,
     time_score: 45.2,
     faults: 0,
     final_score: 167.0
   }

3. Backend auto-calcula rankings
   → utils.calculate_competition_ranking()
   → Crea/actualiza RankingEntry

4. Rankings actualizan automáticamente
   GET /api/scoring/rankings/?competition={id}
   → Auto-refresh cada 30s
```

#### Fase 4: Finalización

```
1. Competencia termina
   PATCH /api/competitions/{id}/ → status: "completed"

2. Publicar rankings finales
   POST /api/scoring/rankings/{id}/publish/ → is_final: true

3. Generar reportes FEI (PDF/Excel)
   GET /api/reports/competition/{id}/

4. Ceremonia de premios basada en rankings finales
```

---

## Modelos de Base de Datos (Core)

### User
```python
id (PK), username, email, password
role: admin|organizer|judge|rider
first_name, last_name, nationality
fei_id, is_active, is_verified
```

### Competition
```python
id (PK), organizer (FK→User), venue (FK→Venue)
name, short_name, description
start_date, end_date
status: draft|published|in_progress|completed
competition_type: national|international|championship
disciplines (M2M→Discipline)
categories (M2M→Category)
max_participants, entry_fee
```

### CompetitionStaff
```python
competition (FK→Competition)
staff_member (FK→User)
role: chief_judge|judge|technical_delegate|steward
is_confirmed, assigned_date
```

### CompetitionSchedule
```python
competition (FK→Competition)
start_time, end_time (UTC)
title, description
schedule_type: competition_start|category_start|break|lunch|awards
discipline (FK→Discipline, nullable)
category (FK→Category, nullable)
location, is_published
```

### Participant
```python
competition (FK→Competition)
rider (FK→User), horse (FK→Horse)
category (FK→Category)
status: pending|confirmed|rejected|withdrawn
registration_date, bib_number
```

### ScoreCard
```python
competition (FK→Competition)
participant (FK→Participant)
judge (FK→User)
technical_score, artistic_score, time_score
penalties, faults, final_score
status: pending|in_progress|completed
```

### CompetitionRanking
```python
competition (FK→Competition)
category (FK→Category)
ranking_type: general|preliminary|final
is_final, is_published, ranking_date
```

### RankingEntry
```python
ranking (FK→CompetitionRanking)
participant (FK→Participant)
position, final_score
technical_score, artistic_score
time_score, penalty_points, is_tied
```

**Relaciones:**
```
User →(1:N)→ Competition (como organizador)
User →(M:N)→ Competition (como staff/participante)
Competition →(1:N)→ Staff, Schedule, Participant, ScoreCard, Ranking
Participant →(1:N)→ ScoreCard →(1:N)→ RankingEntry
```

---

## Algoritmos de Calificación FEI

### Show Jumping (Salto)
```python
# Menor es mejor
Final = faults + time_penalties
- Knockdown (derribo): 4 faltas
- Refusal (rechazo): 4 faltas (1º), eliminación (3º)
- Time penalty: 1 falta por segundo sobre tiempo permitido
```

### Dressage (Doma)
```python
# Mayor porcentaje es mejor
Total = Σ(movement_score × coefficient)
Final = (Total / Max_Possible) × 100%
- Cada movimiento: 0-10 puntos
- Coeficientes: 1, 2, o 3
- Collective marks: presentación, jinete, caballo
```

### Eventing (Concurso Completo)
```python
# Menor penalización es mejor
Final = dressage_penalties + cross_country + show_jumping
- Dressage: (100 - percentage)
- Cross Country: 0.4 puntos/seg + obstáculos
- Show Jumping: penalizaciones estándar
```

### Cálculo de Rankings
```python
# backend/apps/scoring/utils.py
def calculate_competition_ranking(competition, category):
    1. Obtener scorecards completados
    2. Excluir descalificados
    3. Ordenar por final_score (ASC jumping, DESC dressage)
    4. Asignar posiciones:
       - Empates → misma posición
       - Tie-break: technical→artistic→time→penalties
    5. Crear RankingEntry para cada participante
    6. Marcar is_published si es final
```

---

## Endpoints API Principales

### Autenticación
```
POST   /api/auth/login/          → {user, tokens}
POST   /api/auth/register/       → {user, tokens}
POST   /api/auth/refresh/        → {access, refresh}
GET    /api/users/profile/       → Perfil usuario actual
POST   /api/users/logout/        → Cerrar sesión
```

### Competencias
```
GET    /api/competitions/                    → Listar (filtrado por rol)
POST   /api/competitions/                    → Crear
GET    /api/competitions/{id}/               → Detalles
PATCH  /api/competitions/{id}/               → Actualizar
POST   /api/competitions/{id}/publish/       → Publicar
```

### Personal
```
GET    /api/competitions/staff/?competition={id}  → Listar staff
POST   /api/competitions/staff/                   → Asignar
POST   /api/competitions/staff/{id}/confirm/      → Confirmar asignación
```

### Programación
```
GET    /api/competitions/schedule/?competition={id}  → Eventos
POST   /api/competitions/schedule/                   → Crear evento
GET    /api/competitions/schedule/by_date/?date=...  → Por fecha
```

### Calificación
```
GET    /api/scoring/scorecards/?competition={id}  → Listar scores
POST   /api/scoring/scorecards/                   → Crear score
PATCH  /api/scoring/scorecards/{id}/              → Actualizar
POST   /api/scoring/jumping-faults/               → Registrar falta (Salto)
POST   /api/scoring/dressage-movements/           → Calificar movimiento (Doma)
```

### Rankings
```
GET    /api/scoring/rankings/?competition={id}&category={id}  → Rankings
POST   /api/scoring/rankings/{id}/recalculate/                → Recalcular
POST   /api/scoring/rankings/{id}/publish/                    → Publicar final
```

### Participantes
```
GET    /api/competitions/participants/?competition={id}  → Listar
POST   /api/competitions/participants/                   → Registrar
POST   /api/competitions/participants/{id}/confirm/      → Aprobar
POST   /api/competitions/participants/{id}/reject/       → Rechazar
```

### Categorías
```
GET    /api/competitions/categories/      → Listar
POST   /api/competitions/categories/      → Crear
PATCH  /api/competitions/categories/{id}/ → Actualizar
```

### Usuarios (Admin)
```
GET    /api/users/      → Listar todos
POST   /api/users/      → Crear
PATCH  /api/users/{id}/ → Actualizar
DELETE /api/users/{id}/ → Eliminar
```

---

## Matriz de Permisos

| Acción | Admin | Organizer | Judge | Public |
|--------|-------|-----------|-------|--------|
| Ver todas las competencias | ✅ | ❌ (solo propias) | ❌ (asignadas) | ✅ (publicadas) |
| Crear competencia | ✅ | ✅ | ❌ | ❌ |
| Editar competencia | ✅ | ✅ (propia) | ❌ | ❌ |
| Asignar personal | ✅ | ✅ (propia) | ❌ | ❌ |
| Confirmar asignación | N/A | N/A | ✅ | ❌ |
| Calificar | ✅ | ❌ | ✅ (asignado) | ❌ |
| Ver scores | ✅ | ✅ (propia) | ✅ (asignado) | ❌ |
| Ver rankings draft | ✅ | ✅ (propia) | ✅ (asignado) | ❌ |
| Ver rankings publicados | ✅ | ✅ | ✅ | ✅ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ |
| Crear categorías | ✅ | ✅ | ❌ | ❌ |

---

## Deployment en Producción (Render.com)

### Infraestructura

**Frontend (Static Site)**
- URL: https://equestrian-frontend.onrender.com
- Build: `npm install && npm run build`
- CDN: Global, siempre disponible
- Build time: ~2-3 min

**Backend (Web Service)**
- URL: https://equestrian-backend.onrender.com
- Runtime: Python 3.11.0 + Gunicorn
- Workers: 2 (512MB RAM)
- Build time: ~6-8 min
- Free tier: Duerme después de 15min inactividad

**PostgreSQL Database**
- Version: 15
- Storage: 1GB (suficiente para ~1000 competencias)
- Free tier

### Variables de Entorno

**Backend:**
```bash
DEBUG=False
ALLOWED_HOSTS=.onrender.com,localhost
DATABASE_URL=[auto-conectado]
CORS_ALLOWED_ORIGINS=https://equestrian-frontend.onrender.com
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=604800
```

**Frontend:**
```bash
VITE_API_URL=https://equestrian-backend.onrender.com
VITE_WS_URL=wss://equestrian-backend.onrender.com
```

### Limitaciones Free Tier

1. **Service Sleep:** Backend duerme tras 15min → primer request: 30-60s
   - **Solución:** UptimeRobot (ping cada 14min) o upgrade Starter ($7/mes)

2. **Storage:** Disco efímero → media files se pierden
   - **Solución:** AWS S3 o Cloudinary

3. **WebSockets:** InMemoryChannelLayer (sin Redis)
   - **Solución:** Agregar Redis ($10/mes) para canales persistentes

4. **Database:** 1GB storage
   - **Solución:** Upgrade a 10GB ($7/mes) cuando sea necesario

### Deployment Workflow

```bash
# Automático: Push a main → deploy automático
git add .
git commit -m "Update feature"
git push origin main

# Manual: Render Dashboard → Service → Manual Deploy
```

---

## Problemas Resueltos Recientemente

### 1. Rankings 500 Error (Oct 30)
- **Problema:** order_by('-last_updated') → campo no existe
- **Solución:** Cambiar a 'ranking_date'

### 2. Staff Mostrando 0 Resultados
- **Problema:** Validación UUID cuando IDs son integers
- **Solución:** Remover validación UUID, Django maneja automáticamente

### 3. Schedule No Mostrando Eventos
- **Problema:** Leyendo de localStorage en producción
- **Solución:** Cambiar a API call directo

### 4. Schedule 400 Error - Discipline/Category
- **Problema:** Backend esperaba UUIDs, no todos los eventos los necesitan
- **Solución:** Hacer campos explícitamente nullable

### 5. Timezone Mismatch (4 horas)
- **Problema:** datetime-local sin timezone → backend interpreta como UTC
- **Solución:** Frontend convierte local→UTC con .toISOString() antes de enviar

---

## Estado Actual del Sistema

### ✅ Completamente Funcional
- Auth JWT con roles
- CRUD completo competencias/categorías
- Asignación de personal
- Programación con timezone correcto
- Sistema de calificación FEI
- Cálculo automático de rankings
- Rankings en tiempo real (polling 30s)
- Dashboards por rol
- localStorage fallback
- Deployed en producción

### ⚠️ Parcialmente Implementado
- **WebSockets real-time:** Infraestructura existe, necesita Redis
- **Auto-inscripción participantes:** Backend completo, falta UI frontend
- **Eventing completo:** Modelos OK, falta UI específica
- **Reportes PDF:** Endpoints existen, falta implementación PDF
- **Notificaciones email:** Infraestructura lista, faltan templates

### ❌ No Implementado
- Integración de pagos
- Upload de archivos media (necesita S3)
- Analíticas avanzadas
- Multi-idioma (i18n)
- Búsqueda avanzada
- Dashboard para riders
- Competencias por equipos (modelo existe)

---

## Próximos Pasos Recomendados

### Corto Plazo (1-2 semanas)
- [ ] Cambiar contraseñas de prueba
- [ ] Rate limiting en API
- [ ] Error tracking (Sentry)
- [ ] UptimeRobot para keep-alive

### Mediano Plazo (1-3 meses)
- [ ] Upgrade a Starter ($7/mes) → 24/7
- [ ] Redis para WebSockets ($10/mes)
- [ ] Implementar reportes PDF
- [ ] UI auto-inscripción participantes
- [ ] Configurar email notifications

### Largo Plazo (3-6 meses)
- [ ] Test suite (80% coverage)
- [ ] Integración de pagos
- [ ] PWA móvil
- [ ] Analíticas avanzadas
- [ ] Multi-idioma

---

## Archivos Clave

### Backend
- `backend/apps/users/models.py` - User, JudgeProfile, OrganizerProfile
- `backend/apps/competitions/models.py` - Competition, Category, Discipline, Venue, Staff, Schedule
- `backend/apps/scoring/models.py` - ScoreCard, JumpingFault, DressageMovement
- `backend/apps/rankings/models.py` - CompetitionRanking, RankingEntry, LiveRanking
- `backend/apps/scoring/utils.py` - calculate_competition_ranking()
- `backend/apps/users/authentication.py` - CustomTokenObtainPairView, RegisterView
- `backend/config/urls.py` - Configuración de rutas principales
- `build.sh` - Script de deployment
- `gunicorn_config.py` - Configuración servidor producción

### Frontend
- `frontend/src/App.jsx` - Configuración de rutas
- `frontend/src/pages/AdminDashboard.jsx` - Dashboard admin
- `frontend/src/pages/OrganizerDashboard.jsx` - Dashboard organizador
- `frontend/src/pages/JudgeDashboard.jsx` - Dashboard juez
- `frontend/src/pages/CompetitionsPage.jsx` - CRUD competencias
- `frontend/src/pages/ScoringPage.jsx` - Sistema de calificación
- `frontend/src/pages/RankingsPage.jsx` - Rankings en tiempo real
- `frontend/src/store/authStore.js` - Estado autenticación
- `frontend/src/store/competitionStore.js` - Estado competencias
- `frontend/src/store/scoringStore.js` - Estado calificación
- `frontend/src/services/authService.js` - API auth
- `frontend/src/services/competitionService.js` - API competencias

---

## Notas Importantes

1. **Timezone:** Sistema siempre guarda en UTC, frontend convierte local↔UTC
2. **IDs:** Competition IDs son integers, no UUIDs
3. **Participant:** Campo `rider` (no `user`) para FK a User
4. **Schedule:** Discipline/Category son nullable (breaks, lunch no los necesitan)
5. **Rankings:** Auto-calculan al completar scorecard
6. **Permissions:** Filtrado a nivel queryset según rol
7. **localStorage:** Fallback automático si API no disponible
8. **Cold Start:** Primera request en producción puede tardar 60s (free tier)

---

## Soporte y Feedback

Para problemas o sugerencias, contactar al equipo de desarrollo o revisar logs en Render Dashboard.

**Health Check:** `GET https://equestrian-backend.onrender.com/api/health/`
