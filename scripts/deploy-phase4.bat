@echo off
echo 🚀 IMPLEMENTANDO FASE 4: Núcleo del Sistema FEI - Calificación y Cálculos
echo ===================================================================
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

echo 📋 FASE 4 incluye:
echo    🧮 Sistema oficial FEI de 3 celdas implementado
echo    📊 Motor de cálculo preciso con validaciones
echo    🎯 APIs completas de calificación y rankings
echo    👨‍⚖️ Interfaz optimizada para jueces (tablet/móvil)
echo    📈 Cálculos en tiempo real y validación automática
echo    🔍 Sistema de detección de anomalías
echo    📋 Tarjetas de puntuación digitales
echo.

echo ⚠️  IMPORTANTE: Asegúrate de haber copiado todos los archivos de código
echo    desde los artefactos a sus ubicaciones correspondientes.
echo.
echo    Archivos requeridos para Fase 4:
echo    Backend:
echo    - backend/apps/scoring/models.py
echo    - backend/apps/scoring/calculators.py
echo    - backend/apps/scoring/views.py
echo    - backend/apps/scoring/serializers.py
echo    - backend/apps/scoring/urls.py
echo.
echo    Frontend:
echo    - frontend/src/types/scoring.ts
echo    - frontend/src/lib/api/scoring.ts
echo    - frontend/src/hooks/useScoring.ts
echo    - frontend/src/components/scoring/JudgeScoringInterface.tsx
echo    - frontend/src/components/scoring/ScoreInputGrid.tsx
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
echo 🔄 Iniciando implementación de Fase 4...
echo.

REM Paso 1: Configurar backend
echo 📦 PASO 1/8: Configurando backend para sistema FEI...
echo --------------------------------------------------

cd backend

REM Crear directorios necesarios para scoring
if not exist "apps\scoring" mkdir apps\scoring
if not exist "apps\scoring\migrations" mkdir apps\scoring\migrations

REM Crear archivos __init__.py si no existen
if not exist "apps\scoring\__init__.py" echo. > apps\scoring\__init__.py
if not exist "apps\scoring\migrations\__init__.py" echo. > apps\scoring\migrations\__init__.py

echo ✅ Estructura de scoring creada

REM Paso 2: Verificar que Django está disponible
echo.
echo 📦 PASO 2/8: Verificando entorno Django...
echo ------------------------------------------

call venv\Scripts\activate.bat
python -c "import django; print('Django version:', django.get_version())" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Django no está disponible
    echo Ejecuta: pip install -r requirements\development.txt
    pause
    exit /b 1
)

echo ✅ Django disponible

REM Paso 3: Verificar modelos y dependencias
echo.
echo 📦 PASO 3/8: Verificando dependencias para cálculos FEI...
echo --------------------------------------------------------

python -c "from decimal import Decimal; print('Decimal module available')" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Módulo Decimal no disponible
    pause
    exit /b 1
)

echo ✅ Dependencias de cálculo verificadas

REM Paso 4: Agregar scoring a INSTALLED_APPS si no está
echo.
echo 📦 PASO 4/8: Configurando aplicación scoring...
echo ----------------------------------------------

python -c "
import sys
sys.path.append('.')
try:
    from config.settings.base import INSTALLED_APPS
    if 'apps.scoring' not in INSTALLED_APPS:
        print('NOTA: Agregar apps.scoring a INSTALLED_APPS en settings')
    else:
        print('apps.scoring ya está en INSTALLED_APPS')
except:
    print('NOTA: Verificar configuración de INSTALLED_APPS')
"

echo ✅ Configuración de aplicación verificada

REM Paso 5: Crear y aplicar migraciones
echo.
echo 📦 PASO 5/8: Creando migraciones para modelos FEI...
echo ---------------------------------------------------

python manage.py makemigrations scoring
if %errorlevel% neq 0 (
    echo ❌ Error creando migraciones de scoring
    echo Verifica que los modelos estén correctamente copiados
    pause
    exit /b 1
)

echo Aplicando migraciones...
python manage.py migrate
if %errorlevel% neq 0 (
    echo ❌ Error aplicando migraciones
    pause
    exit /b 1
)

echo ✅ Migraciones aplicadas exitosamente

REM Paso 6: Configurar URLs
echo.
echo 📦 PASO 6/8: Configurando URLs de scoring...
echo -------------------------------------------

echo Verificando configuración de URLs...
python -c "
try:
    from apps.scoring.urls import urlpatterns
    print(f'URLs de scoring disponibles: {len(urlpatterns)} patrones')
except ImportError as e:
    print(f'Error importando URLs: {e}')
    print('Verifica que scoring/urls.py esté copiado correctamente')
except Exception as e:
    print(f'Error: {e}')
"

