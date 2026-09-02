# API Client Consolidation Plan

## Current State Analysis

### Multiple API Clients Found:
1. **`lib/api.ts`** - Main API client with axios, caching, performance optimizations
2. **`lib/apiClient.ts`** - Simple fetch-based client with tokenManager
3. **`lib/secureApiClient.ts`** - Advanced security-focused client 
4. **`lib/auth.ts`** - Auth-specific API with axios and token management
5. **`lib/orders-api.ts`** - Orders-specific API (uses lib/api.ts)
6. **`lib/admin-api.ts`** - Admin-specific API (uses lib/api.ts)
7. **`lib/tokenManager.ts`** - Token utilities (conflicts with auth.ts)

### Usage Analysis:
- **Most Used**: `lib/api.ts` (used in hooks, components, pages)
- **Auth**: `lib/auth.ts` (used in AuthContext)
- **Legacy**: `lib/apiClient.ts` (used only in RegisterForm)
- **Unused**: `lib/secureApiClient.ts` (not imported anywhere)

## Recommended Approach: **Consolidate to `lib/api.ts`**

### Why `lib/api.ts` is the best choice:
1. **Most comprehensive** - Has caching, deduplication, error handling
2. **Widely adopted** - Already used throughout the codebase
3. **Performance optimized** - Request deduplication, caching, debounced search
4. **Type safety** - Complete TypeScript interfaces
5. **Extensible** - Easy to add new endpoints

## Proposed Changes

### Phase 1: Merge Auth Functionality
**Files to modify:**
- `lib/api.ts` - Add auth methods from `lib/auth.ts`
- `contexts/AuthContext.tsx` - Update imports
- `components/auth/RegisterForm.tsx` - Update imports

**Changes:**
1. Move `authAPI` methods into `lib/api.ts` ApiClient class
2. Merge token management from `lib/auth.ts` into `lib/api.ts`
3. Remove duplicate token management logic

### Phase 2: Remove Duplicate Files
**Files to delete:**
- `lib/apiClient.ts` - Replaced by enhanced `lib/api.ts`
- `lib/secureApiClient.ts` - Unused
- `lib/tokenManager.ts` - Functionality moved to `lib/api.ts`

**Files to keep:**
- `lib/api.ts` - Enhanced with auth functionality
- `lib/auth.ts` - Keep types and interfaces only
- `lib/orders-api.ts` - Keep as specialized module
- `lib/admin-api.ts` - Keep as specialized module

### Phase 3: Update Imports
**Components to update:**
- `components/auth/RegisterForm.tsx` - Change from `apiClient` to `api`
- `contexts/AuthContext.tsx` - Update auth imports

## Detailed Implementation Plan

### 1. Enhanced `lib/api.ts`
```typescript
// Add auth methods to ApiClient class
async login(username: string, password: string): Promise<LoginResponse>
async register(data: RegisterData): Promise<RegisterResponse>
async logout(refreshToken: string): Promise<{ message: string }>
async refreshToken(refreshToken: string): Promise<AuthTokens>
async getProfile(): Promise<User>

// Add token management methods
private setTokens(tokens: AuthTokens, user: User): void
private getTokens(): AuthTokens | null
private clearTokens(): void
private isTokenExpired(token: string): boolean
```

### 2. Simplified `lib/auth.ts`
```typescript
// Keep only types and interfaces
export interface User { ... }
export interface AuthTokens { ... }
export interface LoginResponse { ... }
export interface RegisterResponse { ... }
export interface RegisterData { ... }
export interface LoginData { ... }

// Re-export API methods for backward compatibility
export { apiClient } from './api';
```

### 3. Updated Import Changes
```typescript
// Before
import { apiClient } from '@/lib/apiClient';
import { authAPI, tokenManager } from '@/lib/auth';

// After  
import { apiClient } from '@/lib/api';
```

## Benefits of This Approach

### 1. **Single Source of Truth**
- One API client for all operations
- Consistent error handling
- Unified token management

### 2. **Performance Improvements**
- Request deduplication
- Intelligent caching
- Debounced search

### 3. **Better Developer Experience**
- Single import location
- Comprehensive TypeScript support
- Consistent API patterns

### 4. **Reduced Bundle Size**
- Remove duplicate code
- Eliminate unused dependencies
- Better tree-shaking

### 5. **Easier Maintenance**
- Single file to update for API changes
- Centralized error handling
- Unified authentication flow

## Migration Risk Assessment

### Low Risk:
- Adding methods to existing `lib/api.ts`
- Updating imports in a few files
- Keeping specialized modules (orders, admin)

### Medium Risk:
- Token management logic changes
- AuthContext updates

### Mitigation:
- Implement in phases
- Test authentication flow thoroughly
- Keep backward compatibility where possible

## Files Summary

### Keep & Enhance:
- `lib/api.ts` - Main API client (add auth methods)
- `lib/auth.ts` - Types only (remove implementation)
- `lib/orders-api.ts` - Specialized orders API
- `lib/admin-api.ts` - Specialized admin API

### Remove:
- `lib/apiClient.ts` - Duplicate functionality
- `lib/secureApiClient.ts` - Unused
- `lib/tokenManager.ts` - Duplicate token management

### Update:
- `contexts/AuthContext.tsx` - Import changes
- `components/auth/RegisterForm.tsx` - Import changes

## Expected Outcome

After consolidation:
- 1 main API client with full functionality
- 3 specialized API modules (orders, admin, auth types)
- Consistent authentication across all API calls
- Better performance and maintainability
- Reduced complexity and bundle size
