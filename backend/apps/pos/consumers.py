import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTTokenUserAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import AccessToken
import logging

logger = logging.getLogger(__name__)

class StockSyncConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time stock synchronization
    """
    
    async def connect(self, message):
        """Handle WebSocket connection"""
        try:
            # Extract token from query string
            token = self.scope['query_string'].decode('utf-8').split('token=')[1].split('&')[0]
            
            # Validate token
            try:
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                logger.info(f"WebSocket connected for user_id: {user_id}")
                await self.accept()
            except InvalidToken:
                logger.warning(f"Invalid WebSocket token: {token}")
                await self.close(code=4001)
                return
                
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            await self.close(code=4000)
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        logger.info(f"WebSocket disconnected with code: {close_code}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            message_data = data.get('data')
            
            # Handle different message types
            if message_type == 'stock_update':
                await self.handle_stock_update(message_data)
            elif message_type == 'sync_status':
                await self.handle_sync_status(message_data)
            elif message_type == 'ping':
                # Respond to ping
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'data': {'timestamp': 'now'}
                }))
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def handle_stock_update(self, data):
        """Handle stock update messages"""
        logger.info(f"Stock update received: {data}")
        # Broadcast to all connected clients in the same group
        await self.channel_layer.group_send(
            'stock_updates',
            {
                'type': 'stock_update',
                'data': data
            }
        )
    
    async def handle_sync_status(self, data):
        """Handle sync status messages"""
        logger.info(f"Sync status received: {data}")
        await self.channel_layer.group_send(
            'stock_updates',
            {
                'type': 'sync_status',
                'data': data
            }
        )
    
    async def stock_sync_message(self, event):
        """Send stock sync message to group"""
        await self.channel_layer.group_send(
            'stock_updates',
            {
                'type': event['type'],
                'data': event['data']
            }
        )
