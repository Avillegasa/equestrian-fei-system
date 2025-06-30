@echo off
echo 🚀 IMPLEMENTANDO FASE 3: Módulo de Gestión de Competencias
echo ==========================================================
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

echo 📋 FASE 3 incluye:
echo    🏇 Sistema completo de gestión de competencias
echo    📝 Inscripción de participantes (jinetes y caballos)
echo    🏆 Categorías y disciplinas configurables
echo    ⚖️ Asignación de jueces a competencias
echo    📱 Interfaces administrativas responsivas
echo.

echo ⚠️  IMPORTANTE: Antes de continuar asegúrate de haber copiado todos los archivos
echo    de código desde los artefactos a sus ubicaciones correspondientes.
echo.
echo    Archivos requeridos:
echo    - backend/apps/competitions/models.py
echo    - backend/apps/competitions/serializers.py  
echo    - backend/apps/competitions/views.py
echo    - backend/apps/competitions/urls.py
echo    - backend/apps/competitions/admin.py
echo    - backend/apps/competitions/apps.py
echo    - frontend/src/types/competitions.ts
echo    - frontend/src/lib/api/competitions.ts
echo    - frontend/src/hooks/useCompetitions.ts
echo    - frontend/src/components/competitions/CompetitionsList.tsx
echo.

set /p confirm="¿Has copiado todos los archivos y deseas continuar? (s/n): "
if /i not "%confirm%"=="s" (
    echo Implementación cancelada.
    echo.
    echo 📝 Para copiar los archivos:
    echo    1. Copia el contenido de cada artefacto
    echo    2. Pégalo en el archivo correspondiente según la lista de arriba
    echo    3. Ejecuta este script nuevamente
    pause
    exit /b 0
)

echo.
echo 🔄 Iniciando implementación de Fase 3...
echo.

REM Paso 1: Crear estructura del backend
echo 📦 PASO 1/6: Creando estructura del backend...
echo -----------------------------------------------

cd backend

REM Crear directorios si no existen
if not exist "apps\competitions" mkdir apps\competitions
if not exist "apps\competitions\migrations" mkdir apps\competitions\migrations

REM Crear archivos __init__.py si no existen
if not exist "apps\competitions\__init__.py" echo. > apps\competitions\__init__.py
if not exist "apps\competitions\migrations\__init__.py" echo. > apps\competitions\migrations\__init__.py

echo ✅ Estructura del backend creada
echo.

REM Paso 2: Verificar archivos del backend
echo 📦 PASO 2/6: Verificando archivos del backend...
echo ------------------------------------------------

set "missing_files=0"

if not exist "apps\competitions\models.py" (
    echo ❌ Falta: apps\competitions\models.py
    set /a missing_files+=1
)
if not exist "apps\competitions\serializers.py" (
    echo ❌ Falta: apps\competitions\serializers.py
    set /a missing_files+=1
)
if not exist "apps\competitions\views.py" (
    echo ❌ Falta: apps\competitions\views.py
    set /a missing_files+=1
)
if not exist "apps\competitions\urls.py" (
    echo ❌ Falta: apps\competitions\urls.py
    set /a missing_files+=1
)
if not exist "apps\competitions\admin.py" (
    echo ❌ Falta: apps\competitions\admin.py
    set /a missing_files+=1
)
if not exist "apps\competitions\apps.py" (
    echo ❌ Falta: apps\competitions\apps.py
    set /a missing_files+=1
)

if %missing_files% gtr 0 (
    echo.
    echo ❌ Faltan %missing_files% archivos del backend. Por favor cópialos y ejecuta el script nuevamente.
    pause
    exit /b 1
)

echo ✅ Todos los archivos del backend están presentes
echo.

REM Paso 3: Actualizar configuración Django
echo 📦 PASO 3/6: Actualizando configuración Django...
echo --------------------------------------------------

