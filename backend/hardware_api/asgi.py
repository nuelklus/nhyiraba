import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.pos.consumers import StockSyncConsumer

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hardware_api.settings.dev")

# Define WebSocket routing
websocket_urlpatterns = [
    URLRouter(r'^ws/stock/$', StockSyncConsumer.as_asgi()),
]

# Protocol type router for WebSocket and HTTP
application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
    "http": get_asgi_application(),
})
