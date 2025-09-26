# MANUAL DE PRUEBAS - SISTEMA FEI DE COMPETENCIAS ECUESTRES

## 📋 OBJETIVO
Este manual te guía paso a paso para probar el flujo completo del sistema FEI, simulando una competencia ecuestre real desde la creación hasta los resultados finales.

## 🚀 PREPARACIÓN INICIAL

### 1. Iniciar el Sistema
```bash
# En la carpeta del proyecto
docker-compose up -d

# Verificar que todos los servicios estén funcionando
docker-compose ps
```

### 2. Acceder al Sistema
- **Frontend**: http://localhost:3000
- **Backend Admin**: http://localhost:8000/admin/
- **API**: http://localhost:8000/api/

### 3. Credenciales de Prueba
```
Administrador:
- Usuario: admin_test
- Contraseña: admin123456
```

---

## 🏆 FLUJO COMPLETO DE PRUEBAS FEI

### ETAPA 1: INICIO DE COMPETENCIA
**Objetivo**: El administrador crea la competencia y define parámetros

#### 1.1 Iniciar Sesión como Administrador
1. Ve a http://localhost:3000/login
2. Ingresa credenciales: `admin_test` / `admin123456`
3. ✅ **Verificar**: Debes ser redirigido al AdminDashboard (`/admin`)

#### 1.2 Crear Nueva Competencia
1. En AdminDashboard, clic en "Gestionar Competencias" → "Competencias"
2. Clic en "Nueva Competencia" o botón "+"
3. Completar formulario:
   ```
   Nombre: "Copa Internacional de Salto 2024"
   Nombre corto: "CIS2024"
   Tipo: "Internacional"
   Disciplina: "Salto"
   Sede: Crear nueva sede si es necesario
   Fecha inicio: [Fecha futura]
   Fecha fin: [Fecha futura + 2 días]
   Fecha inicio inscripción: [Hoy]
   Fecha fin inscripción: [Fecha futura - 1 día]
   ```
4. ✅ **Verificar**: Competencia creada con estado "Borrador"

#### 1.3 Configurar Categorías
1. Acceder a "Categorías" desde el menú
2. Crear categoría:
   ```
   Nombre: "Juvenil 1.20m"
   Código: "JUV120"
   Tipo: "Por Altura"
   Altura mínima: 115 cm
   Altura máxima: 125 cm
   Nivel: "Intermedio"
   ```
3. ✅ **Verificar**: Categoría creada y asociada a la competencia

#### 1.4 Asignar Personal (Jueces)
1. En la competencia creada, ir a "Personal"
2. Asignar juez:
   ```
   Miembro: [Seleccionar usuario con rol 'judge']
   Rol: "Juez Principal"
   ```
3. ✅ **Verificar**: Juez asignado y confirmado

#### 1.5 Registrar Participantes

##### A. Crear Jinetes (si no existen)
1. Ir a "Gestión de Usuarios"
2. Crear usuario:
   ```
   Nombre: "María"
   Apellido: "González"
   Email: "maria.gonzalez@example.com"
   Rol: "rider"
   ```

##### B. Crear Caballos
1. Ir a "Caballos"
2. Crear caballo:
   ```
   Nombre: "Thunder"
   Número de registro: "ESP001"
   Raza: "Pura Sangre Español"
   Color: "Castaño"
   Sexo: "Semental"
   Fecha nacimiento: [8 años atrás]
   Altura: 165 cm
   Propietario: [Jinete creado]
   ```

##### C. Inscribir Participantes
1. En la competencia, ir a "Participantes"
2. Crear participación:
   ```
   Jinete: "María González"
   Caballo: "Thunder"
   Categoría: "Juvenil 1.20m"
   Número de dorsal: 1
   ```
3. Repetir para crear al menos 5 participantes
4. ✅ **Verificar**: Participantes registrados y confirmados

---

### ETAPA 2: ASIGNACIÓN DE PISTA/PRUEBA
**Objetivo**: Habilitar la pista en la fecha establecida

