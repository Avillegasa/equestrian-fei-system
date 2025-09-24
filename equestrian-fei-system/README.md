# Sistema FEI de Competencias Ecuestres

Sistema profesional de gestión de competencias ecuestres con calificación FEI, rankings en tiempo real y funcionalidad offline.

## 🚀 Tecnologías

- **Backend**: Django 5.0+ + DRF + Django Channels
- **Frontend**: React 18+ + Vite + Tailwind CSS
- **Base de Datos**: PostgreSQL 15
- **Cache/WebSockets**: Redis 7
- **Jobs**: Celery + Redis
- **Containerización**: Docker + Docker Compose

## 📁 Estructura del Proyecto

```
equestrian-fei-system/
├── backend/                 # Django backend
│   ├── config/             # Django settings
│   ├── apps/               # Django apps
│   └── requirements/       # Python dependencies
├── frontend/               # React frontend
│   ├── public/            # Static files
│   └── src/               # React source
│       ├── components/    # React components
│       ├── pages/         # Page components
│       ├── hooks/         # Custom hooks
│       ├── services/      # API services
│       ├── store/         # State management
│       ├── utils/         # Utilities
│       └── styles/        # CSS/Tailwind
├── docker/                # Docker configurations
└── docs/                  # Documentation
```

## 🏗️ Desarrollo por Etapas

### Etapa 1: Configuración del Entorno ✅ (COMPLETADA)
- [x] Estructura del proyecto
- [x] Configuración Django
- [x] Configuración React
- [x] Docker Compose
- [x] Comunicación API
- [x] Variables de entorno
- [x] Hot reload funcionando

### Etapas Siguientes
- Etapa 2: Sistema de Autenticación y Usuarios
- Etapa 3: Gestión de Competencias
- Etapa 4: Sistema FEI de Calificación (CORE)
- Etapa 5: Rankings en Tiempo Real
- Etapa 6: Sincronización Offline
- Etapa 7: Integración y Testing
- Etapa 8: Deployment y Producción

## 📋 Setup de Desarrollo

```bash
# Clonar proyecto
git clone <repo>
cd equestrian-fei-system

# Levantar con Docker
docker-compose up --build
```

## 🎯 Funcionalidades Objetivo

✅ Sistema FEI matemáticamente preciso  
✅ Rankings en tiempo real con WebSockets  
✅ Funcionalidad offline robusta  
✅ Interface optimizada para tablets (jueces)  
✅ Dashboard público para espectadores  
✅ Soporte para 200+ jueces simultáneos  
✅ Auditoría completa de acciones  

## 📈 Estado del Proyecto

**Etapa Actual**: 2 - Sistema de Autenticación y Usuarios  
**Progreso**: 12.5% completado (1/8 etapas)