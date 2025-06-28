@echo off
echo 🚀 IMPLEMENTANDO FASE 2: Módulo de Gestión de Usuarios y Autenticación
echo ================================================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "backend" (
    echo ❌ Error: No se encuentra el directorio backend
    echo Asegúrate de ejecutar este script desde la raíz del proyecto
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Error: No se encuentra el directorio frontend
    echo Asegúrate de ejecutar este script desde la raíz del proyecto
    pause
    exit /b 1
)

echo 📋 FASE 2 incluye:
echo    👥 Sistema completo de usuarios y roles
echo    🔐 Autenticación JWT segura
echo    📝 Perfiles específicos (Jueces y Organizadores)
echo    🛡️ Sistema de permisos granular
echo    📊 Auditoría de acciones
echo    🖥️ Interfaces de usuario responsivas
echo    📱 Dashboards diferenciados por rol
echo.

set /p confirm="¿Deseas continuar con la implementación? (s/n): "
if /i not "%confirm%"=="s" (
    echo Implementación cancelada.
    pause
    exit /b 0
)

echo.
echo 🔄 Iniciando implementación de Fase 2...
echo.

REM Paso 1: Configurar backend
echo 📦 PASO 1/4: Configurando backend...
echo ----------------------------------------
call scripts\setup-phase2.bat
if %errorlevel% neq 0 (
    echo ❌ Error en la configuración del backend
    pause
    exit /b 1
)

echo.
echo 📦 PASO 2/4: Configurando frontend...
echo ----------------------------------------
call scripts\setup-frontend-phase2.bat
if %errorlevel% neq 0 (
    echo ❌ Error en la configuración del frontend
    pause
    exit /b 1
)

echo.
echo 🔍 PASO 3/4: Verificando implementación...
echo ----------------------------------------
call scripts\verify-phase2.bat
if %errorlevel% neq 0 (
    echo ⚠️ Verificación completada con advertencias
    echo Revisa los errores reportados antes de continuar
    pause
)

echo.
echo 🌐 PASO 4/4: Iniciando servicios...
echo ----------------------------------------

echo Iniciando backend Django...
start "Django Server" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"

echo Esperando que Django inicie...
timeout /t 5 /nobreak > nul

echo Iniciando frontend Next.js...
start "Next.js Server" cmd /k "cd frontend && npm run dev"

echo.
echo 🎉 FASE 2 IMPLEMENTADA EXITOSAMENTE!
echo ====================================
echo.
echo 🌐 URLs disponibles:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000/api
echo    Admin Django: http://localhost:8000/admin
echo    API Docs: http://localhost:8000/api/docs
echo.
echo 👤 Usuarios de prueba creados:
echo    Admin: admin@fei.com / admin123
echo    Juez: judge1@fei.com / judge123
echo    Juez: judge2@fei.com / judge123
echo    Organizador: organizer1@fei.com / org123
echo    Espectador: spectator@fei.com / spec123
echo.
echo 🔧 Funcionalidades implementadas:
echo    ✅ Registro y login de usuarios
echo    ✅ Autenticación JWT con refresh tokens
echo    ✅ Perfiles específicos por rol
echo    ✅ Dashboard diferenciado por usuario
echo    ✅ Sistema de permisos granular
echo    ✅ Auditoría completa de acciones
echo    ✅ Gestión de usuarios (admin)
echo    ✅ Interfaces responsivas
echo.
echo 📚 Para probar:
echo    1. Ve a http://localhost:3000
echo    2. Regístrate o usa las credenciales de prueba
echo    3. Explora el dashboard según tu rol
echo    4. Prueba las APIs en http://localhost:8000/api/docs
echo.
echo 🚀 LISTO PARA FASE 3: Gestión de Competencias
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause > nul

REM Abrir navegador con la aplicación
start http://localhost:3000

echo.
echo ✨ ¡Disfruta explorando el Sistema FEI!
echo.
pause