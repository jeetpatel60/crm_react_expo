#!/bin/bash

# Test script for SAMVIDA CRM APK build
echo "🚀 Starting SAMVIDA CRM Build Test"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Login to EAS (if not already logged in)
echo "🔐 Checking EAS authentication..."
eas whoami || eas login

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf node_modules/.cache
rm -rf .expo

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for common issues
echo "🔍 Running pre-build checks..."

# Check if all required assets exist
if [ ! -f "assets/icon.png" ]; then
    echo "⚠️  Warning: assets/icon.png not found"
fi

if [ ! -f "assets/splash-icon.png" ]; then
    echo "⚠️  Warning: assets/splash-icon.png not found"
fi

if [ ! -f "assets/adaptive-icon.png" ]; then
    echo "⚠️  Warning: assets/adaptive-icon.png not found"
fi

# Check package.json for potential issues
echo "📋 Checking package.json..."
node -e "
const pkg = require('./package.json');
console.log('✓ App name:', pkg.name);
console.log('✓ Version:', pkg.version);
console.log('✓ Main entry:', pkg.main);
"

# Check app.json configuration
echo "📋 Checking app.json..."
node -e "
const app = require('./app.json');
console.log('✓ App name:', app.expo.name);
console.log('✓ Slug:', app.expo.slug);
console.log('✓ Version:', app.expo.version);
console.log('✓ New Architecture:', app.expo.newArchEnabled);
console.log('✓ Plugins:', app.expo.plugins);
"

# Build preview APK
echo "🔨 Building preview APK..."
eas build --platform android --profile preview --non-interactive

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📱 Next steps:"
    echo "1. Download the APK from the EAS dashboard"
    echo "2. Install on your Android device"
    echo "3. If you encounter a black/white screen:"
    echo "   - Connect device via USB"
    echo "   - Run: adb logcat | grep -i 'samvida\\|error\\|exception'"
    echo "   - Check the debug-apk.md file for troubleshooting steps"
    echo ""
    echo "🐛 Debug features added:"
    echo "- Enhanced error logging"
    echo "- Fallback error screen with retry options"
    echo "- Debug information display"
    echo "- Performance monitoring"
    echo ""
else
    echo "❌ Build failed!"
    echo "Check the EAS build logs for details"
    exit 1
fi
