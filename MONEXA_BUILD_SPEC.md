# Monexa — AI-Powered Personal Finance App
## Full Build Specification / Rebuild Prompt

Use this document as a prompt if you want to rebuild this app from scratch in another environment. It describes the product, architecture, data models, API contract, screens, and business logic in enough detail to reproduce it.

---

## 1. Product Summary

Build a mobile-first personal finance app called **Monexa** using **React Native (Expo)** for the frontend and **FastAPI (Python)** for the backend, with **MongoDB** as the database.

Core value proposition: track income/expenses, understand spending through charts, and chat with an AI financial assistant that can both log transactions via natural language and give financial advice.

Monetization: freemium subscription with 3 tiers (Free, Starter $3/mo, Pro $9/mo) enforced server-side, paid via Stripe.

---

## 2. Tech Stack

- **Frontend**: React Native + Expo (TypeScript), Expo Router (file-based routing), tab navigation
- **Backend**: FastAPI (Python 3.11), Uvicorn, async MongoDB driver (Motor)
- **Database**: MongoDB (Atlas or self-hosted). Collections: `users`, `transactions`, `categories`, `chat_messages`, `chat_archives`, `promo_codes`
- **Auth**: JWT (email + bcrypt-hashed password), token stored client-side and sent as Bearer token
- **AI**: LLM chat completion API (originally OpenAI, later swapped to Google Gemini) — any LLM with a simple chat-completion interface works
- **Payments**: Stripe (Checkout Sessions + webhooks or client confirmation) for subscription upgrades, plus a custom promo code system
- **Password hashing**: bcrypt via passlib (pin bcrypt==4.0.1 to avoid known compatibility issues with newer bcrypt+passlib combos)

---

## 3. Environment Variables

| Variable | Purpose |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | Database name (default `monexa`) |
| `JWT_SECRET_KEY` | Signs JWT auth tokens (auto-generate if absent) |
| AI provider key(s) | Credentials for whichever LLM provider is used |
| `STRIPE_SECRET_KEY` | Stripe secret key (or fetch dynamically from a connection/secrets store) |

Design the app so it **degrades gracefully** without these: if `MONGO_URL` is missing, still boot the API and show the UI, just without persistence; if the AI key is missing, chat should return a friendly "AI unavailable" message instead of crashing.

---

## 4. Data Models

### User
```
id, email (unique), full_name, password_hash, currency (default USD),
subscription_tier (free|starter|pro), subscription_status, created_at,
monthly_budget (optional), ai_messages_used_today, ai_messages_reset_date
```

### Transaction
```
id, user_id, type (income|expense), amount (float), category (string),
description (string, optional), date (datetime), created_at
```

### Category
```
id, user_id, name, type (income|expense), icon, color, is_default (bool)
```
On signup, auto-seed default expense categories (Food, Transport, Rent, Bills, Shopping, Entertainment, Health, Education, etc.) and default income categories (Salary, Freelance, Investments, Gifts, etc.). Legacy categories without a `type` field should be treated as `expense` for backward compatibility.

### ChatMessage
```
id, user_id, role (user|assistant), text, created_at
```

### ChatArchive
```
id, user_id, messages[], archived_at, message_count
```

### PromoCode
```
code, discount_percent, tier_target, max_uses, times_used, expires_at, active
```

---

## 5. Backend API Contract

Base path: `/api`

**Auth**
- `POST /auth/signup` — create account, returns JWT token
- `POST /auth/login` — returns JWT token
- `POST /auth/forgot-password` — stub/reset flow
- `GET /auth/me` — current user profile

**Transactions**
- `GET /transactions?limit=` — list, most recent first
- `POST /transactions` — create
- `PUT /transactions/{id}` — update
- `DELETE /transactions/{id}` — delete

**Categories**
- `GET /categories` — list (seeded + custom)
- `POST /categories` — create custom category
- `PUT /categories/{id}` — update
- `DELETE /categories/{id}` — delete

**AI Chat**
- `POST /chat` — send a message, get AI response (see section 7 for logic)
- `GET /chat/history` — full message history
- `DELETE /chat/history` — clear
- `POST /chat/archive` — snapshot + clear current chat
- `GET /chat/archives` / `GET /chat/archives/{id}` / `DELETE /chat/archives/{id}`

