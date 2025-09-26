#!/bin/bash

# Script para configurar y ejecutar el sistema FEI localmente (sin Docker)

set -e  # Salir si hay errores

echo "🏁 Configurando Sistema FEI Ecuestre - Entorno Local"
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "equestrian-fei-system/docker-compose.yml" ]; then
    print_error "No se encontró el proyecto. Ejecuta este script desde el directorio raíz."
    exit 1
fi

cd equestrian-fei-system

# 1. Configurar Backend Django
print_status "Configurando Backend Django..."

cd backend

# Crear virtual environment si no existe
if [ ! -d "venv" ]; then
    print_status "Creando virtual environment..."
    python3 -m venv venv
fi

# Activar virtual environment
print_status "Activando virtual environment..."
source venv/bin/activate

# Verificar pip actualizado
print_status "Actualizando pip..."
pip install --upgrade pip

# Instalar dependencias
print_status "Instalando dependencias de Python..."
if [ -f "requirements/development.txt" ]; then
    pip install -r requirements/development.txt
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
elif [ -f "requirements/base.txt" ]; then
    pip install -r requirements/base.txt
else
    print_warning "No se encontró archivo de requirements. Instalando dependencias básicas..."
    pip install django djangorestframework django-cors-headers python-decouple
fi

# Configurar variables de entorno para desarrollo local
print_status "Configurando variables de entorno..."
cat > .env << EOF
DEBUG=True
SECRET_KEY=dev-secret-key-not-for-production-$(date +%s)
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Redis (opcional para desarrollo local)
REDIS_URL=redis://localhost:6379/0

# Email (para desarrollo)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EOF

print_success "Backend configurado correctamente"

cd ..

# 2. Configurar Frontend React
print_status "Configurando Frontend React..."

cd frontend

# Instalar dependencias de Node.js
print_status "Instalando dependencias de Node.js..."
npm install

# Configurar variables de entorno del frontend
print_status "Configurando variables de entorno del frontend..."
cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_APP_NAME=Equestrian FEI System
VITE_APP_VERSION=1.0.0
EOF

print_success "Frontend configurado correctamente"

cd ..

print_success "✅ Configuración completada!"
echo ""
echo "Para ejecutar el sistema:"
echo "1. Backend:  cd backend && source venv/bin/activate && python manage.py runserver"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend:  http://localhost:8000"
echo "- Admin:    http://localhost:8000/admin/"