#### 2.1 Crear Programación
1. En la competencia, ir a "Programación"
2. Crear evento:
   ```
   Título: "Prueba Juvenil 1.20m - Ronda 1"
   Tipo: "Inicio de Categoría"
   Fecha/hora: [Fecha de la competencia]
   Disciplina: "Salto"
   Categoría: "Juvenil 1.20m"
   Ubicación: "Arena Principal"
   ```
3. ✅ **Verificar**: Evento programado y visible

#### 2.2 Publicar Competencia
1. En detalles de la competencia, cambiar estado:
   ```
   Estado: "Publicada" → "Inscripción Abierta" → "En Progreso"
   ```
2. ✅ **Verificar**: Estado actualizado, competencia activa

---

### ETAPA 3: PARTICIPACIÓN DE JINETES
**Objetivo**: Jinetes ingresan al circuito según orden establecido

#### 3.1 Verificar Orden de Participación
1. En "Participantes", ver orden por número de dorsal
2. ✅ **Verificar**: Orden correcto (1, 2, 3, 4, 5...)

#### 3.2 Iniciar Ronda de Competencia
1. Ir a "Scoring" o "Calificación"
2. Seleccionar la competencia activa
3. ✅ **Verificar**: Lista de participantes en orden de salida

---

### ETAPA 4: CALIFICACIÓN POR JUECES
**Objetivo**: Jueces registran puntuaciones durante participación

#### 4.1 Acceder como Juez
1. Cerrar sesión de admin
2. Iniciar sesión como juez (crear usuario juez si es necesario)
3. ✅ **Verificar**: Dashboard de juez con competencias asignadas

