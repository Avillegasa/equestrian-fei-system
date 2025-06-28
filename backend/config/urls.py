from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # APIs principales
    path('api/users/', include('apps.users.urls')),
    # Las siguientes se agregarán en fases posteriores:
    # path('api/competitions/', include('apps.competitions.urls')),
    # path('api/scoring/', include('apps.scoring.urls')),
    # path('api/rankings/', include('apps.rankings.urls')),
    # path('api/websockets/', include('apps.websockets.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    try:
        import debug_toolbar
        urlpatterns += [path('__debug__/', include('debug_toolbar.urls'))]
    except ImportError:
        pass