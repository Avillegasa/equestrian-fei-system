# 🏇 Sistema FEI de Gestión de Competencias Ecuestres

Sistema profesional de gestión de competencias ecuestres con calificación FEI compliant, rankings en tiempo real y control de acceso basado en roles.

**Estado:** ✅ **SISTEMA FUNCIONAL Y LISTO PARA PRODUCCIÓN**
**Versión:** 2024.1.0
**Fecha:** 22 de Octubre de 2025

---

## ✨ Características Principales

### Sistema de Roles y Permisos
- ✅ **4 roles**: Administrador, Organizador, Juez, Viewer/Jinete
- ✅ **Autenticación JWT** con refresh tokens
- ✅ **Control de acceso granular** por endpoint y acción
- ✅ **Dashboards personalizados** por rol

### Gestión de Competencias FEI
- ✅ **CRUD completo** de competencias ecuestres
- ✅ **3 disciplinas FEI**: Dressage, Show Jumping, Eventing
- ✅ **Categorías por edad y nivel** (Junior, Senior, Amateur, Professional)
- ✅ **Gestión de participantes** e inscripciones
- ✅ **Asignación de jueces** y personal

### Sistema de Calificación FEI
- ✅ **Scorecards FEI-compliant** con cálculos matemáticos precisos
- ✅ **Registro de faltas y penalizaciones** según disciplina
- ✅ **Rankings en tiempo real** con actualización configurable
- ✅ **Notas y comentarios** del juez
- ✅ **Validación automática** de datos

### Interfaz Profesional
- ✅ **Diseño moderno** con Tailwind CSS
- ✅ **Responsive** - Mobile first
- ✅ **UX optimizada** para profesionales del sector

---

## 🛠 Stack Tecnológico

**Backend:** Django 5.0.6 + DRF 3.15.1 + JWT
**Frontend:** React 18.2.0 + Vite 4.3.2 + Tailwind CSS 3.3.2
**Database:** SQLite (dev) / PostgreSQL (prod)
**Cache:** Redis 7

---

## 🚀 Instalación Rápida

### Backend
\`\`\`bash
cd equestrian-fei-system/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
\`\`\`

### Frontend
\`\`\`bash
cd equestrian-fei-system/frontend
npm install
npm run dev
\`\`\`

---

## 🔐 Credenciales de Prueba

| Usuario | Password | Rol |
|---------|----------|-----|
| admin | admin123 | Administrador |
| organizer1 | org123 | Organizador |
| judge1 | judge123 | Juez |

---

## 📚 Documentación

- **[MANUAL_TESTING_GUIDE.md](./MANUAL_TESTING_GUIDE.md)** - Guía completa de pruebas manuales
- **[CLAUDE.md](./CLAUDE.md)** - Documentación técnica del proyecto

---

## 🎯 Estado: ✅ LISTO PARA PRODUCCIÓN

**Última actualización:** 22 de Octubre de 2025
