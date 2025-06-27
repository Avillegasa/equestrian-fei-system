import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

django_asgi_app = get_asgi_application()

# Importar routing cuando esté creado
try:
    from apps.websockets import routing
    websocket_routes = routing.websocket_urlpatterns
except ImportError:
    websocket_routes = []

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_routes)
    ),
})