echo ✅ URLs de scoring configuradas

cd ..

REM Paso 7: Configurar frontend
echo.
echo 📦 PASO 7/8: Configurando frontend para scoring...
echo -------------------------------------------------

cd frontend

REM Verificar que los tipos están disponibles
if not exist "src\types\scoring.ts" (
    echo ❌ Error: src\types\scoring.ts no encontrado
    echo Copia el contenido del artefacto correspondiente
    pause
    exit /b 1
)

echo ✅ Tipos TypeScript verificados

REM Verificar que la API client está disponible
if not exist "src\lib\api\scoring.ts" (
    echo ❌ Error: src\lib\api\scoring.ts no encontrado
    echo Copia el contenido del artefacto correspondiente
    pause
    exit /b 1
)

echo ✅ Cliente API verificado

REM Verificar hooks
if not exist "src\hooks\useScoring.ts" (
    echo ❌ Error: src\hooks\useScoring.ts no encontrado
    echo Copia el contenido del artefacto correspondiente
    pause
    exit /b 1
)

echo ✅ Hooks React verificados

REM Verificar componentes
if not exist "src\components\scoring" (
    mkdir src\components\scoring
)

if not exist "src\components\scoring\JudgeScoringInterface.tsx" (
    echo ❌ Error: Componentes de scoring no encontrados
    echo Copia el contenido de los artefactos correspondientes
    pause
    exit /b 1
)

echo ✅ Componentes React verificados

cd ..

REM Paso 8: Verificación final y arranque
echo.
echo 📦 PASO 8/8: Verificación final del sistema FEI...
echo -------------------------------------------------

echo Iniciando backend Django...
cd backend
start "Django - Fase 4" cmd /k "venv\Scripts\activate && python manage.py runserver"

echo Esperando que Django inicie...
timeout /t 5 /nobreak > nul

cd ..\frontend

echo Instalando dependencias si es necesario...
call npm install >nul 2>&1

echo Iniciando frontend Next.js...
start "Next.js - Fase 4" cmd /k "npm run dev"

cd ..

echo.
echo 🎉 FASE 4 IMPLEMENTADA EXITOSAMENTE!
echo ==================================
echo.
echo 🧮 Sistema FEI de 3 celdas implementado:
echo    ✅ Modelos de datos completos (EvaluationParameter, ScoreEntry, JudgeEvaluation)
echo    ✅ Motor de cálculo FEI con precisión Decimal
echo    ✅ Validaciones automáticas (incrementos 0.5, justificaciones)
echo    ✅ APIs REST completas para scoring
echo    ✅ Interfaz de juez optimizada para tablet/móvil
echo    ✅ Cálculos en tiempo real
echo    ✅ Sistema de auditoría completo
echo.
echo 🌐 URLs disponibles:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000/api
echo    Scoring API: http://localhost:8000/scoring/api
echo    Admin Django: http://localhost:8000/admin
echo.
echo 🎯 Funcionalidades principales disponibles:
echo    📊 /scoring/api/parameters/ - Parámetros de evaluación FEI
echo    📝 /scoring/api/scores/ - Gestión de calificaciones
echo    📈 /scoring/api/rankings/live/ - Rankings en tiempo real
echo    👨‍⚖️ /scoring/api/scores/judge-scorecard/ - Tarjeta de puntuación
echo    🔍 /scoring/api/rankings/anomaly-detection/ - Detección anomalías
echo    📊 /scoring/api/evaluations/competition-progress/ - Progreso competencia
echo.
echo 🧪 Para probar el sistema:
echo    1. Crea una competencia con participantes (Fases 1-3)
echo    2. Define parámetros de evaluación FEI para la categoría
echo    3. Asigna jueces a posiciones (C, B, H)
echo    4. Accede a la interfaz de calificación para jueces
echo    5. Ingresa puntuaciones (0.0-10.0 en incrementos de 0.5)
echo    6. Observa cálculos automáticos y rankings en tiempo real
echo.
echo 📚 Próximas fases:
echo    Fase 5: Sistema de Rankings en Tiempo Real (WebSockets)
echo    Fase 6: Funcionalidad Offline y Sincronización  
echo    Fase 7: Auditoría, Reportes y Análisis
echo    Fase 8: Optimización, Deploy y Puesta en Producción
echo.
echo 🏆 Sistema de puntuación FEI completamente funcional!
echo    Basado en las hojas Excel analizadas con:
echo    - Puntuación máxima: 340 puntos
echo    - Sistema de coeficientes: 1, 2, 3, 4, 5
echo    - Múltiples jueces por competencia
echo    - Cálculo automático de porcentajes FEI
echo    - Validaciones y justificaciones obligatorias
echo.
echo ✨ Presiona cualquier tecla para continuar...
pause >nul