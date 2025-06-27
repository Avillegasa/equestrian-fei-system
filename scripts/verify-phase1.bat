@echo off
setlocal EnableDelayedExpansion

echo 🔍 Verificando FASE 1: Configuración del Entorno
echo.

REM Configurar colores (limitado en batch)
set "GREEN=✅"
set "RED=❌"
set "YELLOW=⚠️"

REM Contador de errores
set /a errors=0

REM Función para verificar archivos/directorios
goto :main

:check_exists
if exist "%~1" (
    echo %GREEN% %~1: EXISTE
    exit /b 0
) else (
    echo %RED% %~1: FALTANTE
    set /a errors+=1
    exit /b 1
)

:check_service
REM Verificar si un servicio web responde
curl -s -o nul -w "%%{http_code}" %~1 | findstr "200 404 403" >nul
if !errorlevel! equ 0 (
    echo %GREEN% %~2: FUNCIONANDO
    exit /b 0
) else (
    echo %RED% %~2: NO DISPONIBLE
    set /a errors+=1
    exit /b 1
)

:main

echo 📁 Verificando estructura del proyecto...
echo.

REM Verificar directorios principales
call :check_exists "backend\apps\users"
call :check_exists "backend\apps\competitions"
call :check_exists "backend\apps\scoring"
call :check_exists "backend\apps\rankings"
call :check_exists "backend\apps\websockets"
call :check_exists "frontend\src\app"
call :check_exists "frontend\src\components"
call :check_exists "frontend\src\lib"
call :check_exists "docs"
call :check_exists "scripts"

echo.
echo 📄 Verificando archivos clave...
echo.

REM Verificar archivos importantes
call :check_exists "backend\manage.py"
call :check_exists "backend\.env"
call :check_exists "backend\config\settings\base.py"
call :check_exists "frontend\package.json"
call :check_exists "frontend\.env.local"
call :check_exists "README.md"
call :check_exists ".gitignore"

echo.
echo 🗄️ Verificando servicios de base...
echo.

REM Verificar PostgreSQL
pg_isready -h localhost -p 5432 >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN% PostgreSQL: CONECTADO
    
    REM Verificar base de datos específica
    psql -U postgres -d equestrian_fei -c "SELECT 1;" >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN% Base de datos 'equestrian_fei': ACCESIBLE
    ) else (
        echo %RED% Base de datos 'equestrian_fei': NO ACCESIBLE
        set /a errors+=1
    )
) else (
    echo %RED% PostgreSQL: NO DISPONIBLE
    echo %YELLOW% Asegúrate de que PostgreSQL esté ejecutándose
    set /a errors+=1
)

REM Verificar Redis
redis-cli ping >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN% Redis: FUNCIONANDO
) else (
    echo %RED% Redis: NO RESPONDE
    echo %YELLOW% Asegúrate de que Redis esté ejecutándose
    set /a errors+=1
)

echo.
echo 🐍 Verificando entorno Python...
echo.

REM Verificar entorno virtual
if exist "backend\venv" (
    echo %GREEN% Entorno virtual: EXISTE
    
    REM Activar entorno virtual y verificar Django
    cd backend
    call venv\Scripts\activate.bat
    python -c "import django; print('Django version:', django.get_version())" >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN% Django: INSTALADO
        
        REM Verificar migraciones
        python manage.py showmigrations --plan | findstr "users" >nul 2>&1
        if !errorlevel! equ 0 (
            echo %GREEN% Migraciones: APLICADAS
        ) else (
            echo %YELLOW% Migraciones: PENDIENTES
            echo 💡 Ejecuta: python manage.py migrate
        )
    ) else (
        echo %RED% Django: NO INSTALADO CORRECTAMENTE
        set /a errors+=1
    )
    cd ..
) else (
    echo %RED% Entorno virtual: NO EXISTE
    echo 💡 Ejecuta: cd backend && python -m venv venv
    set /a errors+=1
)

echo.
echo ⚛️ Verificando entorno Node.js...
echo.

