# 📊 Guía de Datos de Demostración - Sistema FEI

**Fecha de creación:** 29 de Octubre, 2025
**Sistema:** FEI Equestrian Competition Management System
**Propósito:** Datos realistas para demostración a stakeholders finales

---

## 🎯 Objetivo

Este script carga datos completos y realistas de competencias de **Doma Clásica (Dressage)** completadas, incluyendo:
- 20 usuarios con diferentes roles
- 5 competencias internacionales/nacionales completadas
- 63 participantes totales
- Scores realistas con criterios FEI
- Rankings finales calculados
- 25 caballos registrados

---

## 📋 Datos Cargados

### 👥 Usuarios (20 total)

#### **Administradores (3)**
| Username | Password | Nombre Completo | Email |
|----------|----------|-----------------|-------|
| `admin` | `admin123` | Admin FEI | admin@equestrian-fei.com |
| `admin_fei` | `admin123` | Carlos Rodríguez | admin.fei@fei.org |
| `admin_rfhe` | `admin123` | María González | admin@rfhe.com |

#### **Organizadores (3)**
| Username | Password | Nombre Completo | Organización |
|----------|----------|-----------------|--------------|
| `organizer1` | `org123` | Organizador Prueba | Federación Ecuestre Test |
| `org_madrid` | `org123` | Juan Martínez | Club Hípico de Madrid |
| `org_barcelona` | `org123` | Laura Sánchez | Real Club de Polo de Barcelona |

#### **Jueces (5)**
| Username | Password | Nombre Completo | Certificación | Licencia |
|----------|----------|-----------------|---------------|----------|
| `judge1` | `judge123` | Juez Prueba | Nacional | ESP-J-001 |
| `judge_fei_5star` | `judge123` | Sophie Dubois | FEI 5* | FRA-FEI-5-001 |
| `judge_fei_4star` | `judge123` | Klaus Schmidt | FEI 4* | GER-FEI-4-001 |
| `judge_nacional_1` | `judge123` | Ana Fernández | Nacional | ESP-J-002 |
| `judge_nacional_2` | `judge123` | Pedro López | Nacional | ESP-J-003 |

#### **Jinetes/Riders (9)**
| Username | Password | Nombre Completo | Nacionalidad |
|----------|----------|-----------------|--------------|
| `rider_alvarez` | `rider123` | Beatriz Álvarez | España |
| `rider_garcia` | `rider123` | Javier García | España |
| `rider_martin` | `rider123` | Isabel Martín | España |
| `rider_moreau` | `rider123` | Jean Moreau | France |
| `rider_mueller` | `rider123` | Hans Müller | Germany |
| `rider_santos` | `rider123` | Ana Santos | Portugal |
| `rider_brown` | `rider123` | James Brown | United Kingdom |
| `rider_rossi` | `rider123` | Giulia Rossi | Italy |
| `rider_schmidt` | `rider123` | Anna Schmidt | Germany |

---

### 🏆 Competencias (5 completadas)

#### **1. CDI4* Madrid Spring Tour**
- **Sede:** Club Hípico de Madrid
- **Fechas:** Hace 1 mes (3 días de competencia)
- **Tipo:** Internacional 4 estrellas
- **Categorías:** Grand Prix, Intermediate II, Young Rider
- **Participantes:** 15
- **Premio:** €15,000
- **Estado:** ✅ Completada con rankings finales

#### **2. CDI3* Barcelona Dressage Cup**
- **Sede:** Real Club de Polo de Barcelona
- **Fechas:** Hace 2 meses
- **Tipo:** Internacional 3 estrellas
- **Categorías:** Grand Prix, Intermediate I, Junior
- **Participantes:** 12
- **Premio:** €10,000
- **Estado:** ✅ Completada con rankings finales

#### **3. Campeonato Nacional de Doma**
- **Sede:** Centro Ecuestre Dehesa Montenmedio (Cádiz)
- **Fechas:** Hace 3 semanas
- **Tipo:** Campeonato Nacional
- **Categorías:** Senior, Amateur, Young Rider
- **Participantes:** 14
- **Premio:** €8,000
- **Estado:** ✅ Completada con rankings finales

#### **4. CDI3* Valencia Winter Show**
- **Sede:** Centro Hípico Internacional Valencia
- **Fechas:** Hace 1.5 meses
- **Tipo:** Internacional 3 estrellas
- **Categorías:** Grand Prix, Intermediate I
- **Participantes:** 10
- **Premio:** €9,000
- **Estado:** ✅ Completada con rankings finales

#### **5. Andalusian Dressage Trophy**
- **Sede:** Centro Ecuestre Dehesa Montenmedio (Cádiz)
- **Fechas:** Hace 2 semanas
- **Tipo:** Regional
- **Categorías:** Senior, Amateur
- **Participantes:** 12
- **Premio:** €5,000
- **Estado:** ✅ Completada con rankings finales

