# APK Debugging Guide for SAMVIDA CRM

## Issue: Black/White Screen on APK Launch

### Immediate Steps to Debug

1. **Connect Device for Debugging**
   ```bash
   # Enable USB debugging on your Android device
   # Connect device via USB
   adb devices
   
   # View real-time logs
   adb logcat | grep -i "samvida\|crm\|expo\|react"
   ```

2. **Check for JavaScript Errors**
   ```bash
   # Filter for JavaScript errors
   adb logcat | grep -i "error\|exception\|crash"
   
   # Look specifically for database errors
   adb logcat | grep -i "sqlite\|database"
   ```

3. **Monitor App Startup**
   ```bash
   # Clear logs and start fresh
   adb logcat -c
   
   # Launch app and monitor
   adb logcat | grep -E "(SAMVIDA|ReactNativeJS|ExpoSQLite)"
   ```

### Common Causes and Solutions

#### 1. Database Initialization Failure
**Symptoms:** App shows loading screen then goes black
**Solution:** 
- Check if SQLite is properly initialized
- Verify database permissions
- Look for migration errors

#### 2. Navigation Setup Issues
**Symptoms:** White screen after loading
**Solution:**
- Check if navigation container is properly set up
- Verify all screen components are properly imported

#### 3. Theme/Context Provider Issues
**Symptoms:** App crashes during theme initialization
**Solution:**
- Ensure ThemeProvider wraps the entire app
- Check for circular dependencies in context

#### 4. Asset Loading Problems
**Symptoms:** App loads but shows blank content
**Solution:**
- Verify all assets are included in the build
- Check asset paths are correct

### Enhanced Debugging Features Added

The app now includes enhanced debugging features:

1. **Debug Logger**: Persistent logging that survives app restarts
2. **Performance Monitor**: Tracks initialization timing
3. **Fallback Screen**: Shows detailed error information
4. **Retry Mechanism**: Allows retrying failed initialization

### How to Access Debug Information

1. **If app shows error screen:**
   - Tap "Show Debug Info" button
   - View detailed logs and system information

2. **If app shows black/white screen:**
   - Force close and restart the app
   - Check device logs using adb logcat

### Build Commands for Testing

```bash
# Development build with debugging
eas build --platform android --profile development

# Preview build (closer to production)
eas build --platform android --profile preview

# Install and test
adb install path/to/your.apk
```

### Troubleshooting Steps

1. **Clear App Data**
   ```bash
   adb shell pm clear com.crmapp.mobile
   ```

2. **Reinstall App**
   ```bash
   adb uninstall com.crmapp.mobile
   adb install path/to/your.apk
   ```

3. **Check Device Storage**
   ```bash
   adb shell df /data
   ```

4. **Verify App Permissions**
   ```bash
   adb shell dumpsys package com.crmapp.mobile | grep permission
   ```

### Log Analysis

Look for these patterns in logs:

- `=== APP INITIALIZATION START ===` - App startup
- `=== DATABASE INITIALIZATION START ===` - Database setup
- `✓ Database connection established` - Successful DB connection
- `✗ Failed to verify table` - Database schema issues
- `=== APP INITIALIZATION FAILED ===` - Critical errors

### Emergency Recovery

If the app consistently fails to start:

1. **Reset to Factory State**
   ```bash
   adb shell pm clear com.crmapp.mobile
   ```

2. **Check for Conflicting Apps**
   - Uninstall other SQLite-based apps temporarily
   - Restart device

3. **Verify Device Compatibility**
   - Android version should be 6.0+
   - Sufficient storage (>100MB free)
   - ARM64 or x86_64 architecture

### Contact Information

If issues persist after following this guide:
1. Collect logs using `adb logcat`
2. Note device model and Android version
3. Document exact steps to reproduce
4. Share debug information from the app's fallback screen
