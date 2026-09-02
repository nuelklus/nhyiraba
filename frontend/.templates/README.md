# Component Templates Directory

This directory contains standardized templates for creating new components with built-in error handling.

## 📁 Available Templates

### 1. `component-template.tsx`
**Use for**: General components that need API calls or async operations
**Features**:
- Standardized error handling
- Loading states
- Consistent error display
- TypeScript support

### 2. `form-component-template.tsx`
**Use for**: Form components with validation
**Features**:
- React Hook Form + Zod validation
- Standardized error handling
- Form reset on success
- Field-level validation errors
- Submission error display

## 🚀 Quick Start

1. **Copy the appropriate template** to your component location
2. **Rename the component** (search/replace "ComponentName" and "FormComponentName")
3. **Update the form schema** (for form components)
4. **Customize the API calls** and data handling
5. **Adjust the UI** as needed

## 📋 Required Imports (Already Included)

**In Templates** (relative paths for `.templates/` directory):
```typescript
import { handleError, getUserFriendlyMessage } from '../utils/errorHandler';
```

**In Actual Components** (use @ alias after copying from templates):
```typescript
import { handleError, getUserFriendlyMessage } from '@/utils/errorHandler';
```

## 🎨 Error Handling Pattern

All templates include the standardized error handling pattern:

```typescript
try {
  // Your API call
} catch (err: any) {
  const standardizedError = handleError(err);
  const userMessage = getUserFriendlyMessage(standardizedError);
  setError(userMessage);
} finally {
  setIsLoading(false);
}
```

## 🔧 Customization Tips

### For API Components:
- Update the endpoint URL
- Modify request data structure
- Adjust success handling

### For Form Components:
- Update the Zod schema
- Add/remove form fields
- Customize validation messages
- Update success actions

### For UI:
- Adjust styling classes
- Modify layout structure
- Add/remove UI elements

## 📖 Documentation

See `/COMPONENT_CREATION_GUIDELINES.md` for complete guidelines on component creation.

## ✅ Quality Assurance

All templates ensure:
- ✅ Consistent error handling
- ✅ Proper TypeScript types
- ✅ Accessibility considerations
- ✅ Loading states
- ✅ User-friendly error messages
- ✅ Proper cleanup in finally blocks
