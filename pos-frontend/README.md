# Hardware POS System

A Point of Sale (POS) system for hardware stores, built with Next.js and designed to integrate with the existing Hardware E-commerce backend.

## Features

- **Real-time Stock Synchronization** - Sync stock levels between POS and e-commerce
- **Barcode Scanning** - Support for barcode scanners and manual input
- **Product Management** - Search, view, and update product information
- **Stock Updates** - Adjust stock levels with conflict resolution
- **Low Stock Alerts** - Get notified when products are running low
- **Multi-store Support** - Manage multiple store locations
- **WebSocket Integration** - Real-time updates across all terminals

## Getting Started

### Prerequisites

- Node.js 18+ 
- Backend API server running on `http://localhost:8000`
- PostgreSQL database with POS extensions

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env.local
NEXT_PUBLIC_POS_API_URL=http://localhost:8000/api/pos
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/stock/
NEXT_PUBLIC_DEFAULT_STORE_ID=main
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Credentials

Use these credentials to test the POS system:

- **Username**: `admin`
- **Password**: `admin123`
- **Store**: `Main Store`

## Architecture

### Frontend Structure

```
src/
├── app/
│   ├── login/          # Authentication page
│   └── pos/            # Main POS interface
├── components/
│   ├── barcode/        # Barcode scanner components
│   └── pos/            # POS-specific components
└── lib/
    ├── pos-api.ts      # API client for backend
    ├── websocket.ts    # WebSocket client for real-time sync
    ├── utils.ts        # Utility functions
    └── env.ts          # Environment configuration
```

### Backend Integration

The POS system connects to the existing Django backend via:

- **REST API**: `/api/pos/*` endpoints for product and stock management
- **WebSocket**: `/ws/stock/` for real-time stock synchronization
- **Authentication**: JWT tokens with device-specific authentication

## Key Components

### POS Interface (`/pos`)
- Product grid with search and filtering
- Barcode scanning integration
- Real-time stock updates
- Cart and product details panel
- Connection status indicator

### Stock Management
- Update stock quantities with version control
- Bulk stock updates
- Conflict resolution for concurrent updates
- Stock change history tracking

### Real-time Features
- WebSocket connection for live updates
- Stock synchronization across terminals
- Low stock alerts
- Connection status monitoring

## API Endpoints

### Authentication
- `POST /api/pos/auth/login/` - POS authentication
- `POST /api/pos/auth/refresh/` - Token refresh

### Products
- `GET /api/pos/products/` - List products
- `POST /api/pos/products/update_stock/` - Update stock
- `POST /api/pos/products/bulk_stock_update/` - Bulk updates
- `GET /api/pos/products/sync_status/` - Sync status

### Utilities
- `GET /api/pos/health/` - Health check
- `GET /api/pos/alerts/low_stock/` - Low stock alerts

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_POS_API_URL` | Backend API URL | `http://localhost:8000/api/pos` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8000/ws/stock/` |
| `NEXT_PUBLIC_DEFAULT_STORE_ID` | Default store ID | `main` |
| `NEXT_PUBLIC_APP_NAME` | App name | `Hardware POS` |
| `NEXT_PUBLIC_DEBUG_MODE` | Debug mode | `false` |

## Deployment

### Production Setup

1. Build the application:
```bash
npm run build
```

2. Set production environment variables:
```bash
NEXT_PUBLIC_POS_API_URL=https://your-backend.com/api/pos
NEXT_PUBLIC_WS_URL=wss://your-backend.com/ws/stock/
```

3. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check that the backend is running
   - Verify WebSocket URL in environment variables
   - Check network connectivity

2. **Authentication Errors**
   - Verify backend API is accessible
   - Check user credentials
   - Ensure JWT tokens are properly configured

3. **Stock Sync Issues**
   - Check database connection
   - Verify stock sync logs in backend
   - Check WebSocket connection status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is part of the Hardware E-commerce system.
