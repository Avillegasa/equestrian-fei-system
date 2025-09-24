import os
import gzip
import hashlib
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional
from django.conf import settings
from django.core.management import call_command
from django.db import connection, models
from django.utils import timezone

from ..models import BackupRecord

logger = logging.getLogger(__name__)


class BackupService:
    """Servicio para gestión de respaldos automáticos"""
    
    def __init__(self):
        self.backup_dir = getattr(settings, 'BACKUP_DIR', '/backups')
        self.max_backups = getattr(settings, 'MAX_BACKUPS', 30)
        self._ensure_backup_directory()
    
    def _ensure_backup_directory(self):
        """Asegurar que el directorio de respaldos existe"""
        Path(self.backup_dir).mkdir(parents=True, exist_ok=True)
    
    def create_full_backup(self, name: str = None, description: str = "", 
                          compress: bool = True) -> BackupRecord:
        """Crear respaldo completo de la base de datos"""
        if not name:
            name = f"full_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        backup_record = BackupRecord.objects.create(
            backup_type='full',
            name=name,
            description=description,
            file_path='',  # Se actualizará después
            status='pending'
        )
        
        try:
            backup_record.status = 'running'
            backup_record.started_at = timezone.now()
            backup_record.save()
            
            # Generar ruta del archivo
            filename = f"{name}.sql"
            if compress:
                filename += '.gz'
            
            file_path = os.path.join(self.backup_dir, filename)
            backup_record.file_path = file_path
            backup_record.save()
            
            # Crear respaldo
            self._create_database_backup(file_path, compress)
            
            # Calcular estadísticas
            self._calculate_backup_stats(backup_record)
            
            backup_record.status = 'completed'
            backup_record.completed_at = timezone.now()
            backup_record.save()
            
            logger.info(f"Respaldo completo creado: {file_path}")
            return backup_record
            
        except Exception as e:
            backup_record.status = 'failed'
            backup_record.completed_at = timezone.now()
            backup_record.save()
            logger.error(f"Error creando respaldo completo: {e}")
            raise
    
    def create_incremental_backup(self, name: str = None, since: datetime = None) -> BackupRecord:
        """Crear respaldo incremental"""
        if not name:
            name = f"incremental_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if not since:
            # Obtener último respaldo completo
            last_full = BackupRecord.objects.filter(
                backup_type='full',
                status='completed'
            ).order_by('-completed_at').first()
            
            if last_full:
                since = last_full.completed_at
            else:
                raise ValueError("No se encontró respaldo base para incremental")
        
        backup_record = BackupRecord.objects.create(
            backup_type='incremental',
            name=name,
            description=f"Incremental desde {since.strftime('%Y-%m-%d %H:%M:%S')}",
            file_path='',
            status='pending'
        )
        
        try:
            backup_record.status = 'running'
            backup_record.started_at = timezone.now()
            backup_record.save()
            
            # Implementar lógica de respaldo incremental
            # Por ahora, crear respaldo completo
            filename = f"{name}.sql.gz"
            file_path = os.path.join(self.backup_dir, filename)
            backup_record.file_path = file_path
            backup_record.save()
            
            self._create_database_backup(file_path, True)
            self._calculate_backup_stats(backup_record)
            
            backup_record.status = 'completed'
            backup_record.completed_at = timezone.now()
            backup_record.save()
            
            return backup_record
            
        except Exception as e:
            backup_record.status = 'failed'
            backup_record.save()
            logger.error(f"Error creando respaldo incremental: {e}")
            raise
    
    def create_schema_backup(self, name: str = None) -> BackupRecord:
        """Crear respaldo solo del esquema"""
        if not name:
            name = f"schema_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        backup_record = BackupRecord.objects.create(
            backup_type='schema',
            name=name,
            description="Respaldo solo del esquema de base de datos",
            file_path='',
            status='pending'
        )
        
        try:
            backup_record.status = 'running'
            backup_record.started_at = timezone.now()
            backup_record.save()
            
            filename = f"{name}_schema.sql.gz"
            file_path = os.path.join(self.backup_dir, filename)
            backup_record.file_path = file_path
            backup_record.save()
            
            # Crear respaldo del esquema
            self._create_schema_backup(file_path)
            self._calculate_backup_stats(backup_record)
            
            backup_record.status = 'completed'
            backup_record.completed_at = timezone.now()
            backup_record.save()
            
            return backup_record
            
        except Exception as e:
            backup_record.status = 'failed'
            backup_record.save()
            logger.error(f"Error creando respaldo de esquema: {e}")
            raise
    
    def _create_database_backup(self, file_path: str, compress: bool = True):
        """Crear respaldo de la base de datos"""
        db_settings = settings.DATABASES['default']
        
        if db_settings['ENGINE'].endswith('sqlite3'):
            self._backup_sqlite(db_settings['NAME'], file_path, compress)
        elif db_settings['ENGINE'].endswith('postgresql'):
            self._backup_postgresql(db_settings, file_path, compress)
        elif db_settings['ENGINE'].endswith('mysql'):
            self._backup_mysql(db_settings, file_path, compress)
        else:
            raise ValueError(f"Motor de base de datos no soportado: {db_settings['ENGINE']}")
    
    def _backup_sqlite(self, db_path: str, backup_path: str, compress: bool):
        """Respaldo de SQLite"""
        import shutil
        
        if compress:
            # Copiar y comprimir
            temp_path = backup_path.replace('.gz', '')
            shutil.copy2(db_path, temp_path)
            
            with open(temp_path, 'rb') as f_in:
                with gzip.open(backup_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            os.remove(temp_path)
        else:
            shutil.copy2(db_path, backup_path)
    
    def _backup_postgresql(self, db_settings: Dict, file_path: str, compress: bool):
        """Respaldo de PostgreSQL usando pg_dump"""
        import subprocess
        
        cmd = [
            'pg_dump',
            '-h', db_settings.get('HOST', 'localhost'),
            '-p', str(db_settings.get('PORT', 5432)),
            '-U', db_settings['USER'],
            '-d', db_settings['NAME'],
            '--verbose',
            '--no-password'
        ]
        
        env = os.environ.copy()
        if 'PASSWORD' in db_settings:
            env['PGPASSWORD'] = db_settings['PASSWORD']
        
        if compress:
            with gzip.open(file_path, 'wt') as f:
                subprocess.run(cmd, stdout=f, check=True, env=env)
        else:
            with open(file_path, 'w') as f:
                subprocess.run(cmd, stdout=f, check=True, env=env)
    
    def _backup_mysql(self, db_settings: Dict, file_path: str, compress: bool):
        """Respaldo de MySQL usando mysqldump"""
        import subprocess
        
        cmd = [
            'mysqldump',
            '-h', db_settings.get('HOST', 'localhost'),
            '-P', str(db_settings.get('PORT', 3306)),
            '-u', db_settings['USER'],
            f"-p{db_settings.get('PASSWORD', '')}",
            '--routines',
            '--triggers',
            db_settings['NAME']
        ]
        
        if compress:
            with gzip.open(file_path, 'wt') as f:
                subprocess.run(cmd, stdout=f, check=True)
        else:
            with open(file_path, 'w') as f:
                subprocess.run(cmd, stdout=f, check=True)
    
    def _create_schema_backup(self, file_path: str):
        """Crear respaldo solo del esquema"""
        db_settings = settings.DATABASES['default']
        
        if db_settings['ENGINE'].endswith('postgresql'):
            import subprocess
            
            cmd = [
                'pg_dump',
                '-h', db_settings.get('HOST', 'localhost'),
                '-p', str(db_settings.get('PORT', 5432)),
                '-U', db_settings['USER'],
                '-d', db_settings['NAME'],
                '--schema-only',
                '--verbose',
                '--no-password'
            ]
            
            env = os.environ.copy()
            if 'PASSWORD' in db_settings:
                env['PGPASSWORD'] = db_settings['PASSWORD']
            
            with gzip.open(file_path, 'wt') as f:
                subprocess.run(cmd, stdout=f, check=True, env=env)
                
        elif db_settings['ENGINE'].endswith('mysql'):
            import subprocess
            
            cmd = [
                'mysqldump',
                '-h', db_settings.get('HOST', 'localhost'),
                '-P', str(db_settings.get('PORT', 3306)),
                '-u', db_settings['USER'],
                f"-p{db_settings.get('PASSWORD', '')}",
                '--no-data',
                '--routines',
                '--triggers',
                db_settings['NAME']
            ]
            
            with gzip.open(file_path, 'wt') as f:
                subprocess.run(cmd, stdout=f, check=True)
        else:
            # Para SQLite, usar Django para generar el esquema
            with gzip.open(file_path, 'wt') as f:
                call_command('sqlmigrate', 'all', stdout=f)
    
    def _calculate_backup_stats(self, backup_record: BackupRecord):
        """Calcular estadísticas del respaldo"""
        if os.path.exists(backup_record.file_path):
            # Tamaño del archivo
            backup_record.file_size = os.path.getsize(backup_record.file_path)
            
            # Calcular checksum
            backup_record.checksum = self._calculate_file_checksum(backup_record.file_path)
            
            # Contar tablas y registros (aproximado)
            with connection.cursor() as cursor:
                db_engine = settings.DATABASES['default']['ENGINE']
                if db_engine.endswith('sqlite3'):
                    cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
                    backup_record.total_tables = cursor.fetchone()[0] if cursor.rowcount > 0 else 0
                elif db_engine.endswith('postgresql'):
                    cursor.execute(
                        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s",
                        ['public']
                    )
                    backup_record.total_tables = cursor.fetchone()[0] if cursor.rowcount > 0 else 0
                elif db_engine.endswith('mysql'):
                    cursor.execute(
                        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s",
                        [settings.DATABASES['default']['NAME']]
                    )
                    backup_record.total_tables = cursor.fetchone()[0] if cursor.rowcount > 0 else 0
                else:
                    backup_record.total_tables = 0
            
            # Calcular ratio de compresión si está comprimido
            if backup_record.file_path.endswith('.gz'):
                uncompressed_size = self._estimate_uncompressed_size(backup_record.file_path)
                if uncompressed_size > 0:
                    backup_record.compression_ratio = backup_record.file_size / uncompressed_size
            
            backup_record.save()
    
    def _calculate_file_checksum(self, file_path: str) -> str:
        """Calcular checksum SHA256 del archivo"""
        sha256_hash = hashlib.sha256()
        
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        
        return sha256_hash.hexdigest()
    
    def _estimate_uncompressed_size(self, compressed_file_path: str) -> int:
        """Estimar tamaño descomprimido"""
        try:
            with gzip.open(compressed_file_path, 'rt') as f:
                # Leer una muestra y estimar
                sample = f.read(1024 * 10)  # 10KB de muestra
                if sample:
                    # Estimación muy aproximada
                    return len(sample) * 100  # Asumir ratio promedio
        except Exception:
            pass
        return 0
    
    def restore_backup(self, backup_record: BackupRecord, target_db: str = None) -> bool:
        """Restaurar desde respaldo"""
        if backup_record.status != 'completed':
            raise ValueError("El respaldo no está completo")
        
        if not os.path.exists(backup_record.file_path):
            raise FileNotFoundError("Archivo de respaldo no encontrado")
        
        try:
            db_settings = settings.DATABASES['default']
            target_db = target_db or db_settings['NAME']
            
            if db_settings['ENGINE'].endswith('sqlite3'):
                return self._restore_sqlite(backup_record.file_path, target_db)
            elif db_settings['ENGINE'].endswith('postgresql'):
                return self._restore_postgresql(backup_record.file_path, db_settings, target_db)
            elif db_settings['ENGINE'].endswith('mysql'):
                return self._restore_mysql(backup_record.file_path, db_settings, target_db)
            
            return False
            
        except Exception as e:
            logger.error(f"Error restaurando respaldo {backup_record.id}: {e}")
            return False
    
    def _restore_sqlite(self, backup_path: str, target_db: str) -> bool:
        """Restaurar SQLite"""
        import shutil
        
        try:
            if backup_path.endswith('.gz'):
                # Descomprimir temporalmente
                temp_path = backup_path.replace('.gz', '.temp')
                with gzip.open(backup_path, 'rb') as f_in:
                    with open(temp_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                
                shutil.copy2(temp_path, target_db)
                os.remove(temp_path)
            else:
                shutil.copy2(backup_path, target_db)
            
            return True
        except Exception as e:
            logger.error(f"Error restaurando SQLite: {e}")
            return False
    
    def _restore_postgresql(self, backup_path: str, db_settings: Dict, target_db: str) -> bool:
        """Restaurar PostgreSQL"""
        import subprocess
        
        try:
            cmd = [
                'pg_restore',
                '-h', db_settings.get('HOST', 'localhost'),
                '-p', str(db_settings.get('PORT', 5432)),
                '-U', db_settings['USER'],
                '-d', target_db,
                '--verbose',
                '--no-password'
            ]
            
            env = os.environ.copy()
            if 'PASSWORD' in db_settings:
                env['PGPASSWORD'] = db_settings['PASSWORD']
            
            if backup_path.endswith('.gz'):
                with gzip.open(backup_path, 'rt') as f:
                    subprocess.run(['psql'] + cmd[1:-1], stdin=f, check=True, env=env)
            else:
                cmd.append(backup_path)
                subprocess.run(cmd, check=True, env=env)
            
            return True
            
        except Exception as e:
            logger.error(f"Error restaurando PostgreSQL: {e}")
            return False
    
    def _restore_mysql(self, backup_path: str, db_settings: Dict, target_db: str) -> bool:
        """Restaurar MySQL"""
        import subprocess
        
        try:
            cmd = [
                'mysql',
                '-h', db_settings.get('HOST', 'localhost'),
                '-P', str(db_settings.get('PORT', 3306)),
                '-u', db_settings['USER'],
                f"-p{db_settings.get('PASSWORD', '')}",
                target_db
            ]
            
            if backup_path.endswith('.gz'):
                with gzip.open(backup_path, 'rt') as f:
                    subprocess.run(cmd, stdin=f, check=True)
            else:
                cmd.extend(['<', backup_path])
                subprocess.run(' '.join(cmd), shell=True, check=True)
            
            return True
            
        except Exception as e:
            logger.error(f"Error restaurando MySQL: {e}")
            return False
    
    def cleanup_old_backups(self, keep_count: int = None) -> int:
        """Limpiar respaldos antiguos"""
        keep_count = keep_count or self.max_backups
        
        old_backups = BackupRecord.objects.filter(
            status='completed'
        ).order_by('-completed_at')[keep_count:]
        
        deleted_count = 0
        for backup in old_backups:
            try:
                if os.path.exists(backup.file_path):
                    os.remove(backup.file_path)
                backup.delete()
                deleted_count += 1
            except Exception as e:
                logger.error(f"Error eliminando respaldo {backup.id}: {e}")
        
        return deleted_count
    
    def schedule_automatic_backups(self):
        """Programar respaldos automáticos"""
        # Esta función sería llamada por un cron job o scheduler
        now = timezone.now()
        
        # Respaldo diario a las 2:00 AM
        if now.hour == 2 and now.minute < 5:
            try:
                self.create_full_backup(
                    name=f"auto_daily_{now.strftime('%Y%m%d')}",
                    description="Respaldo automático diario"
                )
                logger.info("Respaldo diario automático completado")
            except Exception as e:
                logger.error(f"Error en respaldo diario automático: {e}")
        
        # Limpiar respaldos antiguos semanalmente
        if now.weekday() == 0 and now.hour == 3 and now.minute < 5:  # Lunes
            try:
                deleted = self.cleanup_old_backups()
                logger.info(f"Limpieza automática: {deleted} respaldos eliminados")
            except Exception as e:
                logger.error(f"Error en limpieza automática: {e}")
    
    def get_backup_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de respaldos"""
        total_backups = BackupRecord.objects.count()
        successful_backups = BackupRecord.objects.filter(status='completed').count()
        failed_backups = BackupRecord.objects.filter(status='failed').count()
        
        latest_backup = BackupRecord.objects.filter(
            status='completed'
        ).order_by('-completed_at').first()
        
        total_size = BackupRecord.objects.filter(
            status='completed'
        ).aggregate(
            total=models.Sum('file_size')
        )['total'] or 0
        
        return {
            'total_backups': total_backups,
            'successful_backups': successful_backups,
            'failed_backups': failed_backups,
            'success_rate': successful_backups / total_backups * 100 if total_backups > 0 else 0,
            'latest_backup': latest_backup.completed_at if latest_backup else None,
            'total_size_bytes': total_size,
            'total_size_gb': round(total_size / (1024**3), 2) if total_size > 0 else 0,
            'backup_directory': self.backup_dir
        }


# Instancia singleton del servicio de backup
backup_service = BackupService()