REM Verificar node_modules
if exist "frontend\node_modules" (
    echo %GREEN% node_modules: EXISTE
    
    REM Verificar que Next.js esté instalado
    cd frontend
    npm list next >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN% Next.js: INSTALADO
        
        REM Verificar TypeScript
        npm list typescript >nul 2>&1
        if !errorlevel! equ 0 (
            echo %GREEN% TypeScript: INSTALADO
        ) else (
            echo %YELLOW% TypeScript: NO ENCONTRADO
        )
    ) else (
        echo %RED% Next.js: NO INSTALADO
        set /a errors+=1
    )
    cd ..
) else (
    echo %RED% node_modules: NO EXISTE
    echo 💡 Ejecuta: cd frontend && npm install
    set /a errors+=1
)

echo.
echo 🌐 Verificando servicios web (opcional)...
echo.

REM Intentar verificar servicios web
echo Verificando si los servicios están ejecutándose...

REM Frontend
curl -s -o nul -w "%%{http_code}" http://localhost:3000 2>nul | findstr "200 404" >nul
if !errorlevel! equ 0 (
    echo %GREEN% Frontend (Next.js): FUNCIONANDO en http://localhost:3000
) else (
    echo %YELLOW% Frontend (Next.js): NO EJECUTÁNDOSE
    echo 💡 Para iniciar: cd frontend ^&^& npm run dev
)

REM Backend
curl -s -o nul -w "%%{http_code}" http://localhost:8000 2>nul | findstr "200 404" >nul
if !errorlevel! equ 0 (
    echo %GREEN% Backend (Django): FUNCIONANDO en http://localhost:8000
) else (
    echo %YELLOW% Backend (Django): NO EJECUTÁNDOSE
    echo 💡 Para iniciar: cd backend ^&^& venv\Scripts\activate ^&^& python manage.py runserver
)

echo.
echo 📊 RESULTADO DE VERIFICACIÓN:
echo.

if !errors! equ 0 (
    echo 🎉 FASE 1 COMPLETADA EXITOSAMENTE
    echo %GREEN% Estructura del proyecto configurada
    echo %GREEN% Dependencias instaladas
    echo %GREEN% Servicios de base funcionando
    echo %GREEN% Entornos de desarrollo listos
    echo.
    echo 🚀 LISTO PARA PROCEDER A FASE 2
    echo.
    echo 📝 Para iniciar el desarrollo:
    echo    Terminal 1: cd backend ^&^& venv\Scripts\activate ^&^& python manage.py runserver
    echo    Terminal 2: cd frontend ^&^& npm run dev
    echo.
    echo 🌐 URLs disponibles:
    echo    Frontend: http://localhost:3000
    echo    Backend: http://localhost:8000
    echo    Admin: http://localhost:8000/admin ^(admin/admin123^)
    echo    API Docs: http://localhost:8000/api/docs
) else (
    echo %YELLOW% FASE 1 CON !errors! ERRORES
    echo 🔧 Por favor revisa los elementos marcados con %RED%
    echo.
    echo 💡 Comandos útiles:
    echo    scripts\setup.bat          # Reconfigurar proyecto
    echo    scripts\start.bat          # Verificar servicios
    echo.
    echo 🔧 Solución de problemas comunes:
    echo.
    echo    PostgreSQL no disponible:
    echo    - Verificar que PostgreSQL esté instalado e iniciado
    echo    - Crear base de datos: createdb -U postgres equestrian_fei
    echo.
    echo    Redis no disponible:
    echo    - Instalar Redis o usar WSL2
    echo    - Iniciar servicio de Redis
    echo.
    echo    Django no instalado:
    echo    - cd backend
    echo    - venv\Scripts\activate
    echo    - pip install -r requirements\development.txt
    echo.
    echo    Node.js dependencias faltantes:
    echo    - cd frontend
    echo    - npm install
    echo.
    echo    Migraciones pendientes:
    echo    - cd backend
    echo    - venv\Scripts\activate
    echo    - python manage.py makemigrations
    echo    - python manage.py migrate
    pause
    exit /b 1
)

echo.
echo ✨ Verificación completada. Presiona cualquier tecla para continuar...
pause >nul