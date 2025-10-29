# 🚀 Pasos para Deployment en Render.com

## Situación Actual

✅ **Local:** Migraciones corregidas y funcionando
❌ **Producción:** Base de datos con estructura vieja (UUID)

## 🎯 Opción Recomendada: Nueva Base de Datos

Esta es la forma MÁS SEGURA y RÁPIDA:

### Paso 1: Crear Nueva Base de Datos

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en tu proyecto "equestrian-fei-system"
3. Ve a la pestaña **"PostgreSQL"**
4. Click **"New PostgreSQL"**
5. Configuración:
   - **Name:** `equestrian-db-v2` (o el nombre que prefieras)
   - **Database:** `equestrian` (auto-generado)
   - **User:** `equestrian` (auto-generado)
   - **Region:** Oregon, USA (mismo que backend)
   - **Plan:** Free
6. Click **"Create Database"**
7. Espera ~2 minutos a que la BD esté "Available"
8. **COPIA** la "Internal Database URL" (se ve así):
   ```
   postgresql://equestrian:XXXXX@dpg-xxxxx-a/equestrian_db_xxxx
   ```

---

### Paso 2: Actualizar Backend Service

1. En Render Dashboard, ve a **"Services"**
2. Click en **"equestrian-backend"**
3. Ve a la pestaña **"Environment"**
4. Busca la variable **`DATABASE_URL`**
5. Click en el ícono de editar (lápiz)
6. **PEGA** la nueva Internal Database URL que copiaste
7. Click **"Save Changes"**

⚠️ **IMPORTANTE:** NO hagas push todavía, el service se va a redesplegar automáticamente al cambiar la variable.

---

### Paso 3: Monitorear el Re-deploy Automático

1. Ve a la pestaña **"Logs"** de equestrian-backend
2. Verás que empieza un nuevo deploy automáticamente
3. Observa los logs, deberías ver:
   ```
   🚀 Starting Equestrian FEI Backend Build...
   📦 Installing Python dependencies...
   🗄️  Running database migrations...
   ✅ Migrations applied
   👤 Creating test users...
   ✅ Admin created: admin/admin123
   ✅ Organizer created: organizer1/org123
   ✅ Judge created: judge1/judge123
   ✅ Build completed successfully!
   ```
4. Espera a que el estado cambie a **"Live"** (verde)

---

### Paso 4: Push de las Nuevas Migraciones

Ahora que la BD nueva está funcionando, hacemos push de las migraciones:

```bash
cd /home/megalodon/Desktop/dev/web/equestrian-fei-system

# Push a producción
git push origin main
```

Render detectará el push y hará otro deploy, pero esta vez:
- Aplicará las migraciones nuevas (que ya coinciden con la BD limpia)
- Todo funcionará correctamente

---

### Paso 5: Eliminar Base de Datos Vieja

Una vez que todo funcione:

1. Ve a **PostgreSQL** en Render Dashboard
2. Busca la base de datos vieja (probablemente `equestrian-db`)
3. Click en los tres puntos → **"Delete"**
4. Confirma la eliminación
5. ¡Listo! Sistema limpio y funcionando

---

## ✅ Verificación Post-Deploy

### 1. Health Check

```bash
curl https://equestrian-backend.onrender.com/api/health/
```

Debe retornar:
```json
{
  "status": "healthy",
  "message": "FEI Equestrian System API is running",
  "version": "1.0.0"
}
```

### 2. Login Test

```bash
curl -X POST https://equestrian-backend.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Debe retornar tokens JWT.

### 3. Frontend Test

1. Ve a https://equestrian-frontend.onrender.com
2. Intenta hacer login con: `admin` / `admin123`
3. Debe entrar al dashboard de admin
4. Intenta crear una competencia
5. Intenta crear una categoría

---

## 🆘 Plan B: Si No Quieres Crear Nueva BD

Si prefieres NO crear una nueva BD, puedes resetear la existente:

### Opción B: Resetear BD Existente

**⚠️ ADVERTENCIA:** Esto es más arriesgado y puede causar downtime.

1. **Push primero:**
   ```bash
   git push origin main
   ```

2. **El deploy FALLARÁ** (esto es esperado)

3. **Conectarse a la BD desde Render Shell:**
   - Ve a "equestrian-backend" → Shell
   - Ejecuta:
   ```bash
   python manage.py dbshell
   ```

4. **Borrar todas las tablas:**
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   \q
   ```

5. **Forzar nuevo deploy:**
   - Ve a "equestrian-backend" → "Manual Deploy"
   - Click "Deploy latest commit"

---

## 📊 Timeline Estimado

**Opción A (Nueva BD - RECOMENDADA):**
- Paso 1: 3 minutos (crear BD)
- Paso 2: 1 minuto (actualizar variable)
- Paso 3: 8 minutos (auto-redeploy)
- Paso 4: 8 minutos (push y deploy)
- **Total:** ~20 minutos

**Opción B (Resetear BD existente):**
- Puede tomar más tiempo y tiene más riesgo de errores
- **Total:** ~15-30 minutos

---

## 🎯 Siguiente Comando a Ejecutar

Si elegiste la **Opción A** (recomendada), NO ejecutes nada todavía.

**Primero:**
1. Ve a Render Dashboard
2. Crea la nueva base de datos
3. Actualiza la variable DATABASE_URL en el backend
4. Espera a que el deploy automático termine exitosamente
5. **LUEGO** ejecuta:

```bash
cd /home/megalodon/Desktop/dev/web/equestrian-fei-system
git push origin main
```

---

Si elegiste la **Opción B**, ejecuta directamente:

```bash
cd /home/megalodon/Desktop/dev/web/equestrian-fei-system
git push origin main
```

Y luego resetea la BD desde Render Shell.

---

**Estado actual del repositorio:**
- ✅ Commit creado: `600779e`
- ✅ Cambios listos para push
- ⏳ Esperando instrucciones para continuar

¿Qué opción prefieres?