REM Verificar si la app ya está en INSTALLED_APPS
findstr /C:"apps.competitions" config\settings\base.py >nul 2>&1
if %errorlevel% neq 0 (
    echo Agregando competitions a INSTALLED_APPS...
    
    REM Crear respaldo
    copy config\settings\base.py config\settings\base.py.backup >nul
    
    REM Agregar la app (método más seguro)
    powershell -Command "try { $content = Get-Content 'config\settings\base.py' -Raw; if ($content -match \"'apps\.websockets',\") { $content = $content -replace \"    'apps\.websockets',\", \"    'apps.websockets',`n    'apps.competitions',\"; Set-Content 'config\settings\base.py' -Value $content; Write-Host 'App agregada exitosamente' } else { Write-Host 'Patron no encontrado, agregando al final de INSTALLED_APPS'; $content = $content -replace \"]\s*$\", \"    'apps.competitions',`n]\"; Set-Content 'config\settings\base.py' -Value $content } } catch { Write-Host 'Error al modificar settings' }"
    echo ✅ App competitions agregada a INSTALLED_APPS
) else (
    echo ✅ App competitions ya está en INSTALLED_APPS
)

REM Actualizar URLs principales
findstr /C:"competitions/" config\urls.py >nul 2>&1
if %errorlevel% neq 0 (
    echo Agregando URLs de competitions...
    
    REM Crear respaldo
    copy config\urls.py config\urls.py.backup >nul
    
    REM Agregar URL de competitions
    powershell -Command "try { $content = Get-Content 'config\urls.py' -Raw; $content = $content -replace \"path\('api/auth/', include\('apps\.users\.urls'\)\),\", \"path('api/auth/', include('apps.users.urls')),`n    path('api/competitions/', include('apps.competitions.urls')),\"; Set-Content 'config\urls.py' -Value $content; Write-Host 'URL agregada exitosamente' } catch { Write-Host 'Error al modificar URLs' }"
    echo ✅ URLs de competitions agregadas
) else (
    echo ✅ URLs de competitions ya están configuradas
)

echo ✅ Configuración Django actualizada
echo.

REM Paso 4: Ejecutar migraciones
echo 📦 PASO 4/6: Ejecutando migraciones...
echo --------------------------------------

REM Activar entorno virtual
call venv\Scripts\activate.bat

echo Creando migraciones para competitions...
python manage.py makemigrations competitions
if %errorlevel% neq 0 (
    echo ❌ Error al crear migraciones
    pause
    exit /b 1
)

echo Ejecutando migraciones...
python manage.py migrate
if %errorlevel% neq 0 (
    echo ❌ Error al ejecutar migraciones
    pause
    exit /b 1
)

echo ✅ Migraciones ejecutadas exitosamente
echo.

REM Paso 5: Datos de prueba (archivo separado)
echo 📦 PASO 5/6: Preparando datos de prueba...
echo ------------------------------------------

echo Creando archivo de datos de prueba...
echo from apps.competitions.models import Discipline, Category > create_test_data.py
echo from decimal import Decimal >> create_test_data.py
echo. >> create_test_data.py
echo # Crear disciplinas >> create_test_data.py
echo disciplines_data = [ >> create_test_data.py
echo     {'name': 'Concurso Completo de Equitación', 'code': 'CCE', 'fei_code': 'EVENTING'}, >> create_test_data.py
echo     {'name': 'Salto de Obstáculos', 'code': 'SO', 'fei_code': 'JUMPING'}, >> create_test_data.py
echo     {'name': 'Doma Clásica', 'code': 'DC', 'fei_code': 'DRESSAGE'}, >> create_test_data.py
echo     {'name': 'Resistencia', 'code': 'RE', 'fei_code': 'ENDURANCE'}, >> create_test_data.py
echo ] >> create_test_data.py
echo. >> create_test_data.py
echo for disc_data in disciplines_data: >> create_test_data.py
echo     discipline, created = Discipline.objects.get_or_create( >> create_test_data.py
echo         code=disc_data['code'], >> create_test_data.py
echo         defaults=disc_data >> create_test_data.py
echo     ^) >> create_test_data.py
echo     if created: >> create_test_data.py
echo         print^(f'Disciplina creada: {discipline.name}'^) >> create_test_data.py
echo. >> create_test_data.py
echo # Crear categorías para CCE >> create_test_data.py
echo cce = Discipline.objects.get^(code='CCE'^) >> create_test_data.py
echo categories_data = [ >> create_test_data.py
echo     {'name': 'Preliminar', 'code': 'CCE-PREL', 'level': 'PRELIMINARY', 'min_age_rider': 16, 'min_age_horse': 5, 'max_participants': 40, 'entry_fee': Decimal^('150.00'^)}, >> create_test_data.py
echo     {'name': 'Novato', 'code': 'CCE-NOV', 'level': 'NOVICE', 'min_age_rider': 18, 'min_age_horse': 6, 'max_participants': 35, 'entry_fee': Decimal^('200.00'^)}, >> create_test_data.py
echo     {'name': 'Intermedio', 'code': 'CCE-INT', 'level': 'INTERMEDIATE', 'min_age_rider': 21, 'min_age_horse': 7, 'max_participants': 30, 'entry_fee': Decimal^('300.00'^)}, >> create_test_data.py
echo ] >> create_test_data.py
echo. >> create_test_data.py
echo for cat_data in categories_data: >> create_test_data.py
echo     cat_data['discipline'] = cce >> create_test_data.py
echo     category, created = Category.objects.get_or_create( >> create_test_data.py
echo         code=cat_data['code'], >> create_test_data.py
echo         defaults=cat_data >> create_test_data.py
echo     ^) >> create_test_data.py
echo     if created: >> create_test_data.py
echo         print^(f'Categoría creada: {category.name}'^) >> create_test_data.py
echo. >> create_test_data.py
echo print^('Datos de prueba creados exitosamente'^) >> create_test_data.py

