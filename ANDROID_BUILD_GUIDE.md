# 🎉 Monexa Finance App - Android Build Guide

Welcome! This guide will help you build the Monexa app for Android devices.

## 📱 What You're Building

**Monexa** - AI-Powered Personal Finance Mobile App
- Track income & expenses
- Multi-currency support with live exchange rates
- AI financial advisor (GPT-5.2)
- Beautiful date-based transaction grouping
- Stripe payment integration
- Advanced analytics & insights

---

## 🚀 Quick Start (Recommended - EAS Build)

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Expo account (free - sign up at expo.dev)

### Steps

1. **Extract the downloaded code**
   ```bash
   unzip monexa-app.zip
   cd monexa-app/frontend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Configure Backend URL**
   
   Edit `frontend/.env` file:
   ```env
   EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
   ```
   
   ⚠️ **Important**: Replace with your deployed backend URL (see Backend Deployment section below)

4. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

5. **Login to Expo**
   ```bash
   eas login
   ```
   
   Create a free account if you don't have one.

6. **Configure EAS Build**
   ```bash
   eas build:configure
   ```
   
   Select "All" when asked which platforms.

7. **Build Android APK**
   ```bash
   eas build --platform android --profile preview
   ```
   
   This will:
   - Upload your code to Expo servers
   - Build the APK in the cloud (takes ~10-15 minutes)
   - Provide download link when complete

8. **Download & Install**
   - Download the APK from the link provided
   - Transfer to your Android device
   - Install and enjoy!

---

## 🏗️ Alternative: Build Locally with Android Studio

### Prerequisites
- Android Studio installed
- JDK 17
- Android SDK 33+
- 8GB+ RAM

### Steps

1. **Extract and install dependencies** (same as steps 1-2 above)

2. **Generate Android Native Code**
   ```bash
   cd frontend
   npx expo prebuild --platform android
   ```
   
   This creates an `android/` folder with native Android project.

3. **Open in Android Studio**
   - Launch Android Studio
   - File → Open
   - Select the `frontend/android` folder
   - Wait for Gradle sync to complete

4. **Update Backend URL**
   
   Edit `frontend/.env`:
   ```env
   EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
   ```

5. **Build APK**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Or run: `cd android && ./gradlew assembleRelease`
   - APK location: `android/app/build/outputs/apk/release/app-release.apk`

6. **Install APK**
   - Transfer APK to your Android device
   - Enable "Install from Unknown Sources" in device settings
   - Install and run!

---

## 🌐 Backend Deployment (Required!)

Your Android app needs a live backend. Here are the easiest options:

### Option 1: Deploy on Render (Free Tier Available)

1. **Create account** at render.com

2. **Create New Web Service**
   - Connect your GitHub repo (or upload code)
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables** in Render dashboard:
   ```
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   EMERGENT_LLM_KEY=your_llm_key
   ```

4. **MongoDB**: Use MongoDB Atlas (free tier) - get connection string

5. **Copy your backend URL** (e.g., `https://monexa-backend.onrender.com`)

6. **Update frontend/.env** with this URL

### Option 2: Deploy on Railway

1. Sign up at railway.app
2. New Project → Deploy from GitHub
3. Select backend folder
4. Add environment variables
5. Deploy!

### Option 3: Use Emergent Deployment
- If you deploy on Emergent, use the preview URL as your backend
- Example: `https://monexa-resume.preview.emergentagent.com`

---

## ⚙️ Configuration Files Reference

### `frontend/app.json`

Key settings for Android:

```json
{
  "expo": {
    "name": "Monexa",
    "slug": "monexa",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#D32F2F"
    },
    "android": {
      "package": "com.yourcompany.monexa",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#D32F2F"
      },
      "permissions": []
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```

### `frontend/.env`

```env
# Backend URL - CHANGE THIS to your deployed backend
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com

# Local development (optional)
EXPO_USE_FAST_RESOLVER=1
```

---

## 🔐 API Keys Setup

### 1. Stripe (Payment Processing)

1. Sign up at stripe.com
2. Get your keys from Dashboard → Developers → API Keys
3. Use **Live keys** for production (pk_live_... and sk_live_...)
4. Add to backend `.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   ```

### 2. Emergent LLM Key (AI Chat)

Already included in your backend `.env`:
```
EMERGENT_LLM_KEY=sk-emergent-bC4534151143e3b9e3
```

This key works with GPT-5.2, Claude, and Gemini!

### 3. MongoDB Connection

