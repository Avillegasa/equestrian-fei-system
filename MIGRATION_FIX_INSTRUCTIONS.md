# 🔧 Instrucciones para Corregir el Error de Migraciones

## Problema Identificado

El sistema tenía un error donde el modelo `User` usaba `UUIDField` como primary key en las migraciones antiguas, pero ahora el modelo espera usar `BigAutoField` (integer autoincremental).

**Error reportado:**
```
django.db.utils.IntegrityError: null value in column "id" of relation "users_user" violates not-null constraint
```

## Solución Implementada

### ✅ Local (Completado)

Se ejecutó el script `reset_migrations.sh` que:
1. ✅ Eliminó todas las migraciones antiguas
2. ✅ Creó nuevas migraciones con `BigAutoField` para User
3. ✅ Recreó la base de datos local
4. ✅ Creó los usuarios de prueba (admin, organizer1, judge1)

**Resultado:** Sistema funcionando correctamente en local.

---

## 🚀 Pasos para Producción (Render.com)

Dado que la base de datos de producción tiene las tablas viejas con UUID, necesitamos resetearla.

### Opción A: Crear Nueva Base de Datos (RECOMENDADO)

Esta es la forma más limpia y segura:

1. **En Render Dashboard:**
   - Ve a tu proyecto → "Databases"
   - Crea una nueva base de datos PostgreSQL Free
   - Copia la conexión interna URL

2. **Actualizar el Backend Service:**
   - Ve a "equestrian-backend" service
   - En "Environment" → Busca `DATABASE_URL`
   - Pega la nueva URL de conexión
   - Click "Save Changes"

3. **Eliminar la Base de Datos Vieja:**
   - Espera que el deploy termine exitosamente
   - Vuelve a "Databases" y elimina la base vieja
   - ¡Listo! Sistema funcionando con BD nueva

---

### Opción B: Resetear Base de Datos Existente

Si prefieres mantener la misma base de datos:

1. **Conectarse a la base de datos desde Render Shell:**
   - Ve a "equestrian-backend" → Shell
   - Ejecuta:
   ```bash
   python manage.py dbshell
   ```

2. **Ejecutar comandos SQL para borrar todo:**
   ```sql
   -- PRECAUCIÓN: Esto borra TODA la base de datos
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   \q
   ```

3. **Forzar redeploy:**
   - Ve a "equestrian-backend" → Manual Deploy
   - Click "Deploy latest commit"
   - El build.sh ejecutará migraciones y creará usuarios

---

## 📋 Checklist Post-Migración

Después de aplicar la solución en producción, verificar:

- [ ] Backend despliega sin errores
- [ ] Endpoint de salud funciona: `https://equestrian-backend.onrender.com/api/health/`
- [ ] Login funciona con credenciales:
  - Admin: `admin` / `admin123`
  - Organizer: `organizer1` / `org123`
  - Judge: `judge1` / `judge123`
- [ ] Frontend puede conectarse al backend
- [ ] Se pueden crear competencias
- [ ] Se pueden crear categorías

---

## 🗃️ Archivos Modificados

Los siguientes archivos fueron actualizados y deben commitearse:

### Nuevas Migraciones (CRÍTICO - sin estos el deploy fallará):
```
equestrian-fei-system/backend/apps/users/migrations/0001_initial.py
equestrian-fei-system/backend/apps/competitions/migrations/0001_initial.py
equestrian-fei-system/backend/apps/scoring/migrations/0001_initial.py
equestrian-fei-system/backend/apps/sync/migrations/0001_initial.py
```

### Scripts Auxiliares (opcional):
```
equestrian-fei-system/backend/reset_migrations.sh
MIGRATION_FIX_INSTRUCTIONS.md (este archivo)
```

---

## 🚀 Comandos para Deploy

```bash
# 1. Verificar que los cambios estén correctos
cd /home/megalodon/Desktop/dev/web/equestrian-fei-system
git status

# 2. Agregar todos los archivos de migraciones
git add equestrian-fei-system/backend/apps/*/migrations/0001_initial.py
git add equestrian-fei-system/backend/reset_migrations.sh
git add MIGRATION_FIX_INSTRUCTIONS.md

# 3. Commit
git commit -m "Fix: Migrate User ID from UUID to BigAutoField

- Changed User primary key from UUIDField to BigAutoField
- Reset all migrations to match current models
- Created fresh migration files for all apps
- Added reset_migrations.sh script for local development
- Tested successfully in local environment

Breaking change: Requires database reset in production"

# 4. Push a producción
git push origin main
```

---

## ⚠️ Notas Importantes

1. **Pérdida de Datos**: Ambas opciones resultarán en pérdida de datos de la BD actual. Como la BD solo tiene usuarios de prueba, esto es aceptable.

2. **Downtime**: Habrá ~30-60 segundos de downtime durante el deploy mientras se aplican las migraciones.

3. **Usuarios de Prueba**: El script `build.sh` automáticamente creará los 3 usuarios de prueba.

4. **Credenciales**: Recuerda cambiar las contraseñas por defecto antes de uso en producción real.

---

## 🆘 Si Algo Sale Mal

### Error: "relation users_user already exists"

Significa que la tabla vieja sigue ahí. Ejecuta:
```bash
python manage.py migrate users zero --fake
python manage.py migrate --run-syncdb
```

### Error: "column id does not exist"

Las migraciones nuevas no se aplicaron. Verifica que:
1. Los archivos de migración estén en el repositorio
2. El commit se hizo correctamente
3. Render detectó el push y empezó el deploy

---

## ✅ Verificación Final

Una vez completado el proceso, el endpoint de salud debe responder:

```bash
curl https://equestrian-backend.onrender.com/api/health/

# Respuesta esperada:
{
  "status": "healthy",
  "message": "FEI Equestrian System API is running",
  "version": "1.0.0"
}
```

Y el login debe funcionar:

```bash
curl -X POST https://equestrian-backend.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Debe retornar tokens JWT
```

---

**Fecha de creación:** 29 de Octubre, 2025
**Autor:** Claude Code
**Estado:** ✅ Probado y funcionando en desarrollo