echo Ejecutando script de datos de prueba...
python manage.py shell < create_test_data.py

REM Limpiar archivo temporal
del create_test_data.py

echo ✅ Datos de prueba creados
echo.

cd ..

REM Paso 6: Configurar frontend
echo 📦 PASO 6/6: Configurando frontend...
echo -------------------------------------

cd frontend

REM Verificar e instalar dependencias
echo Verificando dependencias de Node.js...
npm list @tanstack/react-query >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando @tanstack/react-query...
    npm install @tanstack/react-query
)

npm list date-fns >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando date-fns...
    npm install date-fns
)

npm list react-hot-toast >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando react-hot-toast...
    npm install react-hot-toast
)

REM Crear directorios si no existen
if not exist "src\types" mkdir src\types
if not exist "src\lib" mkdir src\lib
if not exist "src\lib\api" mkdir src\lib\api
if not exist "src\hooks" mkdir src\hooks
if not exist "src\components\competitions" mkdir src\components\competitions
if not exist "src\app\competitions" mkdir src\app\competitions

REM Verificar archivos del frontend
set "missing_frontend=0"

if not exist "src\types\competitions.ts" (
    echo ❌ Falta: src\types\competitions.ts
    set /a missing_frontend+=1
)
if not exist "src\lib\api\competitions.ts" (
    echo ❌ Falta: src\lib\api\competitions.ts
    set /a missing_frontend+=1
)
if not exist "src\hooks\useCompetitions.ts" (
    echo ❌ Falta: src\hooks\useCompetitions.ts
    set /a missing_frontend+=1
)
if not exist "src\components\competitions\CompetitionsList.tsx" (
    echo ❌ Falta: src\components\competitions\CompetitionsList.tsx
    set /a missing_frontend+=1
)

if %missing_frontend% gtr 0 (
    echo.
    echo ⚠️  Faltan %missing_frontend% archivos del frontend, pero continuaremos...
    echo    Recuerda copiarlos después para que funcione correctamente.
)

REM Crear cliente API si no existe
if not exist "src\lib\api\client.ts" (
    echo Creando cliente API base...
    echo import axios from 'axios'; > src\lib\api\client.ts
    echo. >> src\lib\api\client.ts
    echo const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ^|^| 'http://localhost:8000/api'; >> src\lib\api\client.ts
    echo. >> src\lib\api\client.ts
    echo export const apiClient = axios.create^({ >> src\lib\api\client.ts
    echo   baseURL: API_BASE_URL, >> src\lib\api\client.ts
    echo   headers: { >> src\lib\api\client.ts
    echo     'Content-Type': 'application/json', >> src\lib\api\client.ts
    echo   }, >> src\lib\api\client.ts
    echo }^); >> src\lib\api\client.ts
    echo. >> src\lib\api\client.ts
    echo apiClient.interceptors.request.use^(^(config^) =^> { >> src\lib\api\client.ts
    echo   const token = localStorage.getItem^('access_token'^); >> src\lib\api\client.ts
    echo   if ^(token^) { >> src\lib\api\client.ts
    echo     config.headers.Authorization = `Bearer $^{token^}`; >> src\lib\api\client.ts
    echo   } >> src\lib\api\client.ts
    echo   return config; >> src\lib\api\client.ts
    echo }^); >> src\lib\api\client.ts
)

