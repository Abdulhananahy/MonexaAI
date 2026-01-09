# 📱 Monexa - AI-Powered Personal Finance App

<div align="center">

![Monexa](https://img.shields.io/badge/Monexa-Finance%20App-D32F2F?style=for-the-badge)
![Expo](https://img.shields.io/badge/Expo-52.0.0-000020?style=for-the-badge&logo=expo)
![React Native](https://img.shields.io/badge/React_Native-19.0-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb)

**Beautiful. Powerful. AI-Driven.**

*Take control of your finances with intelligent insights and seamless multi-currency support*

[Get Started](#-quick-start) • [Features](#-features) • [Build Android](#-build-for-android) • [Documentation](#-documentation)

</div>

---

## 🎯 What is Monexa?

Monexa is a modern, AI-powered personal finance mobile application that helps you track expenses, manage budgets, and get intelligent financial insights. Built with React Native (Expo) for cross-platform compatibility, it features a beautiful UI, multi-currency support with live exchange rates, and an integrated AI financial advisor powered by GPT-5.2.

### Why Monexa?

- 🤖 **AI Financial Advisor** - Chat with GPT-5.2 for personalized financial advice
- 💱 **Multi-Currency Support** - Track finances in 30+ currencies with live exchange rates
- 📊 **Advanced Analytics** - Beautiful charts and insights into your spending patterns
- 📅 **Smart Date Filtering** - View transactions by Today, Yesterday, or custom date ranges
- 🎨 **Beautiful UI** - Modern, intuitive design with Monexa red branding
- 💳 **Stripe Payments** - Monetize with subscription plans (Starter $3/mo, Pro $9/mo)
- 🔒 **Secure** - JWT authentication, password hashing, secure API connections

---

## ✨ Features

### 💰 Transaction Management
- Track income and expenses with categories
- Income sources (Salary, Freelance, Business, Investment, etc.)
- Expense categories (Food, Transport, Shopping, Bills, etc.)
- Add notes and dates to transactions
- Edit and delete transactions

### 📊 Advanced Analytics & Insights
- Financial overview dashboard
- Top spending categories
- Income vs Expense trends
- Multiple chart types (Bar, Pie, Line)
- AI-generated financial insights
- Date filtering (Today, Yesterday, Week, Month, Year, Custom)

### 📅 Grouped Transactions
- Beautiful date-based grouping
- Expandable/collapsible date sections
- Daily income and expense summaries
- Transaction count badges
- Smart date labels (Today, Yesterday)

### 💱 Multi-Currency Support
- 30+ supported currencies
- Live exchange rate conversion
- Automatic currency conversion across all screens
- Currency preferences per user

### 🤖 AI Financial Advisor
- Chat with GPT-5.2 for personalized advice
- Context-aware responses based on your data
- Ask about spending patterns, saving tips, budget recommendations
- Powered by Emergent LLM universal key

### 💳 Subscription & Payments
- Stripe integration for payments
- Two plans: Starter ($3/month) and Pro ($9/month)
- Secure Stripe Checkout for web
- Payment success flow

### 🎨 Beautiful Design
- Modern UI with Monexa red (#D32F2F) branding
- Dark mode support
- Smooth animations and transitions
- Touch-friendly interface
- Responsive layouts

### 🔐 Security
- JWT-based authentication
- Password hashing with bcrypt
- Secure API endpoints
- Protected user data
- HTTPS support

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo account (free at expo.dev)

### 5-Minute Setup

```bash
# 1. Clone or download the repository
cd monexa-app

# 2. Install frontend dependencies
cd frontend
yarn install

# 3. Configure environment variables
# Edit frontend/.env and set your backend URL
# See ENV_SETUP.md for details

# 4. Start the development server
npx expo start

# 5. Scan QR code with Expo Go app on your phone
```

---

## 📱 Build for Android

### Option 1: EAS Build (Easiest - Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Navigate to frontend
cd frontend

# Configure EAS (first time only)
eas build:configure

# Build APK
eas build --platform android --profile preview

# Download APK from the link provided
```

**Done!** Install the APK on your Android device.

### Option 2: Android Studio

See [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md) for detailed instructions on building with Android Studio.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Quick start guide and 5-minute build instructions |
| [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md) | Comprehensive Android build guide (EAS + Android Studio) |
| [ENV_SETUP.md](ENV_SETUP.md) | Environment variables configuration and API keys setup |

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: React Native 19 with Expo 52
- **Routing**: Expo Router (file-based routing)
- **UI Components**: React Native core components
- **Charts**: react-native-gifted-charts
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Date Handling**: date-fns

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT with bcrypt
- **Payment**: Stripe
- **AI Integration**: GPT-5.2 via emergentintegrations
- **CORS**: Enabled for cross-origin requests

### Infrastructure
- **Deployment**: Render, Railway, or Emergent platform
- **Database**: MongoDB Atlas (cloud)
- **CDN**: Expo CDN for assets
- **Payment Gateway**: Stripe

---

## 📂 Project Structure

```
monexa-app/
├── frontend/                    # Expo React Native app
│   ├── app/                    # Screens (file-based routing)
│   │   ├── (auth)/            # Auth flow screens
│   │   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx          # Landing/splash screen
│   │   ├── add-transaction.tsx
│   │   ├── edit-transaction/
│   │   ├── categories.tsx
│   │   ├── preferences.tsx
│   │   ├── upgrade.tsx
│   │   └── payment-success.tsx
│   ├── assets/                # Images, icons, fonts
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx
│   ├── utils/                 # Utilities
│   │   └── api.ts            # API client
│   ├── .env                   # Environment variables
│   ├── app.json              # Expo configuration
│   ├── eas.json              # EAS Build configuration
│   └── package.json          # Dependencies
│
├── backend/                   # FastAPI backend
│   ├── server.py             # Main API server
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Backend environment variables
│
├── QUICKSTART.md             # Quick start guide
├── ANDROID_BUILD_GUIDE.md    # Android build guide
├── ENV_SETUP.md              # Environment setup guide
└── README.md                 # This file
```

---

## 🎉 What's Next?

1. **Download your code** from Emergent using "Save to GitHub"
2. **Deploy your backend** to Render, Railway, or similar
3. **Configure environment variables** (see ENV_SETUP.md)
4. **Build Android APK** with EAS Build (see QUICKSTART.md)
5. **Test on your device**
6. **Publish to Google Play Store** (see ANDROID_BUILD_GUIDE.md)
7. **Share with the world!** 🚀

---

<div align="center">

**Built with ❤️ on Emergent**

*Transform your financial future, one transaction at a time*

[Get Started](#-quick-start) • [Documentation](#-documentation) • [Build Android](#-build-for-android)

</div>
