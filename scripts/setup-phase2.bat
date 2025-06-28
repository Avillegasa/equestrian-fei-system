@echo off
echo 🚀 Configurando FASE 2: Módulo de Gestión de Usuarios y Autenticación...
echo.

REM Ir al directorio backend
cd backend

REM Activar entorno virtual
call venv\Scripts\activate.bat

echo 📋 Instalando dependencias adicionales para Fase 2...
pip install django-ratelimit python-decouple

echo 🔄 Creando y aplicando migraciones...
python manage.py makemigrations users
python manage.py migrate

echo 👥 Creando usuarios de prueba...
python manage.py shell -c "
from apps.users.models import User, JudgeProfile, OrganizerProfile
from django.utils import timezone
from datetime import date, timedelta

# Crear usuarios de prueba si no existen
users_data = [
    {
        'email': 'admin@fei.com',
        'username': 'admin_fei',
        'first_name': 'Admin',
        'last_name': 'Sistema',
        'role': 'admin',
        'password': 'admin123',
        'is_verified': True,
        'country': 'Bolivia'
    },
    {
        'email': 'judge1@fei.com',
        'username': 'judge_maria',
        'first_name': 'María',
        'last_name': 'González',
        'role': 'judge',
        'password': 'judge123',
        'is_verified': True,
        'country': 'Bolivia'
    },
    {
        'email': 'judge2@fei.com',
        'username': 'judge_carlos',
        'first_name': 'Carlos',
        'last_name': 'Mendoza',
        'role': 'judge',
        'password': 'judge123',
        'is_verified': True,
        'country': 'Bolivia'
    },
    {
        'email': 'organizer1@fei.com',
        'username': 'org_club',
        'first_name': 'Ana',
        'last_name': 'Rodríguez',
        'role': 'organizer',
        'password': 'org123',
        'is_verified': True,
        'country': 'Bolivia'
    },
    {
        'email': 'spectator@fei.com',
        'username': 'spectator1',
        'first_name': 'Pedro',
        'last_name': 'Silva',
        'role': 'spectator',
        'password': 'spec123',
        'is_verified': False,
        'country': 'Bolivia'
    }
]

for user_data in users_data:
    if not User.objects.filter(email=user_data['email']).exists():
        password = user_data.pop('password')
        user = User(**user_data)
        user.set_password(password)
        user.save()
        print(f'Usuario creado: {user.email}')
    else:
        print(f'Usuario ya existe: {user_data[\"email\"]}')

# Crear perfiles de juez
judge_users = User.objects.filter(role='judge')
for judge_user in judge_users:
    if not hasattr(judge_user, 'judgeprofile'):
        judge_profile = JudgeProfile.objects.create(
            user=judge_user,
            fei_id=f'FEI{judge_user.id:04d}',
            certification_level='level3',
            disciplines=['dressage', 'jumping'],
            certification_date=date.today() - timedelta(days=365),
            expiry_date=date.today() + timedelta(days=365),
            license_number=f'LIC{judge_user.id:04d}',
            biography=f'Juez experimentado con especialización en doma clásica y salto.',
            years_experience=5,
            languages=['es', 'en'],
            is_active_judge=True
        )
        print(f'Perfil de juez creado para: {judge_user.email}')

# Crear perfiles de organizador
organizer_users = User.objects.filter(role='organizer')
for org_user in organizer_users:
    if not hasattr(org_user, 'organizerprofile'):
        org_profile = OrganizerProfile.objects.create(
            user=org_user,
            organization_name=f'Club Ecuestre {org_user.first_name}',
            organization_type='club',
            license_number=f'ORG{org_user.id:04d}',
            website=f'https://club{org_user.username}.com',
            address='Av. Principal 123, La Paz, Bolivia',
            contact_person=org_user.get_full_name(),
            contact_email=org_user.email,
            contact_phone='+591 2 123456',
            established_date=date.today() - timedelta(days=1000),
            description=f'Club ecuestre dedicado al desarrollo del deporte ecuestre en Bolivia.',
            is_verified_organizer=True
        )
        print(f'Perfil de organizador creado para: {org_user.email}')

print('✅ Usuarios de prueba creados exitosamente')
"

echo.
echo 🔐 Actualizando configuraciones de seguridad...

REM Crear directorio de logs si no existe
if not exist "logs" mkdir logs

echo.
echo ✅ FASE 2 CONFIGURADA EXITOSAMENTE!
echo.
echo 📋 Usuarios de prueba creados:
echo    👤 Admin: admin@fei.com / admin123
echo    ⚖️ Juez 1: judge1@fei.com / judge123  
echo    ⚖️ Juez 2: judge2@fei.com / judge123
echo    🏢 Organizador: organizer1@fei.com / org123
echo    👁️ Espectador: spectator@fei.com / spec123
echo.
echo 🌐 Endpoints disponibles:
echo    POST /api/users/auth/register/     - Registro
echo    POST /api/users/auth/login/        - Login
echo    GET  /api/users/profile/           - Perfil usuario
echo    GET  /api/users/judges/            - Lista de jueces
echo    GET  /api/users/                   - Lista usuarios (admin)
echo    GET  /api/users/stats/             - Estadísticas (admin)
echo.
echo 📚 Para probar las APIs:
echo    1. Inicia el servidor: python manage.py runserver
echo    2. Ve a: http://localhost:8000/api/docs
echo    3. Usa las credenciales de prueba para autenticarte
echo.
echo 🔍 Para verificar:
echo    scripts\verify-phase2.bat
echo.
cd ..
pause