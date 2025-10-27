● Plan de Pruebas del Sistema FEI - Equestrian Competition Management

  Basándome en el análisis del sistema y tu flujo propuesto, aquí está el
  plan detallado de pruebas para presentar al stakeholder:

  ---
  📋 PLAN DE PRUEBAS COMPLETO

  Objetivo

  Validar el flujo completo del sistema desde la creación de competencias
  hasta la visualización de resultados en tiempo real, cubriendo todos los
  roles: Organizador, Juez, Jinete (Rider) y Espectador (Viewer).

  ---
  🎯 FLUJO DE PRUEBAS DETALLADO

  FASE 1: CONFIGURACIÓN INICIAL (Admin)

  Objetivo: Preparar el sistema con usuarios y categorías necesarias

  Test 1.1: Acceso al Sistema Admin

  - Abrir navegador y acceder a http://localhost:5173
  - Login con credenciales: admin / admin123
  - Verificar redirección a /admin (Dashboard Admin)
  - Verificar que se muestran 6 botones de acción

  Test 1.2: Gestión de Usuarios

  - Click en botón "👥 Usuarios"
  - Verificar lista de usuarios existentes
  - Crear usuario Organizador:
    - Username: organizer_test
    - Email: organizer@test.com
    - Role: organizer
    - Password: org123test
  - Crear usuario Juez:
    - Username: judge_test
    - Email: judge@test.com
    - Role: judge
    - Password: judge123test
  - Crear usuario Jinete/Rider:
    - Username: rider_test
    - Email: rider@test.com
    - Role: rider
    - Password: rider123test
  - Crear usuario Espectador/Viewer:
    - Username: viewer_test
    - Email: viewer@test.com
    - Role: viewer
    - Password: viewer123test

  Test 1.3: Gestión de Categorías

  - Regresar al Dashboard Admin
  - Click en botón "📂 Categorías"
  - Verificar redirección a /admin/categories
  - Crear categoría de prueba:
    - Nombre: Salto - Nivel 1 - Junior
    - Disciplina: Show Jumping
    - Edad mínima: 12
    - Edad máxima: 18
    - Altura mínima: 1.20m
    - Altura máxima: 1.40m
    - Tarifa: $150.00
    - Límite de participantes: 30
  - Verificar que la categoría se guarda correctamente
  - Verificar que aparece en la lista con estado "Activa"

  ---
  FASE 2: CREACIÓN DE COMPETENCIA (Organizador)

  Objetivo: Crear y configurar una competencia completa

  Test 2.1: Login como Organizador

  - Cerrar sesión del Admin
  - Login con: organizer_test / org123test
  - Verificar redirección a /organizer (Dashboard Organizador)
  - Verificar que se muestran 5 botones de acción

  Test 2.2: Crear Competencia Manual

  - Click en botón "🏆 Competencias"
  - Verificar redirección a /organizer/competitions
  - Click en botón "➕ Crear Competencia"
  - Completar formulario:
    - Nombre: Copa Nacional de Salto 2025
    - Disciplina: Show Jumping
    - Ubicación: Club Hípico Nacional
    - Fecha inicio: 2025-11-15 09:00
    - Fecha fin: 2025-11-17 18:00
    - Descripción: Competencia nacional FEI de salto ecuestre
    - Categorías: Seleccionar la categoría creada anteriormente
  - Click en "Crear Competencia"
  - Verificar mensaje de éxito
  - Verificar que la competencia aparece en la lista

  Test 2.3: Crear Competencia con Plantilla (Opcional)

  - Click en "➕ Crear Competencia"
  - Click en pestaña "Usar Plantilla"
  - Verificar que aparecen plantillas disponibles
  - Seleccionar plantilla de ejemplo
  - Verificar que los campos se llenan automáticamente
  - Modificar datos según necesidad
  - Crear competencia

  Test 2.4: Importar Competencia con Excel (Opcional)

  - Click en "➕ Crear Competencia"
  - Click en pestaña "Importar Excel"
  - Click en "📥 Descargar Plantilla Excel"
  - Verificar descarga de archivo competition_template.xlsx
  - Abrir Excel, llenar con datos de prueba
  - Subir archivo Excel al sistema
  - Verificar importación exitosa
  - Revisar datos importados

  Test 2.5: Asignar Jueces a la Competencia

  - En la lista de competencias, localizar "Copa Nacional de Salto 2025"
  - Click en botón "👥 Personal"
  - Verificar redirección a /admin/competitions/:id/staff
  - Click en "➕ Agregar Staff"
  - Seleccionar rol: Judge
  - Buscar y seleccionar: judge_test
  - Asignar responsabilidades: Calificación técnica - Salto
  - Click en "Asignar"
  - Verificar que el juez aparece en la lista de personal
  - Verificar estado: Pendiente de confirmación

  ---
  FASE 3: CONFIRMACIÓN DE JUEZ

  Objetivo: Validar que el juez puede confirmar su participación

  Test 3.1: Login como Juez

  - Cerrar sesión del Organizador
  - Login con: judge_test / judge123test
  - Verificar redirección a /judge (Dashboard Juez)
  - Verificar que se muestran 4 botones de acción

  Test 3.2: Ver Competencias Asignadas

  - Click en botón "🏆 Competencias"
  - Verificar redirección a /judge/competitions
  - Verificar que aparece "Copa Nacional de Salto 2025"
  - Verificar indicador de "Pendiente de confirmación"

  Test 3.3: Confirmar Participación

  - Click en la competencia "Copa Nacional de Salto 2025"
  - Verificar detalles de la competencia
  - Click en botón "✅ Confirmar Participación"
  - Verificar mensaje de confirmación exitosa
  - Verificar cambio de estado a "Confirmado"

  Test 3.4: Acceder a Sistema de Calificación (Sin Participantes)

  - Click en botón "⚖️ Calificar"
  - Verificar redirección a /judge/scoring/:id
  - Verificar que se muestra interfaz de calificación
  - VALIDAR MENSAJE IMPORTANTE:
  📋 No hay participantes inscritos

  Esta competencia aún no tiene participantes registrados.
  Los participantes podrán inscribirse desde su dashboard de Rider.
  - Verificar que NO aparece lista de participantes
  - Verificar que NO hay estadísticas disponibles

  ---
  FASE 4: INSCRIPCIÓN DE PARTICIPANTE (Rider)

  Objetivo: Validar que los jinetes pueden inscribirse a competencias

  Test 4.1: Login como Rider

  - Cerrar sesión del Juez
  - Login con: rider_test / rider123test
  - Verificar redirección a /rider (Dashboard Rider)
  - Verificar botones disponibles

  Test 4.2: Ver Lista de Competencias Disponibles

  - Click en botón "🏆 Lista de Competencias"
  - Verificar lista de competencias públicas
  - Localizar "Copa Nacional de Salto 2025"
  - Verificar información mostrada:
    - Nombre de competencia
    - Fechas
    - Ubicación
    - Disciplina
    - Estado (Abierta/Cerrada)

  Test 4.3: Inscribirse a Competencia

  - Click en botón "✅ Inscribirse" en "Copa Nacional de Salto 2025"
  - Verificar modal de inscripción
  - Completar datos del participante:
    - Nombre del jinete: Juan Pérez
    - Nombre del caballo: Thunder
    - Número de registro FEI: FEI-2025-001
    - Categoría: Seleccionar categoría disponible
    - Nacionalidad: México
  - Click en "Confirmar Inscripción"
  - Verificar mensaje de éxito
  - Verificar cambio de botón a "✓ Inscrito"

  Test 4.4: Ver Marcador/Rankings

  - Click en botón "Ver Marcador" o "📊 Rankings"
  - Verificar redirección a /rankings/:id
  - Verificar sección superior con detalles de competencia
  - VALIDAR MENSAJE (antes de calificaciones):
  ⏳ Rankings en proceso

  Los rankings se generarán una vez que los jueces comiencen
  a registrar calificaciones.

  Test 4.5: Ver Perfil Personal

  - Regresar al Dashboard Rider
  - Click en botón "👤 Perfil"
  - Verificar información personal del rider
  - Verificar lista de competencias inscritas
  - Verificar historial de participaciones

  ---
  FASE 5: CALIFICACIÓN POR JUEZ

  Objetivo: Validar sistema de calificación FEI

  Test 5.1: Regresar como Juez

  - Cerrar sesión del Rider
  - Login con: judge_test / judge123test
  - Ir a Dashboard Juez

  Test 5.2: Acceder a Sistema de Calificación (Con Participantes)

  - Click en "🏆 Competencias"
  - Click en "Copa Nacional de Salto 2025"
  - Click en botón "⚖️ Calificar"
  - Verificar redirección a /judge/scoring/:id
  - VALIDAR QUE AHORA SÍ APARECE:
    - Lista de participantes inscritos
    - Nombre: Juan Pérez
    - Caballo: Thunder
    - Número FEI: FEI-2025-001
    - Estado: Pendiente de calificación

  Test 5.3: Calificar Participante

  - Click en botón "📝 Calificar" del participante
  - Verificar apertura de modal de calificación FEI
  - Completar datos según disciplina (Show Jumping):
    - Tiempo de ejecución: 65.5 segundos
    - Faltas técnicas: 0
    - Penalizaciones por tiempo: 0
    - Puntos técnicos: 85
    - Notas del juez: Excelente ejecución, saltos limpios
  - Click en "Guardar Calificación"
  - Verificar mensaje de éxito
  - Verificar que el estado cambia a "Calificado"
  - Verificar que aparece el puntaje total calculado

  Test 5.4: Calificar Múltiples Participantes (Opcional)

  - Inscribir 2-3 participantes más desde otros riders
  - Calificar cada uno con diferentes puntajes
  - Verificar cálculo automático de rankings
  - Verificar actualización de estadísticas en tiempo real

  ---
  FASE 6: VISUALIZACIÓN DE RESULTADOS (Todos los Roles)

  Objetivo: Validar acceso a rankings en tiempo real

  Test 6.1: Rankings desde Rider

  - Login como rider_test
  - Ir a "🏆 Lista de Competencias"
  - Click en "📊 Ver Rankings" de la competencia
  - Verificar tabla de clasificación:
    - Posición
    - Jinete
    - Caballo
    - Puntuación total
    - Tiempo
    - Faltas
    - Estado
  - Verificar que "Juan Pérez / Thunder" aparece en posición correcta
  - Verificar botón de actualización automática
  - Cambiar frecuencia de actualización (10s, 30s, 1min, 5min)

  Test 6.2: Rankings desde Espectador/Viewer

  - Cerrar sesión del Rider
  - Login con: viewer_test / viewer123test
  - Verificar Dashboard Viewer
  - Click en "🏆 Lista de Competencias"
  - Localizar "Copa Nacional de Salto 2025"
  - Click en "📊 Ver Resultados"
  - Verificar misma tabla de rankings
  - Verificar actualización en tiempo real
  - NO debe poder editar ni calificar

  Test 6.3: Rankings desde Juez

  - Login como judge_test
  - Ir a Dashboard Juez
  - Click en "📊 Rankings"
  - Seleccionar "Copa Nacional de Salto 2025"
  - Verificar rankings actualizados
  - Verificar que puede ver sus propias calificaciones

  Test 6.4: Rankings desde Organizador

  - Login como organizer_test
  - Ir a "🏆 Competencias"
  - Click en "📊 Rankings" de la competencia
  - Verificar vista completa de resultados
  - Verificar estadísticas generales
  - Verificar participación total

  Test 6.5: Rankings desde Admin

  - Login como admin
  - Ir a /admin/competitions
  - Click en "📊 Rankings" de cualquier competencia
  - Verificar acceso completo a todos los datos

  ---
  FASE 7: FUNCIONALIDADES ADICIONALES

  Objetivo: Validar características complementarias

  Test 7.1: Gestión de Personal (Organizador/Admin)

  - Como Organizador, ir a competencia
  - Click en "👥 Personal"
  - Agregar staff adicional:
    - Veterinario
    - Steward
    - Coordinador técnico
  - Verificar lista actualizada

  Test 7.2: Gestión de Participantes (Organizador/Admin)

  - Como Organizador, ir a competencia
  - Click en "🏇 Participantes"
  - Verificar lista completa de inscritos
  - Verificar detalles de cada participante
  - Verificar estado de pago (si aplica)

  Test 7.3: Programación de Eventos (Organizador/Admin)

  - Como Organizador, ir a competencia
  - Click en "📋 Programación"
  - Crear evento:
    - Nombre: Primera Ronda - Salto Individual
    - Fecha: 2025-11-15 10:00
    - Duración: 3 horas
    - Categoría: Seleccionar
  - Verificar calendario actualizado

  Test 7.4: Reportes y Estadísticas (Admin/Organizador)

  - Como Admin, ir a "📊 Reportes"
  - Generar reporte de competencia
  - Verificar exportación a PDF
  - Verificar exportación a Excel
  - Validar formato FEI compliance

  Test 7.5: Perfil de Usuario (Todos los Roles)

  - Desde cada rol, ir a "👤 Perfil"
  - Verificar datos personales
  - Editar información:
    - Nombre
    - Email
    - Teléfono
    - Foto de perfil
  - Cambiar contraseña
  - Verificar actualización exitosa

  ---
  🔄 PRUEBAS DE ACTUALIZACIÓN EN TIEMPO REAL

  Test RT.1: WebSocket Rankings

  - Abrir dos navegadores simultáneamente
  - Browser 1: Login como Juez
  - Browser 2: Login como Viewer
  - En Browser 1: Calificar un participante
  - En Browser 2: Verificar actualización automática de rankings
  - Cambiar frecuencia de actualización
  - Verificar sincronización correcta

  Test RT.2: Notificaciones en Tiempo Real

  - Como Organizador, asignar nuevo juez
  - Verificar que el Juez recibe notificación
  - Como Rider, inscribirse a competencia
  - Verificar que Organizador recibe notificación

  ---
  📱 PRUEBAS DE RESPONSIVIDAD

  Test RESP.1: Diseño Móvil

  - Abrir sistema en dispositivo móvil (o modo responsive)
  - Verificar que todos los dashboards se adaptan
  - Verificar modales funcionan en móvil
  - Verificar tablas son scrollables

  Test RESP.2: Diferentes Navegadores

  - Probar en Chrome
  - Probar en Firefox
  - Probar en Safari
  - Probar en Edge
  - Verificar consistencia visual

  ---
  ⚠️ PRUEBAS DE MANEJO DE ERRORES

  Test ERR.1: Datos Inválidos

  - Intentar crear competencia con fecha pasada
  - Intentar asignar juez inexistente
  - Intentar calificar con valores fuera de rango
  - Verificar mensajes de error claros

  Test ERR.2: Permisos y Accesos

  - Como Viewer, intentar acceder a /admin
  - Como Rider, intentar acceder a /judge/scoring
  - Como Juez, intentar acceder a /organizer/competitions
  - Verificar redirección y mensajes apropiados

  Test ERR.3: Persistencia de Datos

  - Crear competencia
  - Cerrar navegador completamente
  - Reabrir y login nuevamente
  - Verificar que los datos persisten (localStorage)

  ---
  📊 CHECKLIST FINAL PARA STAKEHOLDER

  ✅ Funcionalidades Core

  - Sistema de autenticación funcional para todos los roles
  - CRUD completo de competencias
  - CRUD completo de categorías
  - Sistema de asignación de jueces
  - Confirmación de participación de jueces
  - Inscripción de riders
  - Sistema de calificación FEI
  - Rankings en tiempo real
  - Gestión de personal y participantes
  - Programación de eventos

  ✅ Experiencia de Usuario

  - Interfaz intuitiva y profesional
  - Mensajes claros de éxito/error
  - Estados vacíos informativos
  - Navegación fluida entre secciones
  - Diseño responsive

  ✅ Seguridad y Permisos

  - Control de acceso basado en roles
  - Protección de rutas sensibles
  - Validación de datos en frontend y backend

  ✅ Rendimiento

  - Carga rápida de dashboards
  - Actualización eficiente de rankings
  - Persistencia de datos confiable

  ---
  📝 NOTAS PARA LA DEMOSTRACIÓN

  Preparación Previa

  1. Limpiar localStorage si es necesario
  2. Tener usuarios de prueba creados
  3. Preparar archivo Excel de ejemplo
  4. Tener datos de ejemplo listos para calificación

  Flujo Recomendado para Demo

  1. Inicio (5 min): Login Admin → Crear usuarios y categorías
  2. Organización (10 min): Login Organizador → Crear competencia → Asignar
  jueces
  3. Confirmación (3 min): Login Juez → Confirmar participación → Ver
  interfaz sin participantes
  4. Inscripción (5 min): Login Rider → Inscribirse → Ver perfil
  5. Calificación (7 min): Login Juez → Calificar participantes → Ver
  estadísticas
  6. Resultados (5 min): Login Viewer → Ver rankings en tiempo real
  7. Cierre (5 min): Mostrar reportes y funcionalidades adicionales

  Puntos Clave a Destacar

  - ✨ Interfaz profesional y moderna
  - ⚡ Actualización en tiempo real sin recargar página
  - 🔒 Seguridad y control de acceso robusto
  - 📊 Cumplimiento con estándares FEI
  - 💾 Persistencia de datos confiable
  - 📱 Diseño responsive para todos los dispositivos

  ---
  🎯 RESULTADO ESPERADO

  Al completar este plan de pruebas, deberás poder demostrar:

  1. ✅ Sistema completo funcional desde creación hasta visualización
  2. ✅ Todos los roles operativos con permisos correctos
  3. ✅ Flujo de datos coherente entre componentes
  4. ✅ Interfaz profesional adecuada para usuarios expertos
  5. ✅ Rankings en tiempo real con actualización automática
  6. ✅ Manejo de errores robusto con mensajes claros
  7. ✅ Sistema listo para producción con todas las funcionalidades FEI

  ---
  Tiempo estimado total de pruebas: 2-3 horasNivel de complejidad:
  Intermedio-AvanzadoRequerimientos técnicos: Navegador moderno, conexión
  estable