**Analytics**
- `GET /analytics/summary` — balance, total income, total expense, transaction count
- `GET /analytics/insights` — top spending categories, trends (gated by tier)

**Profile**
- `GET /profile`
- `PUT /profile/preferences` — currency, budget, chat tone, etc.

**Subscription / Billing**
- `GET /subscription/current`
- `GET /subscription/plans`
- `GET /subscription/config` — Stripe publishable key etc.
- `POST /subscription/create-checkout-session`
- `POST /subscription/create`
- `POST /subscription/cancel`
- `GET /subscription/usage` — e.g. AI messages used today vs. daily limit
- `POST /promo-codes/validate` (query param based)
- `POST /promo-codes/create` (admin)
- `GET /promo-codes/list` (admin)

**Utility**
- `GET /` — root/info
- `GET /health` — health check, returns `{status: "healthy", service: "monexa-api"}`

All endpoints except signup/login/health require a `Bearer <JWT>` Authorization header, validated via a `get_current_user` dependency.

---

## 6. Subscription Tiers & Enforcement

| Tier | Price | AI messages/day | Charts | Export |
|---|---|---|---|---|
| Free | $0 | 10 | ❌ | ❌ |
| Starter | $3/mo | 50 | ✅ | ❌ |
| Pro | $9/mo | Unlimited | ✅ | ✅ |

Enforce limits **server-side** in the relevant endpoints (chat, analytics/insights, export), not just in the UI. Track `ai_messages_used_today` per user and reset daily. Return clear error messages/upgrade prompts when a limit is hit so the frontend can show an upgrade CTA.

Promo codes can override pricing/discount at checkout — validate them server-side against expiry, usage caps, and target tier before applying.

---

## 7. AI Assistant Logic (this is the most nuanced part)

The `/chat` endpoint should:

1. **Load user context**: recent transactions, balance, income/expense totals, top spending categories.
2. **Maintain a "tone" setting** (Strict / Funny / Friendly) chosen once per user and stored in preferences; inject tone-specific style instructions into the system prompt.
3. **First-time intro message**: if it's the user's first chat message ever, send a scripted welcome message introducing capabilities and asking them to pick a tone — don't call the LLM for this, just template it.
4. **Natural-language transaction parsing** — before calling the LLM, run a lightweight regex/keyword parser over the user's message to detect intent to log a transaction:
   - Expense patterns: phrases like "add $50 for food", "add $300 in food expense", "spent 20 on coffee" — extract amount + category. Recognize category keywords: food, groceries, transport, rent, bills, shopping, entertainment, health, education, coffee, dining, etc.
   - Income patterns: "add $500 salary", "got a bonus of 200", "freelance payment of 300" — recognize keywords: salary, freelance, bonus, investment, gift, refund, dividend, and connector words "in/as/from".
   - If amount is present but type (income vs expense) is ambiguous, do **not** guess — respond by asking the user to clarify ("Is this income or an expense?") rather than logging it wrong.
   - When a transaction is confidently parsed, insert it into the `transactions` collection directly, then tell the LLM the action already succeeded so it can craft a natural confirmation reply instead of hallucinating one itself. If the LLM call fails after a successful transaction insert, still return a simple success message referencing the parsed transaction — never lose track of a DB write due to an LLM outage.
