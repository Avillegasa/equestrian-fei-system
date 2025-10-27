# Phase 3: Excel Import/Export - Setup Instructions

## ✅ Implementación Completada

Se ha implementado completamente el sistema de importación/exportación de Excel para manejar las tablas de cómputos oficiales de FEI.

---

## 📦 Instalación Requerida

Para que el sistema funcione, necesitas instalar la librería `xlsx` (SheetJS).

### Comando de Instalación:

```bash
cd equestrian-fei-system/frontend
npm install xlsx
```

**Nota:** Detén el servidor de desarrollo antes de ejecutar npm install, luego reinícialo.

---

## 🎯 Funcionalidades Implementadas

### 1. **Servicio de Excel** (`frontend/src/services/excelService.js`)

Funciones principales:
- `readExcelFile(file)` - Lee archivos .xlsx y .xls
- `parseDressageTable(excelData)` - Parsea tablas de adiestramiento automáticamente
- `exportCompetitionScores(...)` - Exporta resultados completos con 3 hojas:
  - Hoja 1: Resumen general (competencia, jueces, estadísticas)
  - Hoja 2: Calificaciones detalladas (por participante y juez)
  - Hoja 3: Ranking final ordenado
- `exportBlankScoringTemplate(...)` - Exporta plantilla vacía para calificar offline

### 2. **Modal de Importación** (`frontend/src/components/ImportExcelModal.jsx`)

Características:
- Drag & drop o selector de archivos
- Vista previa automática de la tabla
- Validación de estructura
- Detección automática de ejercicios y notas de conjunto
- Muestra ejercicios, coeficientes y puntuación máxima

### 3. **Integración en ScoringPage**

Para **Admins y Organizadores**:
- Botón "Importar Tabla de Cómputos" (solo en modo Dressage)
- Botón "Exportar Resultados Completos" (habilitado cuando hay calificaciones)
- Plantillas importadas aparecen en el selector de tablas
- Las plantillas se guardan en localStorage

---

## 📋 Cómo Usar

### Importar una Tabla de Cómputos:

1. Inicia sesión como **Admin** o **Organizador**
2. Ve a la página de calificación de cualquier competencia
3. Asegúrate de estar en modo **Dressage/Adiestramiento**
4. En la sección "Gestión de Excel", haz clic en **"Importar Tabla de Cómputos"**
5. Selecciona tu archivo .xlsx (por ejemplo, los que están en `/computing tables/TABLAS DE COMPUTOS ADIESTRAMIENTO/`)
6. Revisa la vista previa automática
7. Haz clic en **"Importar Tabla"**
8. La tabla aparecerá en el selector de "Tabla de Cómputos" con el sufijo "(Importada)"

### Exportar Resultados:

1. Una vez que tengas calificaciones registradas
2. En la página de calificación, haz clic en **"Exportar Resultados Completos"**
3. Se descargará un archivo Excel con:
   - Resumen de la competencia
   - Calificaciones por participante y juez
   - Ranking final con promedios
   - Toda la información formateada profesionalmente

---

## 🔍 Formato de Excel Esperado para Importación

El parser detecta automáticamente la estructura, pero funciona mejor con:

### Estructura Recomendada:

```
Título de la Tabla (Fila 1-5)

EJERCICIOS / MOVEMENTS
#  | Descripción              | Coeficiente
1  | Entrada y alto           | 1
2  | Círculo 20m              | 2
...

NOTAS DE CONJUNTO / COLLECTIVE MARKS
#  | Aspecto                  | Coeficiente
1  | Aires                    | 1
2  | Impulsión                | 2
...
```

### Palabras Clave Detectadas:
- **Ejercicios:** "exercise", "ejercicio", "movement"
- **Notas de Conjunto:** "collective", "conjunto", "general"
- **Coeficientes:** Se detectan automáticamente en la última columna numérica

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:
1. `frontend/src/services/excelService.js` - Servicio completo de Excel
2. `frontend/src/components/ImportExcelModal.jsx` - Modal de importación
3. `PHASE3_EXCEL_SETUP.md` - Este archivo de instrucciones

### Archivos Modificados:
1. `frontend/src/pages/ScoringPage.jsx` - Integración de import/export
   - Importaciones de servicios y componentes
   - Estados para plantillas personalizadas
   - Funciones handleImportTemplate, handleExportResults
   - UI con botones de import/export
   - Modal de importación

---

## 🧪 Pruebas Recomendadas

### Test 1: Importar Tabla Existente
1. Usa uno de los archivos en `computing tables/TABLAS DE COMPUTOS ADIESTRAMIENTO/`
2. Verifica que se detecten todos los ejercicios
3. Confirma que los coeficientes estén correctos
4. Verifica que la puntuación máxima se calcule bien

### Test 2: Calificar con Tabla Importada
1. Importa una tabla
2. Selecciónala en el dropdown
3. Califica un participante
4. Verifica que los cálculos sean correctos

### Test 3: Exportar Resultados
1. Crea varias calificaciones con múltiples jueces
2. Exporta los resultados
3. Abre el Excel generado
4. Verifica las 3 hojas (Resumen, Calificaciones, Ranking)
5. Confirma que los promedios y posiciones sean correctos

---

## 🚀 Próximos Pasos

Una vez que instales la dependencia `xlsx`, podrás:
- ✅ Importar tus tablas de cómputos oficiales
- ✅ Exportar resultados completos profesionalmente
- ✅ Reemplazar completamente el uso de papel/Excel durante competencias

**Siguiente Fase:** Phase 4 - Modo Offline Robusto (PWA, Service Workers, IndexedDB)

---

## 💡 Notas Técnicas

- Las plantillas importadas se guardan en `localStorage` con clave: `fei_custom_templates`
- Los archivos Excel se procesan completamente en el frontend (sin backend)
- Compatible con formatos .xlsx y .xls
- Tamaño máximo recomendado: 10MB
- La exportación usa formato XLSX (Excel 2007+)

---

## ⚠️ Troubleshooting

### Si al importar aparece error:
1. Verifica que el archivo sea .xlsx o .xls válido
2. Asegúrate de que tenga las palabras clave ("ejercicio", "collective", etc.)
3. Revisa que los coeficientes sean números en la última columna

### Si la exportación no funciona:
1. Confirma que tengas calificaciones registradas
2. Verifica que haya jueces asignados en la competencia
3. Revisa la consola del navegador para errores

---

**¡Sistema de Excel Listo para Uso Profesional!** 🎉
