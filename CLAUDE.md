# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional equestrian competition management system with FEI (Fédération Équestre Internationale) compliance. The system is designed for managing international equestrian competitions with real-time rankings and offline functionality.

## Architecture

### Backend (Django)
- **Location**: `equestrian-fei-system/backend/`
- **Framework**: Django 5.0.6 + Django REST Framework 3.15.1
- **Database**: PostgreSQL 15 (production) / SQLite (development)
- **Real-time**: Django Channels 4.0.0 + Redis WebSockets
- **Authentication**: JWT with djangorestframework-simplejwt 5.3.0

### Frontend (React)
- **Location**: `equestrian-fei-system/frontend/`
- **Framework**: React 18.2.0 + Vite 4.3.2
- **State Management**: Zustand 4.3.7
- **Data Fetching**: TanStack React Query 4.29.0
- **Styling**: Tailwind CSS 3.3.2

### Key Architecture Components
- **32 ViewSets** with 240+ API endpoints in Django backend
- **26 Database Models** covering all aspects of equestrian competitions
- **9 Specialized Services**: Cache, Sync, Monitoring, Notification, Import/Export, Offline Sync, Backup, Logging, and FEI Reports
- **Role-based Dashboards**: Admin, Organizer, Judge with protected routes
- **Real-time Updates**: WebSocket integration for live rankings

## Development Commands

### Starting the Development Environment
```bash
# Start all services (backend, frontend, database, redis)
docker-compose up -d

# View logs for all services
docker-compose logs -f

# Stop all services
docker-compose down
```

### Backend Development
```bash
# Enter backend container
docker-compose exec backend bash

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run Django shell
python manage.py shell

# Run backend tests
python manage.py test
```

### Frontend Development
```bash
# Enter frontend container or work locally in frontend/
cd equestrian-fei-system/frontend/

# Start development server (if not using Docker)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Key Directories

- **`backend/apps/`**: Django applications (users, competitions, scoring, rankings, sync)
- **`backend/config/`**: Django settings and main configuration
- **`frontend/src/components/`**: Reusable React components (includes CreateCompetitionModal, CreateCategoryModal)
- **`frontend/src/pages/`**: Page components with role-based access
  - **`AdminDashboardPro.jsx`**: Professional admin dashboard (NEW - December 2024)
  - **`CompetitionsPage.jsx`**: Competition management (REDESIGNED - December 2024)
  - **`CategoriesPage.jsx`**: Category management (REDESIGNED - December 2024)
- **`frontend/src/services/`**: API service layer with localStorage fallback
  - **`competitionService.js`**: Enhanced with localStorage persistence (UPDATED - December 2024)
- **`frontend/src/store/`**: Zustand state management with CRUD operations
  - **`competitionStore.js`**: Complete state management (ENHANCED - December 2024)
- **`docker/`**: Docker configurations for backend and frontend

## API Structure

Base URL: `/api/`
- **Authentication**: `/api/auth/` (login, refresh, JWT tokens)
- **Users**: `/api/users/` (user management, roles)
- **Competitions**: `/api/competitions/` (competition CRUD, disciplines)
- **Scoring**: `/api/scoring/` (FEI-compliant scoring system)
- **Rankings**: `/api/rankings/` (real-time rankings via WebSocket)
- **Sync**: `/api/sync/` (offline synchronization)
- **Reports**: `/api/reports/` (FEI-compliant PDF/Excel reports)

## FEI-Specific Features

The system implements official FEI (Fédération Équestre Internationale) standards:
- **Scoring Algorithms**: Mathematically precise FEI calculations for Dressage, Show Jumping, and Eventing
- **Official Reports**: PDF and Excel generation with FEI formatting requirements
- **Competition Rules**: Built-in FEI competition rules and validation
- **Multi-discipline Support**: Handles different equestrian disciplines with specific scoring rules

## Recent Updates & Current Status

### ✅ **Data Persistence Solution (December 2024)**
- **Problem Solved**: Fixed competition and category data not being saved
- **Solution**: Implemented localStorage fallback system in competitionService.js
- **Implementation**:
  - Added automatic localStorage initialization with default FEI data
  - Enhanced competitionStore.js with full CRUD operations for categories
  - Updated pages to use Zustand stores instead of hardcoded data
  - Robust error handling and validation throughout

### ✅ **Professional Frontend Redesign (December 2024)**
- **Complete UI/UX Overhaul**: Redesigned for professional equestrian users
- **Modern Design System**: Implemented consistent professional interface
- **Key Updates**:
  - **AdminDashboardPro.jsx**: New professional dashboard with real-time stats, gradient design, quick actions grid
  - **CompetitionsPage.jsx**: Modern competition management with enhanced cards, professional layouts, improved navigation
  - **CategoriesPage.jsx**: Professional category management with specialized stats, modern table design, action buttons

### 🎨 **Professional Design Features**
- **Visual Design**: Gradients, shadows, depth effects, smooth animations
- **User Experience**: Enhanced loading states, empty states, intuitive navigation
- **FEI Branding**: Official colors (blue, purple, green), equestrian terminology, professional layouts
- **Responsive Design**: Mobile-first approach with professional desktop experience
- **Iconography**: Consistent emoji-based icons with professional styling

### 🔧 **Technical Improvements**
- **State Management**: Enhanced Zustand stores with localStorage persistence
- **Error Handling**: Comprehensive error states with retry mechanisms
- **Data Validation**: Improved form validation and date handling
- **Performance**: Optimized component rendering and data fetching
- **Accessibility**: Professional interface suitable for expert users

## Development Status

**Current progress: 98% complete (Frontend Professional + Data Persistence Complete)**
- ✅ **Stage 1-7**: Environment, Auth, Competitions, Scoring, Sync, Frontend, Reports
- ✅ **Stage 8a**: Data Persistence & LocalStorage Fallback System
- ✅ **Stage 8b**: Professional Frontend Redesign for Expert Users
- ⚠️ **Stage 9**: Deployment (user responsibility)

### **System Ready for Professional Use**
The system now features:
- Complete data persistence with localStorage fallback
- Professional-grade UI designed for adult equestrian professionals
- FEI-compliant interface with intuitive navigation
- Robust error handling and user feedback
- Modern responsive design with professional aesthetics

## Environment Configuration

- Use `.env.example` as template for environment variables
- Docker Compose handles service orchestration automatically
- Development uses SQLite, production uses PostgreSQL
- Redis required for caching, sessions, and WebSocket support
- **localStorage**: Automatic fallback when backend unavailable (development mode)

## Recent Issue Resolutions

### 🐛 **Date Validation Fix**
- **Issue**: Competition creation modal showed "please fill out this field" despite valid dates
- **Solution**: Implemented proper datetime-local format with getDefaultDateTime function
- **Files Modified**: `CreateCompetitionModal.jsx`

### 💾 **Data Persistence Implementation**
- **Issue**: Competitions and categories were not being saved (user reported: "no se esta guardando nada")
- **Root Cause**: Pages were using hardcoded setTimeout data instead of store systems
- **Solution**: Complete localStorage fallback system with automatic data initialization
- **Files Modified**: `competitionService.js`, `competitionStore.js`, `CompetitionsPage.jsx`, `CategoriesPage.jsx`

### 🎨 **Professional UI Implementation**
- **Request**: "crea un frontend intuitivo y completo, estamos hablando de personas mayores de edad pero profesionales en el campo"
- **Solution**: Complete professional redesign with modern UX patterns
- **Target Users**: Adult professionals in equestrian field using FEI system
- **Design Principles**: Intuitive, complete, professional-grade interface

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.