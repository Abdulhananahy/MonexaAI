# 🚀 Monexa - Quick Start Guide

## Download Instructions

### Method 1: Save to GitHub (Recommended)
1. In Emergent chat, use the "Save to GitHub" feature
2. Clone your repository:
   ```bash
   git clone https://github.com/your-username/monexa-app.git
   cd monexa-app
   ```

### Method 2: Manual Download
1. Download all files from Emergent workspace
2. Extract to a folder named `monexa-app`

---

## 📂 Project Structure

```
monexa-app/
├── frontend/               # Expo React Native app
│   ├── app/               # Screens (file-based routing)
│   ├── assets/            # Images, icons, fonts
│   ├── contexts/          # React contexts (Auth)
│   ├── utils/             # API utilities
│   ├── .env               # Environment variables
│   ├── app.json           # Expo configuration
│   ├── eas.json           # EAS Build configuration
│   └── package.json       # Dependencies
│
├── backend/               # FastAPI backend
│   ├── server.py          # Main API server
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables
│
└── ANDROID_BUILD_GUIDE.md # Detailed instructions
```

---

## ⚡ 5-Minute Android Build (EAS)

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
yarn install

# 3. Update backend URL in .env
# Edit frontend/.env and set:
# EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com

# 4. Install EAS CLI
npm install -g eas-cli

# 5. Login to Expo
eas login

# 6. Configure EAS
eas build:configure

# 7. Build APK
eas build --platform android --profile preview

# 8. Download APK when ready (you'll get a link)
```

Done! Install APK on your Android device.

---

## 🔧 Environment Variables

### Frontend `.env`
```env
# REQUIRED: Your deployed backend URL
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com

# Optional for local development
EXPO_USE_FAST_RESOLVER=1
```

### Backend `.env`
```env
# MongoDB Connection
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/monexa

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Stripe Keys (get from stripe.com)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Emergent LLM Key (for AI chat - already included)
EMERGENT_LLM_KEY=sk-emergent-bC4534151143e3b9e3c0fe4d479c86b65b2ed9179bfaf89bc0a20b7e2fdmB6KP8
```

---

## 🌐 Deploy Backend (Required!)

Your Android app needs a live backend. Quick options:

### Render (Free Tier)
1. Sign up at render.com
2. New Web Service → Connect repository
3. Settings:
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from backend `.env`
5. Deploy!

### Railway
1. Sign up at railway.app
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy!

Get your backend URL and update `frontend/.env`

---

## 📱 Test Your APK

### Install on Android Device
1. Download APK from EAS build
2. Transfer to phone via USB or email
3. Enable "Install from Unknown Sources" in Settings
4. Tap APK to install
5. Open Monexa app!

### Using ADB
```bash
adb install app-release.apk
```

---

## 🐛 Quick Troubleshooting

**"Unable to connect to backend"**
- ✅ Check EXPO_PUBLIC_BACKEND_URL in frontend/.env
- ✅ Ensure backend is deployed and accessible
- ✅ Test: Open https://your-backend/api/health in browser

**"Build failed"**
- ✅ Run: `yarn install` in frontend folder
- ✅ Check internet connection
- ✅ Try: `eas build --clear-cache --platform android`

**"App crashes on launch"**
- ✅ Verify backend URL is correct
- ✅ Ensure backend is running
- ✅ Check backend environment variables

---

## 📚 Full Documentation

See `ANDROID_BUILD_GUIDE.md` for:
- Detailed setup instructions
- Android Studio build process
- Publishing to Google Play Store
- Customization guide
- Advanced troubleshooting

---

## ✅ Pre-Flight Checklist

Before building APK:
- [ ] Backend deployed and accessible
- [ ] MongoDB connection working
- [ ] Stripe keys configured (if using payments)
- [ ] Frontend `.env` updated with backend URL
- [ ] Dependencies installed (`yarn install`)
- [ ] EAS CLI installed and logged in

---

## 🎉 What's Included

Your Monexa app has:
- ✅ Complete authentication system
- ✅ Transaction management
- ✅ Income sources & expense categories
- ✅ Multi-currency support (30+ currencies)
- ✅ AI financial advisor (GPT-5.2)
- ✅ Advanced analytics & charts
- ✅ Date filtering & grouping
- ✅ Stripe payments (web)
- ✅ Beautiful Monexa branding

---

## 🆘 Need Help?

- **EAS Build Issues**: community.expo.dev
- **Backend Deployment**: docs.render.com or railway.app/help
- **General Expo Questions**: docs.expo.dev

---

**You're ready to build! Follow the 5-minute build steps above. Good luck! 🚀**
