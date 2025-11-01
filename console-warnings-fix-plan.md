# Console Warnings Fix Plan

## Issues Identified

### 1. Invalid Sentry DSN Configuration
- **Location**: `app.json` line 9
- **Issue**: Placeholder value `"https://YOUR_SENTRY_DSN_HERE.ingest.sentry.io/12345"`
- **Fix**: Update `src/utils/sentry.ts` to handle placeholder values gracefully

### 2. Deprecated props.pointerEvents Usage
- **Location**: React Native Web dependency (node_modules)
- **Issue**: Warning about using props.pointerEvents instead of style.pointerEvents
- **Fix**: Search our codebase for any props.pointerEvents usage and replace with style.pointerEvents

### 3. React DevTools Download Message
- **Status**: Normal development warning, not an error
- **Action**: Information only, no fix needed

### 4. Performance Optimizations Disabled
- **Status**: Expected in development mode
- **Context**: "Performance optimizations: OFF" is normal for development builds

## Implementation Steps

1. **Fix Sentry Configuration**
   - Update `src/utils/sentry.ts` to validate DSN format before initialization
   - Add proper error handling for placeholder values

2. **Find props.pointerEvents Usage**
   - Search entire codebase for deprecated usage
   - Replace with style.pointerEvents equivalent

3. **Performance Optimization**
   - Review if any performance settings can be safely enabled
   - Ensure development warnings remain enabled as requested

## Files to Modify
- `src/utils/sentry.ts` - Add DSN validation
- Any files with props.pointerEvents usage - Replace with style.pointerEvents
- Potentially app.json - Clean up configuration if needed