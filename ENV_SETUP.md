# 🔐 Environment Variables Configuration

## Frontend Environment Variables

Create or update `frontend/.env`:

```env
# ========================================
# REQUIRED: Backend API URL
# ========================================
# For production Android app, use your deployed backend URL
# Examples:
# - Render: https://monexa-backend.onrender.com
# - Railway: https://monexa-backend.up.railway.app  
# - Emergent: https://your-app.preview.emergentagent.com
#
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url-here.com


# ========================================
# OPTIONAL: Development Settings
# ========================================
EXPO_USE_FAST_RESOLVER=1
```

**⚠️ Important Notes:**
- The backend URL should NOT include `/api` at the end
- Must use HTTPS (not HTTP) for production
- Do not include trailing slash

---

## Backend Environment Variables

Create or update `backend/.env`:

```env
# ========================================
# DATABASE
# ========================================
# MongoDB connection string
# Get from: https://cloud.mongodb.com (free tier available)
#
# Format: mongodb+srv://username:password@cluster.mongodb.net/database_name
#
MONGO_URL=mongodb+srv://your-username:your-password@cluster.mongodb.net/monexa


# ========================================
# AUTHENTICATION
# ========================================
# JWT Secret Key for token signing
# Generate a strong random string (at least 32 characters)
# You can use: openssl rand -hex 32
#
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long


# ========================================
# STRIPE PAYMENT (Optional but recommended)
# ========================================
# Get these from: https://dashboard.stripe.com/apikeys
# Use LIVE keys for production (pk_live_... and sk_live_...)
# Use TEST keys for development (pk_test_... and sk_test_...)
#
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx


# ========================================
# AI INTEGRATION (Emergent LLM Key)
# ========================================
# This key is already configured and works with:
# - OpenAI GPT-5.2
# - Anthropic Claude
# - Google Gemini
#
# DO NOT CHANGE unless you have your own key
#
EMERGENT_LLM_KEY=sk-emergent-bC4534151143e3b9e3c0fe4d479c86b65b2ed9179bfaf89bc0a20b7e2fdmB6KP8
```

---

## How to Get API Keys

### 1. MongoDB Atlas (Database)

**Free Tier Available** ✅

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (choose free tier M0)
3. Create a database user:
   - Database Access → Add New Database User
   - Username: `monexa_user`
   - Password: Generate a strong password
4. Whitelist your IP or use 0.0.0.0/0 for all IPs:
   - Network Access → Add IP Address → Allow Access from Anywhere
5. Get connection string:
   - Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `monexa`

Example: `mongodb+srv://monexa_user:MyPassword123@cluster0.abc123.mongodb.net/monexa`

---

### 2. Stripe (Payment Processing)

**Production Account Required** (Free to sign up)

1. Sign up at https://stripe.com
2. Complete business verification
3. Go to Developers → API Keys
4. For testing:
   - Use "Publishable key" starting with `pk_test_...`
   - Use "Secret key" starting with `sk_test_...`
5. For production (after testing):
   - Toggle "View test data" OFF
   - Use "Publishable key" starting with `pk_live_...`
   - Use "Secret key" starting with `sk_live_...`

⚠️ **Never commit secret keys to git!**

Test card for Stripe testing:
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

---

### 3. JWT Secret Key

Generate a secure random string:

**Option 1: Using OpenSSL** (Mac/Linux)
```bash
openssl rand -hex 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 3: Online Generator**
Visit https://generate-secret.vercel.app/32

Copy the generated string and use as `JWT_SECRET`

---

### 4. Emergent LLM Key (AI Chat)

**Already Included** ✅

The key in the template works with:
- OpenAI GPT-5.2 (for chat)
- Claude Sonnet 4.5
- Google Gemini 3 Flash

This is a universal key that works with multiple AI providers!

**Do not change unless:**
- You have your own OpenAI/Anthropic/Google API key
- You want to use a different model

---

## Environment Variables Checklist

### Before Building Android APK:

Frontend `.env`:
- [ ] `EXPO_PUBLIC_BACKEND_URL` updated with deployed backend URL
- [ ] URL starts with `https://`
- [ ] No `/api` at the end
- [ ] No trailing slash

Backend `.env`:
- [ ] `MONGO_URL` configured with MongoDB Atlas connection string
- [ ] `JWT_SECRET` set to a strong random string (32+ chars)
- [ ] `STRIPE_SECRET_KEY` configured (if using payments)
- [ ] `STRIPE_PUBLISHABLE_KEY` configured (if using payments)
- [ ] `EMERGENT_LLM_KEY` present (should already be there)

### Security Best Practices:

- [ ] `.env` files are in `.gitignore`
- [ ] Never commit API keys to git
- [ ] Use different keys for development and production
- [ ] Use Stripe test keys during development
- [ ] Switch to Stripe live keys only for production
- [ ] Keep MongoDB connection string secure
- [ ] Use strong passwords for MongoDB users

---

## Testing Your Configuration

### Test Backend Locally:
```bash
cd backend
pip install -r requirements.txt
python -c "from server import app; print('Backend config OK!')"
uvicorn server:app --reload
```

Visit http://localhost:8000/docs to see API documentation

### Test Frontend Locally:
```bash
cd frontend
yarn install
npx expo start
```

Scan QR code with Expo Go app

### Test Database Connection:
```bash
cd backend
python -c "from motor.motor_asyncio import AsyncIOMotorClient; import os; from dotenv import load_dotenv; load_dotenv(); print('Testing MongoDB...'); client = AsyncIOMotorClient(os.getenv('MONGO_URL')); print('MongoDB connected!' if client else 'Failed')"
```

---

## Common Issues

### "Connection refused" or "Cannot connect to backend"
- ✅ Check `EXPO_PUBLIC_BACKEND_URL` is correct
- ✅ Ensure backend is deployed and running
- ✅ Test backend URL in browser

### "Database connection failed"
- ✅ Check MongoDB Atlas IP whitelist
- ✅ Verify database user password
- ✅ Ensure connection string format is correct

### "Stripe error"
- ✅ Verify you're using correct key type (test vs live)
- ✅ Check Stripe dashboard for API status
- ✅ Ensure both publishable and secret keys are set

### "JWT token invalid"
- ✅ JWT_SECRET must be the same across all backend instances
- ✅ If you change JWT_SECRET, all users must re-login

---

## Example: Complete Configuration

### Frontend `.env`
```env
EXPO_PUBLIC_BACKEND_URL=https://monexa-api.onrender.com
EXPO_USE_FAST_RESOLVER=1
```

### Backend `.env`
```env
MONGO_URL=mongodb+srv://monexa:SecurePass123@cluster0.abc.mongodb.net/monexa
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
STRIPE_SECRET_KEY=sk_live_51234567890abcdefghijklmnop
STRIPE_PUBLISHABLE_KEY=pk_live_51234567890abcdefghijklmnop
EMERGENT_LLM_KEY=sk-emergent-bC4534151143e3b9e3c0fe4d479c86b65b2ed9179bfaf89bc0a20b7e2fdmB6KP8
```

---

**You're all set! Make sure both `.env` files are configured before building your Android APK.**

Need help? Check `QUICKSTART.md` or `ANDROID_BUILD_GUIDE.md` for detailed instructions.
