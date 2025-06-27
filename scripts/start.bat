@echo off
echo 🚀 Iniciando Sistema FEI...

echo 🔍 Verificando servicios...

REM Verificar PostgreSQL
pg_isready -h localhost -p 5432 >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL no está ejecutándose
    echo Por favor inicia PostgreSQL antes de continuar
    pause
    exit /b 1
)
echo ✅ PostgreSQL: EJECUTÁNDOSE

REM Verificar Redis (puede estar como servicio de Windows)
redis-cli ping >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Redis no responde al ping, pero puede estar ejecutándose como servicio
) else (
    echo ✅ Redis: EJECUTÁNDOSE
)

echo ✅ Servicios verificados
echo.
echo 📝 Comandos para iniciar el desarrollo:
echo.
echo Terminal 1 (Backend):
echo cd backend && venv\Scripts\activate && python manage.py runserver
echo.
echo Terminal 2 (Frontend):
echo cd frontend && npm run dev
echo.
echo 🌐 URLs disponibles:
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
echo Admin: http://localhost:8000/admin (admin/admin123)
echo API Docs: http://localhost:8000/api/docs
pause