Sign up at mongodb.com/atlas (free tier):
1. Create cluster
2. Create database user
3. Get connection string
4. Add to backend `.env`:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/monexa
   ```

---

## 📦 Build Profiles (EAS Build)

Create `frontend/eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

Build commands:
- **Development**: `eas build --profile development --platform android`
- **Preview (APK)**: `eas build --profile preview --platform android`
- **Production (Play Store)**: `eas build --profile production --platform android`

---

## 🐛 Troubleshooting

### "Unable to connect to backend"
- ✅ Check `EXPO_PUBLIC_BACKEND_URL` in `.env`
- ✅ Ensure backend is deployed and accessible
- ✅ Test backend URL in browser: `https://your-backend/api/health`

### "Build failed - Gradle error"
- ✅ Ensure JDK 17 is installed
- ✅ Clear cache: `cd android && ./gradlew clean`
- ✅ Update Gradle: Edit `android/gradle/wrapper/gradle-wrapper.properties`

### "App crashes on startup"
- ✅ Check if all dependencies are installed: `yarn install`
- ✅ Rebuild: `npx expo prebuild --clean`
- ✅ Check Android logs: `adb logcat`

### "Stripe not working on Android"
- The web version uses Stripe Checkout (works)
- For native Android, Stripe SDK is included but payment sheet needs activation
- Contact support message shows for mobile users

---

## 🎨 Customization

### Change App Name
Edit `frontend/app.json`:
```json
"name": "Your App Name"
```

### Change App Icon
Replace `frontend/assets/icon.png` with your 1024x1024 PNG

### Change Splash Screen
Replace `frontend/assets/splash.png` with your image

### Change Brand Color
Find and replace `#D32F2F` (Monexa red) throughout the app

---

## 📱 Testing on Device

### Install APK Directly
1. Enable "Developer Options" on Android device
2. Enable "Install from Unknown Sources"
3. Transfer APK via USB or email
4. Tap to install

### Using ADB
```bash
adb install app-release.apk
```

### Using Expo Go (Development)
```bash
cd frontend
npx expo start
```
Scan QR code with Expo Go app

---

## 🚀 Publishing to Google Play Store

1. **Build AAB** (Android App Bundle):
   ```bash
   eas build --platform android --profile production
   ```

2. **Create Google Play Developer Account** ($25 one-time fee)

3. **Prepare Store Listing**:
   - App name, description
   - Screenshots (phone + tablet)
   - Feature graphic
   - Privacy policy URL

4. **Upload AAB** to Google Play Console

5. **Fill in required information**:
   - Content rating questionnaire
   - Target audience
   - Privacy & security declarations

6. **Submit for Review** (takes 1-3 days)

---

## 📊 App Features Checklist

Your Monexa app includes:

- ✅ User authentication (signup/login)
- ✅ Transaction management (income/expense)
- ✅ Income sources vs expense categories
- ✅ Multi-currency support (30+ currencies)
- ✅ Live exchange rate conversion
- ✅ Date filtering (Today, Yesterday, Custom)
- ✅ Grouped transactions by date
- ✅ Expandable/collapsible date sections
- ✅ AI chat (GPT-5.2) for financial advice
- ✅ Advanced analytics & charts
- ✅ Stripe payment integration (web)
- ✅ Category management
- ✅ Budget tracking
- ✅ Beautiful Monexa red branding
- ✅ Dark mode support

---

## 🆘 Support

### Need Help?

1. **Documentation**: Check Expo docs at docs.expo.dev
2. **EAS Build Issues**: community.expo.dev
3. **Android Studio**: developer.android.com
4. **Backend Deployment**: Render docs, Railway docs

### Common Commands

```bash
# Install dependencies
yarn install

# Start development server
npx expo start

# Build APK (EAS)
eas build --platform android --profile preview

# Build locally
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease

# Clean build
rm -rf node_modules && yarn install
npx expo prebuild --clean
```

---

## 🎉 Success!

You should now have:
- ✅ Monexa Android APK
- ✅ Deployed backend
- ✅ Configured environment variables
- ✅ Working mobile app

**Next Steps**:
1. Install APK on your Android device
2. Create an account
3. Add some transactions
4. Try the AI chat
5. Test currency conversion
6. Share with friends!

---

## 📄 License

This is your app - you own all the code! Use it however you like.

---

**Built with ❤️ on Emergent**

Need to make changes? Just edit the code and rebuild! The entire codebase is yours to customize.

Good luck with your Android app! 🚀📱
