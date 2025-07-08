from django.apps import AppConfig


class SyncConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sync'
    verbose_name = 'Sincronización'
    
    def ready(self):
        # Importar señales si las hay
        try:
            import apps.sync.signals
        except ImportError:
            pass