@echo off
echo 🚀 Configurando entorno de desarrollo para Sistema FEI...

REM Verificar dependencias
echo 📋 Verificando dependencias...

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python no encontrado
    pause
    exit /b 1
)
echo ✅ Python: INSTALADO

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js no encontrado
    pause
    exit /b 1
)
echo ✅ Node.js: INSTALADO

where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL no encontrado
    pause
    exit /b 1
)
echo ✅ PostgreSQL: INSTALADO

where redis-cli >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Redis CLI no encontrado, pero puede estar instalado como servicio
)

echo ✅ Dependencias verificadas

REM Configurar backend
echo 🐍 Configurando backend...
cd backend

REM Crear entorno virtual si no existe
if not exist "venv" (
    python -m venv venv
)

REM Activar entorno virtual
call venv\Scripts\activate.bat

REM Actualizar pip
python -m pip install --upgrade pip

REM Instalar dependencias
echo 📦 Instalando dependencias Python...
pip install -r requirements/development.txt

REM Configurar variables de entorno
set DJANGO_SETTINGS_MODULE=config.settings.development

REM Ejecutar migraciones
echo 🔄 Ejecutando migraciones...
python manage.py makemigrations
python manage.py migrate

REM Crear superusuario
echo 👤 Configurando superusuario...
echo from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@test.com', 'admin123') if not User.objects.filter(username='admin').exists() else print('Superusuario ya existe') | python manage.py shell

cd ..

REM Configurar frontend
echo ⚛️ Configurando frontend...
cd frontend

echo 📦 Instalando dependencias Node.js...
npm install

cd ..

echo ✅ Configuración completada!
echo.
echo 📝 Para iniciar el proyecto:
echo    Terminal 1 (Backend):
echo    cd backend && venv\Scripts\activate && python manage.py runserver
echo.
echo    Terminal 2 (Frontend):
echo    cd frontend && npm run dev
echo.
echo 🌐 URLs del sistema:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    Admin Django: http://localhost:8000/admin
echo    API Docs: http://localhost:8000/api/docs
echo.
echo 👤 Credenciales admin: admin / admin123
pause