5. **General-purpose assistant behavior**: beyond transaction logging, the system prompt should let the AI act as a broader financial buddy — answering questions like "find cheap restaurants near me", "how am I doing financially", "should I cut back on X" — using the user's real data where relevant, plus general knowledge for open-ended questions.
6. **System prompt structure** (build dynamically per request):
   - Persona + chosen tone + emoji style
   - Injected real financial data (balance, income, expenses, recent activity, top spending)
   - Explicit list of "capabilities" (track transactions, give advice, budgeting help, general assistant Q&A)
   - Explicit transaction-handling clarification rules
   - Response formatting rules (concise, 2–4 sentences, don't re-ask for data already known)
7. **Persist every user + assistant message** to `chat_messages` for history/continuity, and support archiving (snapshot + clear) so users can start fresh conversations.

---

## 8. Frontend Structure (Expo Router)

```
/app
  index.tsx                  — splash/redirect logic based on auth state
  (auth)/
    onboarding.tsx
    login.tsx
    signup.tsx
    forgot-password.tsx
  (tabs)/                    — main authenticated app, bottom tab bar
    home.tsx                 — balance, quick stats, recent transactions (last 5)
    transactions.tsx         — full list, filter/search
    insights.tsx             — charts (tier-gated)
    chat.tsx                 — AI assistant conversation UI
    profile.tsx              — account, subscription, settings entry point
  add-transaction.tsx        — modal/screen to add income or expense, filtered by category type
  categories.tsx             — manage categories, tabbed Income/Expense UI
  budget.tsx
  insights.tsx
  upgrade.tsx                — plan comparison + Stripe checkout + promo code field
  payment-success.tsx
  personal-info.tsx
  preferences.tsx            — currency, chat tone
  help.tsx
/contexts
  AuthContext.tsx             — login/signup/logout, token persistence, current user
  CurrencyContext.tsx         — multi-currency formatting
/utils
  api.ts                     — centralized fetch client; resolves base URL per platform (see section 9)
```

Key UI/UX rules:
- Number formatting: show comma separators, omit trailing `.00` for whole numbers (e.g. `1,500` not `1,500.00`).
- Charts/insights and export are visually gated: free-tier users see an upgrade prompt in place of the chart instead of the chart itself.
- Bottom tab bar must respect device safe-area insets (`useSafeAreaInsets` from `react-native-safe-area-context`), especially on Android where gesture/nav bars can overlap fixed-height tab bars — add extra bottom padding (e.g. `Math.max(insets.bottom, 16)` on Android) and increase tab bar height accordingly.
- Logout on web needs a `Platform.OS === 'web'` branch using `window.confirm()` since native `Alert.alert` confirm dialogs don't work the same on web.

---

## 9. Networking / Environment Quirks to Replicate

- **Web preview**: route API calls through a same-origin proxy path (e.g. `/api`) so the dev server proxies to the backend — avoids CORS issues in a browser-based preview.
- **Native (Expo Go / built app)**: use the actual public backend URL (not `localhost`), since a physical/emulated device can't reach the dev machine's localhost.
- Centralize this base-URL resolution in one `api.ts` utility rather than hardcoding URLs in individual screens/contexts.
- Add basic retry logic for transient 503s if your hosting platform's dev servers can cold-sleep after inactivity.
- Built/standalone binaries (APK/IPA) bundle the JS at build time — layout/logic changes require a fresh build to reach installed binaries, unlike Expo Go or web which hot-reload.

---

## 10. Security Notes

- Hash passwords with bcrypt; never store plaintext.
- Sign JWTs with a server-only secret; validate on every protected route.
- Enforce subscription limits and ownership checks (`user_id` scoping) server-side on every query — never trust the client to only request its own data.
- Validate promo codes server-side (expiry, usage cap, active flag) before applying discounts.
- Keep Stripe secret keys server-side only; only expose the publishable key to the client via a config endpoint.

---

## 11. Suggested Build Order (if starting fresh)

1. Backend skeleton: FastAPI app, MongoDB connection, health check.
2. Auth: signup/login/JWT, user model, default category seeding.
3. Transactions + Categories CRUD, scoped to authenticated user.
4. Frontend skeleton: Expo Router with auth flow + tab navigation, wired to real auth/transactions endpoints.
5. Analytics summary endpoint + home screen stats + recent transactions list.
6. Charts/insights screen (behind tier gate from the start, even if all tiers are unlocked initially).
7. AI chat: start with a plain LLM passthrough, then layer in the transaction-parsing regex logic and system-prompt context injection.
8. Stripe subscription flow + promo codes.
9. Polish: currency formatting, safe-area/navigation fixes, empty/error states.
10. Package for mobile (EAS Build) once core flows are stable.

---

*This document reflects the actual implemented behavior of the Monexa app as of its current state, and can be handed to a new AI coding session as a specification to rebuild an equivalent app.*
