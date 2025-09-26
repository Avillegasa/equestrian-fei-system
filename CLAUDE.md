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
- **`frontend/src/components/`**: Reusable React components
- **`frontend/src/pages/`**: Page components with role-based access
- **`frontend/src/services/`**: API service layer for backend communication
- **`frontend/src/store/`**: Zustand state management
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

## Development Status

Current progress: 95% complete (7/8 stages completed)
- ✅ Stages 1-7: Environment, Auth, Competitions, Scoring, Sync, Frontend, Reports
- ⚠️ Stage 8: Deployment (user responsibility)

## Environment Configuration

- Use `.env.example` as template for environment variables
- Docker Compose handles service orchestration automatically
- Development uses SQLite, production uses PostgreSQL
- Redis required for caching, sessions, and WebSocket support