---

### 🐴 Caballos (25)

Caballos de diferentes razas incluyendo:
- **PRE / Andaluz:** Fuego XII, Conquistador, Duque, Don Quijote, Hermoso, Caramelo, Rosalinda, Gitano, Escorial, Gavilán, Reina, Tornado
- **Lusitano:** Diamante, Bonita
- **Warmblood Alemanes:** Werther, Florestan, Sanceo, Desperados
- **KWPN Holandeses:** Valegro II, Totilas Jr
- **Otros:** Dante, Apollo, Majesty, Elegante

60% registrados FEI, 40% sin registro internacional.

---

## 🚀 Cómo Ejecutar el Script

### **Opción A: Producción (Render) - RECOMENDADO**

1. **Acceder a Render Dashboard:**
   - Ve a: https://dashboard.render.com/
   - Selecciona tu servicio: `equestrian-backend`

2. **Abrir Shell:**
   - Click en la pestaña **"Shell"**
   - Espera que el shell se conecte (~10 segundos)

3. **Ejecutar el script:**
   ```bash
   cd /opt/render/project/src/equestrian-fei-system/backend
   python load_demo_data.py
   ```

4. **Esperar:**
   - El script tomará ~1-2 minutos
   - Verás mensajes de progreso en tiempo real
   - Al final verás un resumen de datos creados

5. **Verificar:**
   - Ve a https://equestrian-frontend.onrender.com
   - Login como admin: `admin` / `admin123`
   - Verifica que las competencias aparezcan

---

### **Opción B: Local (Para Testing)**

1. **Activar entorno virtual:**
   ```bash
   cd /home/megalodon/Desktop/dev/web/equestrian-fei-system/equestrian-fei-system/backend
   source venv/bin/activate
   ```

2. **Ejecutar script:**
   ```bash
   python load_demo_data.py
   ```

3. **Verificar:**
   ```bash
   python manage.py runserver
   ```
   - Ve a http://localhost:5173
   - Login y verifica los datos

---

## 📊 Qué Mostrar en la Demo

### 1. **Dashboard de Administrador** (login como `admin`)

**Ruta:** `/admin`

Mostrar:
- ✅ Vista general del sistema
- ✅ 5 competencias completadas
- ✅ 20 usuarios registrados
- ✅ Estadísticas de participantes

---

### 2. **Lista de Competencias** (cualquier rol)

**Ruta:** `/admin/competitions` o `/organizer/competitions`

Mostrar:
- ✅ Tabla con las 5 competencias
- ✅ Estados "completed"
- ✅ Fechas, sedes, número de participantes
- ✅ Click en una competencia para ver detalles

---

### 3. **Detalles de Competencia**

**Ejemplo:** CDI4* Madrid Spring Tour

Mostrar:
- ✅ Información general (nombre, sede, fechas, premios)
- ✅ **Botón Rankings** → Ver clasificación final
- ✅ **Botón Personal** → Ver jueces asignados
- ✅ **Botón Participantes** → Lista de 15 participantes
- ✅ **Botón Programación** → Horarios de pruebas

---

### 4. **Rankings** (funcionalidad estrella)

**Ruta:** `/rankings/:id`

Mostrar:
- ✅ Tabla de clasificación por categoría
- ✅ Posiciones, nombres de jinetes y caballos
- ✅ Puntuaciones finales (porcentajes 65-85%)
- ✅ Orden correcto (mayor score = mejor posición)
- ✅ Múltiples categorías (Grand Prix, Intermediate, etc.)

**Ejemplo de datos:**
```
Categoría: Grand Prix
1. Beatriz Álvarez con Fuego XII - 78.5%
2. Jean Moreau con Werther - 76.2%
3. Hans Müller con Florestan - 74.8%
...
```

---

### 5. **Participantes de una Competencia**

**Ruta:** `/admin/competitions/:id/participants`

Mostrar:
- ✅ Lista completa de participantes
- ✅ Número de dorsal (bib number)
- ✅ Jinete, caballo, categoría
- ✅ Estado de confirmación y pago
- ✅ Filtros por categoría

---

### 6. **Personal (Staff) de Competencia**

**Ruta:** `/admin/competitions/:id/staff`

Mostrar:
- ✅ Jueces asignados
- ✅ Roles (Chief Judge, Judge)
- ✅ Certificaciones FEI (5*, 4*, Nacional)
- ✅ Estado de confirmación

---

### 7. **Gestión de Usuarios** (solo admin)

**Ruta:** `/admin/users`

Mostrar:
- ✅ 20 usuarios con diferentes roles
- ✅ Filtros por rol (admin, organizer, judge, viewer)
- ✅ Estados de verificación
- ✅ Nacionalidades internacionales

---

### 8. **Categorías del Sistema**