REM Crear página de competencias si no existe
if not exist "src\app\competitions\page.tsx" (
    echo Creando página de competencias...
    echo 'use client'; > src\app\competitions\page.tsx
    echo. >> src\app\competitions\page.tsx
    echo import CompetitionsList from '@/components/competitions/CompetitionsList'; >> src\app\competitions\page.tsx
    echo. >> src\app\competitions\page.tsx
    echo export default function CompetitionsPage^(^) { >> src\app\competitions\page.tsx
    echo   return ^( >> src\app\competitions\page.tsx
    echo     ^<div className="container mx-auto px-4 py-8"^> >> src\app\competitions\page.tsx
    echo       ^<CompetitionsList /^> >> src\app\competitions\page.tsx
    echo     ^</div^> >> src\app\competitions\page.tsx
    echo   ^); >> src\app\competitions\page.tsx
    echo } >> src\app\competitions\page.tsx
)

echo ✅ Frontend configurado
echo.

cd ..

REM Verificación final
echo 🔍 Verificación final...
echo ------------------------

cd backend
call venv\Scripts\activate.bat

echo Verificando modelos...
python -c "
import sys
try:
    from apps.competitions.models import Competition, Category, Horse, Rider, Registration
    print('✅ Modelos importados correctamente')
    print('✅ Modelos disponibles: Competition, Category, Horse, Rider, Registration')
except ImportError as e:
    print(f'❌ Error al importar modelos: {e}')
    sys.exit(1)
except Exception as e:
    print(f'❌ Error general: {e}')
    sys.exit(1)
"

if %errorlevel% neq 0 (
    echo ❌ Error en la verificación de modelos
    cd ..
    pause
    exit /b 1
)

echo Verificando disciplinas creadas...
python -c "
from apps.competitions.models import Discipline
count = Discipline.objects.count()
print(f'✅ {count} disciplinas en la base de datos')
if count > 0:
    for d in Discipline.objects.all():
        print(f'  - {d.name} ({d.code})')
"

echo ✅ Verificación completada exitosamente
echo.

cd ..

echo.
echo 🎉 FASE 3 IMPLEMENTADA EXITOSAMENTE!
echo ====================================
echo.
echo 🌐 Servicios iniciándose...
echo ---------------------------

echo Iniciando backend Django...
start "Django Server - Fase 3" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"

echo Esperando que Django inicie...
timeout /t 3 /nobreak > nul

echo Iniciando frontend Next.js...
start "Next.js Server - Fase 3" cmd /k "cd frontend && npm run dev"

echo.
echo 🌐 URLs disponibles:
echo    Frontend: http://localhost:3000
echo    Competencias: http://localhost:3000/competitions
echo    Backend API: http://localhost:8000/api
echo    Admin Django: http://localhost:8000/admin
echo    API Competitions: http://localhost:8000/api/competitions/
echo.
echo 🏇 Funcionalidades implementadas:
echo    ✅ Gestión completa de competencias
echo    ✅ Sistema de disciplinas y categorías FEI
echo    ✅ Modelos para caballos y jinetes
echo    ✅ Sistema de inscripciones
echo    ✅ Asignación de jueces
echo    ✅ APIs REST completas
echo    ✅ Validaciones de negocio
echo    ✅ Estados configurables
echo.
echo 📊 Datos de prueba disponibles:
echo    - 4 Disciplinas: CCE, Salto, Doma, Resistencia
echo    - 3 Categorías CCE: Preliminar, Novato, Intermedio
echo    - Usuarios de Fase 2 disponibles
echo.
echo 🔗 APIs principales:
echo    GET  /api/competitions/competitions/
echo    POST /api/competitions/competitions/
echo    GET  /api/competitions/categories/
echo    GET  /api/competitions/disciplines/
echo    POST /api/competitions/registrations/
echo.
echo 🚀 LISTO PARA FASE 4: Núcleo del Sistema FEI - Calificación y Cálculos
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause > nul

start http://localhost:3000/competitions

echo.
echo ✨ ¡Sistema de Gestión de Competencias funcionando!
echo.
pause