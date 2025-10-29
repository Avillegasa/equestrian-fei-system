#!/usr/bin/env bash
# ============================================
# RESET MIGRATIONS SCRIPT
# Sistema de Gestión Ecuestre FEI
#
# Este script elimina todas las migraciones existentes
# y recrea la base de datos desde cero
# ============================================

set -o errexit  # Exit on error

# ============================================
# 0. ACTIVAR ENTORNO VIRTUAL (si existe)
# ============================================
if [ -d "venv" ]; then
    echo "🐍 Activating virtual environment..."
    source venv/bin/activate
fi

echo "🔄 Starting migration reset process..."
echo ""

# ============================================
# 1. BACKUP DE LA BASE DE DATOS (opcional)
# ============================================
echo "📦 Creating database backup (if needed)..."
if [ -f "db.sqlite3" ]; then
    cp db.sqlite3 db.sqlite3.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Database backed up"
fi

# ============================================
# 2. ELIMINAR MIGRACIONES EXISTENTES
# ============================================
echo "🗑️  Removing old migration files..."

# Eliminar todas las migraciones excepto __init__.py (solo apps instaladas)
find apps/users/migrations -name "*.py" -not -name "__init__.py" -type f -delete
find apps/competitions/migrations -name "*.py" -not -name "__init__.py" -type f -delete
find apps/scoring/migrations -name "*.py" -not -name "__init__.py" -type f -delete
find apps/sync/migrations -name "*.py" -not -name "__init__.py" -type f -delete

echo "✅ Old migrations removed"

# ============================================
# 3. ELIMINAR BASE DE DATOS (solo desarrollo)
# ============================================
if [ "$DATABASE_URL" = "" ]; then
    echo "🗄️  Removing SQLite database..."
    rm -f db.sqlite3
    echo "✅ Database removed"
else
    echo "⚠️  Production database detected - manual reset required"
    echo "   Run this SQL in production:"
    echo "   DROP SCHEMA public CASCADE;"
    echo "   CREATE SCHEMA public;"
    echo "   GRANT ALL ON SCHEMA public TO postgres;"
    echo "   GRANT ALL ON SCHEMA public TO public;"
fi

# ============================================
# 4. CREAR NUEVAS MIGRACIONES
# ============================================
echo "📝 Creating new migrations..."
python manage.py makemigrations users
python manage.py makemigrations competitions
python manage.py makemigrations scoring
python manage.py makemigrations sync

echo "✅ New migrations created"

# ============================================
# 5. APLICAR MIGRACIONES
# ============================================
echo "🗄️  Applying migrations..."
python manage.py migrate

echo "✅ Migrations applied"

# ============================================
# 6. CREAR USUARIOS DE PRUEBA
# ============================================
echo "👤 Creating test users..."
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()

# Crear admin
admin = User.objects.create_superuser(
    username='admin',
    email='admin@equestrian-fei.com',
    password='admin123',
    first_name='Admin',
    last_name='FEI',
    role='admin'
)
admin.is_verified = True
admin.save()
print("✅ Admin created: admin/admin123")

# Crear organizer
organizer = User.objects.create_user(
    username='organizer1',
    email='organizer@equestrian-fei.com',
    password='org123',
    first_name='Organizador',
    last_name='Prueba',
    role='organizer'
)
organizer.is_verified = True
organizer.save()
print("✅ Organizer created: organizer1/org123")

# Crear judge
judge = User.objects.create_user(
    username='judge1',
    email='judge@equestrian-fei.com',
    password='judge123',
    first_name='Juez',
    last_name='Prueba',
    role='judge'
)
judge.is_verified = True
judge.save()
print("✅ Judge created: judge1/judge123")

print("")
print("====================================")
print("✅ ALL TEST USERS CREATED")
print("====================================")
print("  - Admin:      admin / admin123")
print("  - Organizer:  organizer1 / org123")
print("  - Judge:      judge1 / judge123")
END

echo ""
echo "======================================"
echo "🎉 Migration reset completed!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Test the application locally"
echo "2. Commit changes: git add . && git commit -m 'Fix: Reset migrations from UUID to AutoField'"
echo "3. Push to production: git push origin main"
echo ""