**Ruta:** `/admin/categories` o `/organizer/categories`

Mostrar:
- ✅ 8 categorías FEI
- ✅ Junior, Young Rider, Senior, Amateur
- ✅ Grand Prix, Intermediate I & II, Small Tour
- ✅ Requisitos de edad, nivel, tarifas

---

### 9. **Caballos Registrados**

**Desde cualquier participante o competencia**

Mostrar:
- ✅ 25 caballos con datos completos
- ✅ Razas realistas (PRE, KWPN, Hanoverian, etc.)
- ✅ Números de registro FEI
- ✅ Propietarios asignados
- ✅ Edades calculadas correctamente

---

## 🎭 Guión de Demostración Sugerido

### **Parte 1: Visión General (5 min)**

1. **Login como Admin** (`admin` / `admin123`)
2. Mostrar dashboard con estadísticas
3. Explicar los 3 roles principales (admin, organizer, judge)

### **Parte 2: Competencias Completadas (10 min)**

4. Ir a lista de competencias
5. Seleccionar **CDI4* Madrid Spring Tour**
6. Mostrar detalles completos:
   - Información general
   - 15 participantes registrados
   - 3 jueces FEI asignados
   - Categorías (Grand Prix, Intermediate II, Young Rider)

### **Parte 3: Rankings y Scores (10 min)**

7. Click en **"Rankings"**
8. Mostrar tabla de clasificación
9. Explicar sistema de scoring FEI:
   - Movimientos técnicos (0-10)
   - Coeficientes (1x, 2x)
   - Porcentaje final
   - Puntuaciones realistas (65-85%)

### **Parte 4: Gestión de Staff (5 min)**

10. Mostrar sección **"Personal"**
11. Jueces con certificaciones FEI 5*, 4*, Nacional
12. Explicar roles (Chief Judge, Judge)

### **Parte 5: Múltiples Competencias (5 min)**

13. Volver a lista de competencias
14. Mostrar las otras 4 competencias:
    - Barcelona CDI3*
    - Campeonato Nacional
    - Valencia CDI3*
    - Andalusian Trophy
15. Mostrar variedad de sedes, fechas, premios

### **Parte 6: Roles de Usuario (5 min)**

16. Logout y login como **Organizador** (`org_madrid` / `org123`)
17. Mostrar vista de organizador (competencias propias)
18. Logout y login como **Juez** (`judge_fei_5star` / `judge123`)
19. Mostrar vista de juez (competencias asignadas)

**Tiempo total:** ~40 minutos

---

## ✅ Verificación Post-Carga

Después de ejecutar el script, verificar:

- [ ] 20 usuarios creados (probar login con varios)
- [ ] 5 competencias visibles
- [ ] Cada competencia tiene participantes
- [ ] Rankings completos y ordenados correctamente
- [ ] Scores realistas (65-85% para doma)
- [ ] Jueces con certificaciones FEI
- [ ] Caballos con datos completos
- [ ] Perfiles de jueces y organizadores creados
- [ ] Múltiples nacionalidades representadas

---

## 🔧 Troubleshooting

### **Error: "User already exists"**
- Normal, el script detecta usuarios existentes y no los duplica
- Verás mensaje: `ℹ️ Usuario "xxx" ya existe`

### **Error: "IntegrityError: duplicate key"**
- Ejecutaste el script dos veces
- Solución: Los datos ya existen, todo está OK
- Para limpiar: Resetear BD (ver MIGRATION_FIX_INSTRUCTIONS.md)

### **No aparecen los datos en el frontend**
1. Verificar que el backend esté "Live" en Render
2. Hacer hard refresh en el navegador (Ctrl+F5)
3. Verificar en Render logs que no haya errores
4. Probar el endpoint: `https://equestrian-backend.onrender.com/api/competitions/`

### **Scores no se calculan correctamente**
- El script llama automáticamente a `scorecard.calculate_scores()`
- Si hay problemas, verificar que los criterios de scoring existan
- Revisar logs del script para errores

---

## 📞 Contacto y Soporte

Si encuentras algún problema:

1. Revisar logs de Render Dashboard
2. Verificar que todas las migraciones estén aplicadas
3. Confirmar que DATABASE_URL apunta a la BD correcta
4. Consultar MIGRATION_FIX_INSTRUCTIONS.md

---

## 🎉 Resultado Final

Un sistema completamente funcional con:
- ✅ Datos realistas de 5 competencias FEI completadas
- ✅ 63 participantes con scores detallados
- ✅ Rankings automáticos y precisos
- ✅ Jueces internacionales con certificaciones
- ✅ 25 caballos de razas reconocidas
- ✅ Sistema listo para demostración profesional

**¡Sistema listo para impresionar a los stakeholders!** 🚀

---

**Última actualización:** 29 de Octubre, 2025
**Autor:** Claude Code para Equestrian FEI System