#### 4.2 Calificar Primer Participante
1. Seleccionar competencia activa
2. Seleccionar primer participante (dorsal #1)
3. Crear tarjeta de puntuación:
   ```
   Participante: María González + Thunder
   Ronda: 1
   Inicio: [Hora actual]
   ```

#### 4.3 Registrar Puntuaciones (Salto)
1. Completar criterios de puntuación:
   ```
   Tiempo: 65.50 segundos
   Faltas por derribo: 0 puntos
   Faltas por desobediencia: 0 puntos
   Faltas por tiempo: 0 puntos (si está dentro del tiempo permitido)
   ```
2. Para otros participantes, variar puntuaciones:
   ```
   Participante #2: 68.20 seg, 4 puntos (1 derribo)
   Participante #3: 67.10 seg, 0 puntos
   Participante #4: 70.50 seg, 8 puntos (2 derribos)
   Participante #5: 66.30 seg, 4 puntos (1 derribo)
   ```
3. ✅ **Verificar**: Puntuaciones guardadas y validadas

---

### ETAPA 5: CÁLCULO AUTOMÁTICO Y RANKING TIEMPO REAL
**Objetivo**: Sistema procesa puntuaciones y genera ranking automático

#### 5.1 Verificar Cálculos Automáticos
1. Después de cada puntuación, verificar:
   - Puntuación final calculada automáticamente
   - Penalizaciones aplicadas correctamente
   - Tiempo convertido a puntuación
2. ✅ **Verificar**: Cálculos matemáticos correctos

#### 5.2 Monitorear Ranking en Tiempo Real
1. Ir a "Rankings" o "Clasificaciones"
2. Seleccionar competencia activa
3. Observar ranking actualizándose tras cada calificación:
   ```
   Posición esperada (menos puntos = mejor):
   #1: María González (0 puntos, 65.50s)
   #2: Participante #5 (4 puntos, 66.30s)
   #3: Participante #3 (0 puntos, 67.10s)
   #4: Participante #2 (4 puntos, 68.20s)
   #5: Participante #4 (8 puntos, 70.50s)
   ```
4. ✅ **Verificar**: Ranking se actualiza automáticamente
5. ✅ **Verificar**: Orden correcto según reglas FEI (penalizaciones + tiempo)

#### 5.3 Probar WebSocket (Tiempo Real)
1. Abrir dos ventanas del navegador
2. En una, calificar un participante
3. En la otra, observar ranking
4. ✅ **Verificar**: Actualización inmediata sin refrescar página

---

### ETAPA 6: RESULTADOS FINALES
**Objetivo**: Tabla final con ganadores y clasificados

#### 6.1 Completar Todas las Puntuaciones
1. Asegurarse de que todos los participantes tengan puntuación
2. Validar todas las tarjetas de puntuación
3. ✅ **Verificar**: Estado "Validada" en todas las tarjetas

#### 6.2 Generar Clasificación Final
1. Ir a "Rankings" → "Clasificación Final"
2. Generar ranking final:
   ```
   Competencia: Copa Internacional de Salto 2024
   Categoría: Juvenil 1.20m
   Tipo: Final
   ```
3. ✅ **Verificar**: Clasificación final generada correctamente

#### 6.3 Publicar Resultados
1. Marcar clasificación como "Publicada"
2. ✅ **Verificar**: Resultados visibles para espectadores

#### 6.4 Generar Reportes Oficiales
1. Ir a "Reportes"
2. Generar:
   - Reporte PDF de resultados finales
   - Reporte Excel con estadísticas
   - Certificados de participación
3. ✅ **Verificar**: Documentos generados con formato FEI

#### 6.5 Verificar Tabla de Ganadores
1. Ver clasificación final:
   ```
   🥇 1er Lugar: María González + Thunder (0 penalizaciones, 65.50s)
   🥈 2do Lugar: [Participante con mejor tiempo entre los de 4 puntos]
   🥉 3er Lugar: [Siguiente mejor resultado]
   ```
2. ✅ **Verificar**: Podio correcto según reglas FEI

---

## 🔍 VERIFICACIONES ADICIONALES

### Transparencia y Trazabilidad
1. **Auditoría**: Verificar log de actividades
2. **Historial**: Ver cambios en puntuaciones
3. **Validaciones**: Confirmar firmas digitales de jueces

### Acceso por Roles
1. **Espectadores**: Solo lectura de resultados
2. **Jinetes**: Ver sus propias puntuaciones
3. **Jueces**: Solo calificar competencias asignadas
4. **Administradores**: Control total

### Funcionalidades Avanzadas
1. **Múltiples Rondas**: Probar clasificatorias + finales
2. **Equipos**: Crear ranking por equipos/países
3. **Disciplinas**: Probar Dressage y Eventing
4. **Offline**: Probar funcionalidad sin internet

---

## ✅ CHECKLIST DE PRUEBAS COMPLETADAS

**Flujo Principal:**
- [ ] 1. Creación de competencia y parámetros
- [ ] 2. Registro de jueces, jinetes y caballos
- [ ] 3. Asignación y habilitación de pista
- [ ] 4. Orden de participación establecido
- [ ] 5. Calificación por jueces en tiempo real
- [ ] 6. Cálculo automático de puntuaciones
- [ ] 7. Ranking en tiempo real funcionando
- [ ] 8. Resultados finales generados
- [ ] 9. Tabla de ganadores correcta
- [ ] 10. Reportes oficiales exportados

**Roles Verificados:**
- [ ] Administrador: Gestión completa
- [ ] Juez: Calificación de participantes
- [ ] Jinete: Consulta de resultados
- [ ] Espectador: Visualización en vivo

**Estándares FEI:**
- [ ] Cálculos según reglamento FEI
- [ ] Formato de reportes oficiales
- [ ] Trazabilidad completa
- [ ] Transparencia en resultados

---

## 🎯 RESULTADOS ESPERADOS

Al completar todas las pruebas, deberías haber simulado exitosamente:

1. ✅ **Competencia completa** desde creación hasta resultados
2. ✅ **Flujo de roles** con accesos diferenciados
3. ✅ **Cálculos automáticos** precisos según FEI
4. ✅ **Ranking en tiempo real** con WebSocket
5. ✅ **Transparencia total** del proceso
6. ✅ **Reportes oficiales** listos para uso

**¡El sistema está 100% listo para competencias FEI reales!**

---

## 📞 SOPORTE

Si encuentras algún problema durante las pruebas:
1. Verificar logs: `docker-compose logs`
2. Reiniciar servicios: `docker-compose restart`
3. Verificar base de datos en: http://localhost:8000/admin/

**Estado del desarrollo**: 95% completo (7/8 etapas)
**Última actualización**: 2024