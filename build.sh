#!/usr/bin/env bash
# ============================================
# BUILD SCRIPT FOR RENDER.COM DEPLOYMENT
# Sistema de Gestión Ecuestre FEI
# ============================================

set -o errexit  # Exit on error
set -o pipefail # Exit on pipe failure
set -o nounset  # Exit on undefined variable

echo "🚀 Starting Equestrian FEI Backend Build..."

# ============================================
# 1. UPGRADE PIP
# ============================================
echo "📦 Upgrading pip..."
pip install --upgrade pip

# ============================================
# 2. INSTALL DEPENDENCIES
# ============================================
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# ============================================
# 3. COLLECT STATIC FILES
# ============================================
echo "📁 Collecting static files..."
python manage.py collectstatic --no-input --clear

# ============================================
# 4. RUN DATABASE MIGRATIONS
# ============================================
echo "🗄️  Running database migrations..."
python manage.py migrate --no-input

# ============================================
# 5. CREATE SUPERUSER (si no existe)
# ============================================
echo "👤 Checking for superuser..."
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()

# Crear admin si no existe
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@equestrian-fei.com',
        password='admin123',
        first_name='Admin',
        last_name='FEI',
        role='admin'
    )
    print("✅ Superuser 'admin' created")
else:
    print("ℹ️  Superuser 'admin' already exists")

# Crear organizer de prueba si no existe
if not User.objects.filter(username='organizer1').exists():
    User.objects.create_user(
        username='organizer1',
        email='organizer@equestrian-fei.com',
        password='org123',
        first_name='Organizador',
        last_name='Prueba',
        role='organizer'
    )
    print("✅ Organizer 'organizer1' created")
else:
    print("ℹ️  Organizer 'organizer1' already exists")

# Crear judge de prueba si no existe
if not User.objects.filter(username='judge1').exists():
    User.objects.create_user(
        username='judge1',
        email='judge@equestrian-fei.com',
        password='judge123',
        first_name='Juez',
        last_name='Prueba',
        role='judge'
    )
    print("✅ Judge 'judge1' created")
else:
    print("ℹ️  Judge 'judge1' already exists")
END

# ============================================
# 6. CREATE DIRECTORIES
# ============================================
echo "📁 Creating required directories..."
mkdir -p media/reports
mkdir -p media/uploads
mkdir -p backups
mkdir -p logs

# ============================================
# 7. SET PERMISSIONS
# ============================================
echo "🔐 Setting permissions..."
chmod -R 755 media
chmod -R 755 backups
chmod -R 755 logs

# ============================================
# 8. HEALTH CHECK
# ============================================
echo "🏥 Running health check..."
python manage.py check --deploy

echo "✅ Build completed successfully!"
echo ""
echo "======================================"
echo "🎉 Equestrian FEI Backend is ready!"
echo "======================================"
echo ""
echo "Test users created:"
echo "  - Admin:      admin / admin123"
echo "  - Organizer:  organizer1 / org123"
echo "  - Judge:      judge1 / judge123"
echo ""
