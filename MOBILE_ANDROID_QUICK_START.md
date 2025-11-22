# Mobile Android App - Quick Start Guide

## What Was Configured

✅ Android project structure initialized
✅ Package name: `com.fullmag`
✅ App name: FullMag
✅ Metro bundler configured on port 10003
✅ API endpoint configured for Android emulator: `http://10.0.2.2:10002/api`
✅ Network security config for cleartext traffic in development
✅ Babel module resolver configured

## Quick Start (3 Steps)

### 1. Start the Backend API
```bash
pnpm dev:api
```

### 2. Start Metro Bundler
```bash
pnpm dev:mobile
```

### 3. Run Android App
**Make sure you have an Android emulator running or device connected**, then:
```bash
pnpm dev:mobile:android
```

## First Time Setup

If this is your first time running the Android app, you need to:

1. **Install Android Studio** (if not already installed)
2. **Set up Android SDK**
3. **Create/Configure an Android Virtual Device (AVD)**

📖 **For detailed setup instructions, see**: `apps/mobile/ANDROID_SETUP.md`

## Available Commands

From the root directory:
- `pnpm dev:mobile` - Start Metro bundler (port 10003)
- `pnpm dev:mobile:android` - Build and run Android app
- `pnpm dev:mobile:ios` - Build and run iOS app (macOS only)

## Port Configuration

- **Web App**: Port 3000
- **API**: Port 10002
- **Mobile Metro**: Port 10003

## Troubleshooting

### Can't connect to API?
- Make sure API is running on port 10002
- The Android emulator uses `10.0.2.2` to access `localhost` on your host machine

### Metro bundler port conflict?
```bash
# Kill process on port 10003
netstat -ano | findstr :10003
taskkill /F /PID <PID>
```

### Build errors?
```bash
cd apps/mobile/android
gradlew clean
cd ../..
pnpm dev:mobile:android
```

## Next Steps

1. Install Android Studio if you haven't already
2. Create an Android Virtual Device (AVD)
3. Follow the 3-step quick start above

For comprehensive Android setup instructions, see `apps/mobile/ANDROID_SETUP.md`
