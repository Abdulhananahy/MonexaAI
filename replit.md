# Monexa - AI-Powered Personal Finance App

## Overview
Monexa is a mobile-first personal finance application built with React Native (Expo) and FastAPI backend. It features transaction tracking, multi-currency support, AI-powered financial advice, and Stripe payment integration.

## Tech Stack
- **Frontend**: React Native with Expo (TypeScript)
- **Backend**: FastAPI (Python 3.11)
- **Database**: Replit-managed PostgreSQL (accessed via `DATABASE_URL`, using `asyncpg`)
- **AI**: Google Gemini via Replit AI Integrations (no API key needed)
- **Payments**: Stripe

## Project Structure
```
/frontend          # React Native Expo app
  /app            # Expo Router screens
  /components     # UI components
  /contexts       # React contexts (Auth, Currency)
  /utils          # API client, utilities
/backend          # FastAPI server
  server.py       # Main API server
  requirements.txt
```

## Development Setup

### Workflows
- **Frontend**: Expo web on port 5000 (webview preview)
- **Backend**: FastAPI on port 8000 (internal API)

### Required Environment Variables

For full functionality, set these in the Secrets tab:

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | Replit-managed PostgreSQL connection string (auto-provisioned) |
| AI_INTEGRATIONS_GEMINI_* | Auto | Set automatically by Replit AI Integrations |
| STRIPE_SECRET_KEY | No | Stripe secret key for payments |
| JWT_SECRET_KEY | No | JWT signing key (auto-generated if not set) |

### Running Locally
The app starts automatically with two workflows:
1. Frontend serves the web preview on port 5000
2. Backend API runs on port 8000

### Mobile Development
Use the Expo Go app to scan the QR code from the terminal to test on mobile devices.

## Important Notes

1. **Web Preview Limitations**: The web preview only shows the frontend. Backend API calls from the browser won't work without CORS configuration for the Replit domain.

2. **Mobile-First**: This app is designed primarily for mobile. Full functionality is tested via Expo Go on iOS/Android.

3. **Database**: Uses Replit's built-in PostgreSQL database (auto-provisioned, `DATABASE_URL` set automatically). No external database setup required.

## Recent Changes
- Replaced `emergentintegrations` library with direct OpenAI AsyncOpenAI client
- Made MongoDB and OpenAI connections optional (graceful degradation)
- Configured Expo Metro bundler for Replit's port 5000 requirement
- Added email-validator package for pydantic email field support
- Added API proxy in Metro config to route `/api` requests to backend on port 8000
- Fixed web navigation by using Link components from expo-router
- Configured secrets: MONGO_URL, JWT_SECRET_KEY, OPENAI_API_KEY
- Fixed MongoDB Atlas SSL connection with TLS options
- Fixed bcrypt compatibility issue (downgraded to 4.0.1)
- Fixed AuthContext to use centralized api.ts utility for proper URL handling
- Fixed splash image reference in app.json (splash-image.png instead of splash-icon.png)
- Configured mobile API URL to use public Replit domain for Expo Go compatibility
- Removed incorrect EXPO_PUBLIC_BACKEND_URL env variable that was pointing to localhost:8000
- Fixed API configuration to use proxy path (/api) for web and public domain for mobile
- Updated number formatting to show commas without .00 for whole numbers (1,500 not 1,500.00)
- Added income/expense category types with tabbed UI in categories management screen
- Backend auto-creates default income categories (Salary, Freelance, Investments, etc.) for new users
- Backend defaults legacy categories without type field to 'expense' for backward compatibility
- Frontend filters categories by type in add-transaction, with fallback for legacy categories
- Fixed AI chat to only show action success message when transaction succeeds but OpenAI fails
- Fixed logout functionality for web using Platform.OS check with window.confirm()
- Integrated Stripe payments via Replit connection API (dynamic credential fetching)
- Added promo code support to checkout with validation and application
- Added promo code management endpoints (create, validate, list)
- Upgrade screen now includes promo code input field with validation
- Charts are now gated behind subscription (free users see upgrade prompt, Starter/Pro see charts)
- Fixed Stripe credential fetching to read from both 'secrets' and 'settings' keys
- Fixed promo code validation to accept Query parameters matching frontend usage
- Switched AI from OpenAI to Google Gemini using Replit AI Integrations (no external API key required, billed to Replit credits)
- Migrated entire backend from MongoDB to Replit-managed PostgreSQL after the external MongoDB Atlas cluster went permanently unreachable (DNS NXDOMAIN). Rewrote all data access in `server.py` to use `asyncpg` with UUID primary keys; schema covers users, transactions, categories, chat_messages, chat_archives/chat_archive_messages, and subscriptions. Removed motor/pymongo/dnspython dependencies.
- Rebranded the entire app to the "Monexa rebrand" visual identity designed in the mockup sandbox: indigo/purple (#6C5CE7) + gold (#FFC94D) palette on a warm cream background, "Baloo 2" display font + "Inter" body font, and "Momo" the owl mascot (SVG, ported to React Native at `frontend/components/Mascot.tsx`) used across all screens. Shared design tokens live in `frontend/constants/theme.ts` (COLORS, RADIUS, SHADOW, FONTS). All 14 screens (splash, onboarding, login, signup, home, add-transaction, transactions, chat, insights, upgrade, budget, categories, profile, preferences) were restyled to match while preserving all existing functionality (API calls, auth, Stripe checkout, navigation). Tab bar restyled with a raised circular "Add" button in the center matching the mockup's bottom nav.
- QA follow-up: removed an orphaned duplicate `frontend/app/insights.tsx` (old unbranded red-themed file left over from before Expo Router's `(tabs)` group existed) that was causing stale/red screens to flash. Also rebranded 8 auxiliary screens not covered by the original 14 mockups (manage-subscription, chat-archives, privacy-policy, terms-of-service, help, notifications, personal-info, payment-success) to use the shared theme tokens and Mascot component.
- Founder review follow-up: fixed `budget.tsx` calling a nonexistent `/api/transactions/summary` endpoint (silently always showed $0 spent); rewired to `/api/analytics/summary`. Reset demo account (`demo@monexa.app`) monthly budget to a realistic scale for its PKR transactions.
- Currency consistency fix: chat responses, action confirmations, and the AI system prompt in `backend/server.py` now use the user's actual currency symbol (via `CURRENCY_SYMBOLS`/`get_currency_symbol`/`fmt_amount` helpers) instead of a hardcoded `$`. Frontend screens (home, transactions, budget, preferences, insights) now use a shared `getCurrencySymbol()` helper from `frontend/utils/format.ts` instead of ad-hoc "show $ only if USD" checks.
- Removed the non-functional "Continue with Google" button from the login screen (had no `onPress` handler — dead UI element flagged in founder review). Google sign-in is not implemented; email/password remains the only auth method.
- Demo account (`demo@monexa.app`) intentionally uses PKR with a matching realistic budget to showcase multi-currency support in demos; this is a deliberate choice, not leftover test data.

## Subscription Tiers
- **Free**: 10 AI messages/day, no charts, no export
- **Starter ($3/mo)**: 50 AI messages/day, charts enabled, no export
- **Pro ($9/mo)**: Unlimited AI messages, charts enabled, export enabled

## User Preferences
- Mobile-first development approach
- Web preview for quick UI validation
