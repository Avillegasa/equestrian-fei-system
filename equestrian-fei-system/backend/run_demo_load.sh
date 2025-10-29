#!/usr/bin/env bash
# Script helper para ejecutar load_demo_data.py
# Uso: ./run_demo_load.sh

set -o errexit

echo "========================================"
echo "  CARGA DE DATOS DE DEMOSTRACIÓN"
echo "  FEI Equestrian System"
echo "========================================"
echo ""

if [ -d "venv" ]; then
    echo "🐍 Activando entorno virtual..."
    source venv/bin/activate
fi

echo "🚀 Ejecutando script de carga..."
python load_demo_data.py

echo ""
echo "========================================"
echo "✅ Proceso completado"
echo "========================================"
echo ""
echo "Próximos pasos:"
echo "1. Verificar datos en Django Admin"
echo "2. Probar frontend: http://localhost:5173"
echo "3. Login: admin / admin123"
echo ""
