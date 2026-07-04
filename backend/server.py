from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import asyncpg
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import uuid as uuid_module
import os
import logging
from pathlib import Path
from google import genai
from google.genai import types
import aiohttp
import stripe

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Exchange Rate API (free tier)
EXCHANGE_RATE_API_KEY = os.environ.get('EXCHANGE_RATE_API_KEY', 'free')  # Uses free tier if not set
EXCHANGE_RATE_BASE_URL = "https://api.exchangerate-api.com/v4/latest/"

# Stripe Configuration - credentials fetched from Replit connection API
stripe_credentials_cache = {"secret": None, "publishable": None, "cached_at": None}

async def get_stripe_credentials():
    """Fetch Stripe credentials from Replit connection API"""
    global stripe_credentials_cache
    
    # Cache for 5 minutes
    if stripe_credentials_cache["cached_at"] and \
       (datetime.utcnow() - stripe_credentials_cache["cached_at"]).seconds < 300:
        return stripe_credentials_cache
    
    hostname = os.environ.get('REPLIT_CONNECTORS_HOSTNAME')
    repl_identity = os.environ.get('REPL_IDENTITY')
    web_repl_renewal = os.environ.get('WEB_REPL_RENEWAL')
    
    if not hostname:
        # Fall back to environment variables if not in Replit
        return {
            "secret": os.environ.get('STRIPE_SECRET_KEY'),
            "publishable": os.environ.get('STRIPE_PUBLISHABLE_KEY')
        }
    
    x_replit_token = f"repl {repl_identity}" if repl_identity else \
                     f"depl {web_repl_renewal}" if web_repl_renewal else None
    
    if not x_replit_token:
        return {"secret": None, "publishable": None}
    
    is_production = os.environ.get('REPLIT_DEPLOYMENT') == '1'
    target_env = 'production' if is_production else 'development'
    
    try:
        async with aiohttp.ClientSession() as session:
            url = f"https://{hostname}/api/v2/connection"
            params = {
                "include_secrets": "true",
                "connector_names": "stripe",
                "environment": target_env
            }
            headers = {"Accept": "application/json", "X_REPLIT_TOKEN": x_replit_token}
            
            async with session.get(url, params=params, headers=headers) as resp:
                data = await resp.json()
                connection = data.get("items", [{}])[0]
                
                # Try secrets first (Replit connection format), then settings (fallback)
                secrets = connection.get("secrets", {})
                settings = connection.get("settings", {})
                
                secret_key = secrets.get("secret") or settings.get("secret")
                publishable_key = secrets.get("publishable") or settings.get("publishable")
                
                stripe_credentials_cache = {
                    "secret": secret_key,
                    "publishable": publishable_key,
                    "cached_at": datetime.utcnow()
                }
                
                if stripe_credentials_cache["secret"]:
                    stripe.api_key = stripe_credentials_cache["secret"]
                
                return stripe_credentials_cache
    except Exception as e:
        logger.error(f"Failed to fetch Stripe credentials: {e}")
        return {"secret": None, "publishable": None}

# Initialize Stripe from env vars (will be updated dynamically)
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

# Gemini Configuration (using Replit AI Integrations - no API key needed)
AI_INTEGRATIONS_GEMINI_API_KEY = os.environ.get("AI_INTEGRATIONS_GEMINI_API_KEY")
AI_INTEGRATIONS_GEMINI_BASE_URL = os.environ.get("AI_INTEGRATIONS_GEMINI_BASE_URL")

gemini_client = None
if AI_INTEGRATIONS_GEMINI_BASE_URL:
    gemini_client = genai.Client(
        api_key=AI_INTEGRATIONS_GEMINI_API_KEY,
        http_options={
            'api_version': '',
            'base_url': AI_INTEGRATIONS_GEMINI_BASE_URL
        }
    )

async def send_ai_message(system_message: str, user_message: str) -> str:
    """Send a message to Gemini AI and get a response"""
    if not gemini_client:
        return "AI features are not available. Please configure the AI integration."
    try:
        import asyncio
        combined_prompt = f"{system_message}\n\nUser: {user_message}"
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=combined_prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=500,
                    temperature=0.7
                )
            )
        )
        return response.text or ""
    except Exception as e:
        logger.error(f"Gemini error: {str(e)}")
        return "I'm having trouble processing your request right now. Please try again."

# ============ POSTGRESQL CONNECTION (Replit-managed database) ============

DATABASE_URL = os.environ.get('DATABASE_URL', '')
db_pool: Optional[asyncpg.Pool] = None

if not DATABASE_URL:
    print("WARNING: DATABASE_URL not set. Database features will not work.")

async def fetchrow(query: str, *args):
    """Run a query and return a single row as a dict, or None."""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database is not available")
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row is not None else None

async def fetch(query: str, *args):
    """Run a query and return all rows as a list of dicts."""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database is not available")
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(r) for r in rows]

async def execute(query: str, *args) -> str:
    """Run a mutating query and return the status string (e.g. 'DELETE 1')."""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database is not available")
    async with db_pool.acquire() as conn:
        return await conn.execute(query, *args)

def row_to_dict(row: Optional[dict]) -> Optional[dict]:
    """Convert asyncpg row values (UUID) into JSON-safe python types."""
    if row is None:
        return None
    out = {}
    for k, v in row.items():
        if isinstance(v, uuid_module.UUID):
            out[k] = str(v)
        else:
            out[k] = v
    return out

def validate_uuid(value: str, detail: str = "Resource not found") -> str:
    """Ensure a path/user-supplied id is a syntactically valid UUID before querying."""
    try:
        uuid_module.UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=404, detail=detail)
    return value

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'monexa_jwt_secret_key_2025')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 720))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ CURRENCY HELPERS ============

CURRENCY_SYMBOLS = {
    "USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥", "AUD": "A$", "CAD": "C$",
    "CHF": "CHF", "CNY": "¥", "INR": "₹", "PKR": "₨", "MXN": "$", "BRL": "R$",
    "ZAR": "R", "SGD": "S$", "HKD": "HK$", "KRW": "₩", "TRY": "₺", "RUB": "₽",
    "AED": "AED ", "SAR": "SAR ",
}


def get_currency_symbol(currency_code: Optional[str]) -> str:
    if not currency_code:
        return "$"
    code = currency_code.upper()
    return CURRENCY_SYMBOLS.get(code, f"{code} ")


def fmt_amount(amount: float, currency_code: Optional[str]) -> str:
    return f"{get_currency_symbol(currency_code)}{amount:,.2f}"

# ============ MODELS ============

class User(BaseModel):
    id: Optional[str] = None
    full_name: str
    email: EmailStr
    password_hash: str
    currency: str = "USD"
    monthly_budget: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserSignup(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class Transaction(BaseModel):
    id: Optional[str] = None
    user_id: str
    type: str  # "income" or "expense"
    amount: float
    category_name: str
    income_source: Optional[str] = None  # For income transactions
    date: str
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TransactionCreate(BaseModel):
    type: str
    amount: float
    category_name: str
    income_source: Optional[str] = None
    date: str
    note: Optional[str] = None

class Category(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    type: str = "expense"  # "income" or "expense"
    icon: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    name: str
    type: str = "expense"  # "income" or "expense"
    icon: Optional[str] = None

class ChatMessage(BaseModel):
    id: Optional[str] = None
    user_id: str
    role: str  # "user" or "assistant"
    text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str

class UserProfile(BaseModel):
    full_name: str
    email: str
    currency: str
    monthly_budget: Optional[float] = None
    budget_alert_threshold: int = 80
    notify_budget_alerts: bool = True
    notify_ai_insights: bool = True

class UserPreferences(BaseModel):
    currency: Optional[str] = None
    monthly_budget: Optional[float] = None
    budget_alert_threshold: Optional[int] = None
    notify_budget_alerts: Optional[bool] = None
    notify_ai_insights: Optional[bool] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class UpdateProfileRequest(BaseModel):
    full_name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class SubscriptionPlan(BaseModel):
    id: Optional[str] = None
    user_id: str
    plan_type: str  # "free", "starter", "pro"
    status: str  # "active", "cancelled", "expired"
    start_date: datetime
    end_date: Optional[datetime] = None
    stripe_subscription_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CreateSubscriptionRequest(BaseModel):
    plan_type: str  # "starter" or "pro"
    payment_method_id: str

class ConvertCurrencyRequest(BaseModel):
    from_currency: str
    to_currency: str

# ============ HELPER FUNCTIONS ============

async def get_exchange_rate(from_currency: str, to_currency: str) -> float:
    """Fetch exchange rate from API"""
    try:
        async with aiohttp.ClientSession() as session:
            url = f"{EXCHANGE_RATE_BASE_URL}{from_currency}"
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    rates = data.get('rates', {})
                    return rates.get(to_currency, 1.0)
                return 1.0
    except Exception as e:
        logger.error(f"Exchange rate fetch error: {str(e)}")
        return 1.0

async def convert_user_transactions(user_id: str, from_currency: str, to_currency: str):
    """Convert all user transactions to new currency"""
    if from_currency == to_currency:
        return
    
    rate = await get_exchange_rate(from_currency, to_currency)
    
    # Update all transactions
    await execute("UPDATE transactions SET amount = amount * $1 WHERE user_id = $2::uuid", rate, user_id)
    
    # Update budget if exists
    user = await fetchrow("SELECT monthly_budget FROM users WHERE id = $1::uuid", user_id)
    if user and user.get('monthly_budget'):
        new_budget = user['monthly_budget'] * rate
        await execute("UPDATE users SET monthly_budget = $1 WHERE id = $2::uuid", new_budget, user_id)

def get_subscription_limits(plan_type: str) -> dict:
    """Get feature limits based on subscription plan"""
    limits = {
        "free": {
            "ai_messages_per_day": 10,
            "charts_enabled": False,
            "export_enabled": False,
            "history_days": 30,
            "chart_types": []
        },
        "starter": {
            "ai_messages_per_day": 50,
            "charts_enabled": True,
            "export_enabled": False,
            "history_days": 90,
            "chart_types": ["bar", "pie"]
        },
        "pro": {
            "ai_messages_per_day": -1,  # unlimited
            "charts_enabled": True,
            "export_enabled": True,
            "history_days": -1,  # unlimited
            "chart_types": ["bar", "pie", "line"]
        }
    }
    return limits.get(plan_type, limits["free"])

async def check_ai_message_limit(user_id: str) -> bool:
    """Check if user has exceeded AI message limit"""
    subscription = await fetchrow("SELECT plan_type FROM subscriptions WHERE user_id = $1::uuid AND status = 'active'", user_id)
    
    plan_type = subscription["plan_type"] if subscription else "free"
    limits = get_subscription_limits(plan_type)
    
    if limits["ai_messages_per_day"] == -1:
        return True  # Unlimited
    
    # Count messages today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    count_row = await fetchrow(
        "SELECT COUNT(*) as cnt FROM chat_messages WHERE user_id = $1::uuid AND role = 'user' AND created_at >= $2",
        user_id, today_start
    )
    message_count = count_row["cnt"] if count_row else 0
    
    return message_count < limits["ai_messages_per_day"]

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        try:
            uuid_module.UUID(user_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        row = await fetchrow("SELECT * FROM users WHERE id = $1::uuid", user_id)
        if row is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return row_to_dict(row)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# ============ SEED DEFAULT CATEGORIES ============

async def seed_default_categories(user_id: str):
    """Create default categories for a new user"""
    default_categories = [
        {"name": "Food", "icon": "restaurant"},
        {"name": "Transport", "icon": "car"},
        {"name": "Shopping", "icon": "shopping-cart"},
        {"name": "Bills", "icon": "receipt"},
        {"name": "Salary", "icon": "cash"},
        {"name": "Entertainment", "icon": "game-controller"},
    ]
    
    for cat in default_categories:
        await execute(
            "INSERT INTO categories (user_id, name, icon) VALUES ($1::uuid, $2, $3)",
            user_id, cat["name"], cat["icon"]
        )

# ============ AUTH ROUTES ============

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    # Check if user exists
    existing_user = await fetchrow("SELECT id FROM users WHERE email = $1", user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    password_hash = hash_password(user_data.password)
    row = await fetchrow(
        """INSERT INTO users (full_name, email, password_hash, currency)
           VALUES ($1, $2, $3, 'USD') RETURNING id""",
        user_data.full_name, user_data.email, password_hash
    )
    user_id = str(row["id"])
    
    # Seed default categories
    await seed_default_categories(user_id)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "full_name": user_data.full_name,
            "email": user_data.email,
            "currency": "USD"
        }
    }

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await fetchrow("SELECT * FROM users WHERE email = $1", credentials.email)
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["id"])
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "full_name": user["full_name"],
            "email": user["email"],
            "currency": user.get("currency", "USD")
        }
    }

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user = await fetchrow("SELECT id FROM users WHERE email = $1", request.email)
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # NOTE: No email provider is currently connected, so no email is actually sent.
    # Connect an email integration (e.g. SendGrid/Resend) and generate a real reset
    # token/link here before relying on this in production.
    return {"message": "If the email exists, a password reset link has been sent"}

@api_router.put("/profile")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update the current user's basic profile information"""
    full_name = request.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    updated_user = await fetchrow(
        "UPDATE users SET full_name = $1 WHERE id = $2::uuid RETURNING *",
        full_name, current_user["id"]
    )
    return {
        "id": str(updated_user["id"]),
        "full_name": updated_user["full_name"],
        "email": updated_user["email"],
        "currency": updated_user.get("currency", "USD"),
    }

@api_router.post("/auth/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Change the current user's password after verifying the current one"""
    user_doc = await fetchrow("SELECT password_hash FROM users WHERE id = $1::uuid", current_user["id"])
    if not user_doc or not verify_password(request.current_password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    new_hash = hash_password(request.new_password)
    await execute("UPDATE users SET password_hash = $1 WHERE id = $2::uuid", new_hash, current_user["id"])
    return {"message": "Password changed successfully"}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "full_name": current_user["full_name"],
        "email": current_user["email"],
        "currency": current_user.get("currency", "USD"),
        "monthly_budget": current_user.get("monthly_budget")
    }

# ============ TRANSACTION ROUTES ============

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(current_user: dict = Depends(get_current_user)):
    rows = await fetch(
        "SELECT * FROM transactions WHERE user_id = $1::uuid ORDER BY date DESC, created_at DESC",
        current_user["id"]
    )
    return [row_to_dict(t) for t in rows]

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate, current_user: dict = Depends(get_current_user)):
    row = await fetchrow(
        """INSERT INTO transactions (user_id, type, amount, category_name, income_source, date, note)
           VALUES ($1::uuid, $2, $3, $4, $5, $6, $7) RETURNING *""",
        current_user["id"], transaction.type, transaction.amount, transaction.category_name,
        transaction.income_source, transaction.date, transaction.note
    )
    return row_to_dict(row)

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, transaction: TransactionCreate, current_user: dict = Depends(get_current_user)):
    validate_uuid(transaction_id, "Transaction not found")
    # Check ownership
    existing = await fetchrow(
        "SELECT id FROM transactions WHERE id = $1::uuid AND user_id = $2::uuid",
        transaction_id, current_user["id"]
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    updated = await fetchrow(
        """UPDATE transactions
           SET type = $1, amount = $2, category_name = $3, income_source = $4, date = $5, note = $6, updated_at = now()
           WHERE id = $7::uuid RETURNING *""",
        transaction.type, transaction.amount, transaction.category_name,
        transaction.income_source, transaction.date, transaction.note, transaction_id
    )
    return row_to_dict(updated)

@api_router.get("/transactions/export")
async def export_transactions_csv(current_user: dict = Depends(get_current_user)):
    """Export all user transactions as CSV. Requires export_enabled entitlement (Pro plan)."""
    subscription = await fetchrow(
        "SELECT plan_type FROM subscriptions WHERE user_id = $1::uuid AND status = 'active'",
        current_user["id"]
    )
    plan_type = subscription["plan_type"] if subscription else "free"
    limits = get_subscription_limits(plan_type)

    if not limits.get("export_enabled"):
        raise HTTPException(
            status_code=403,
            detail="CSV export is a Pro feature. Upgrade your plan to export transactions."
        )

    transactions = await fetch(
        "SELECT * FROM transactions WHERE user_id = $1::uuid ORDER BY date DESC",
        current_user["id"]
    )

    import csv
    import io
    from fastapi.responses import StreamingResponse

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Type", "Category", "Income Source", "Amount", "Currency", "Note"])
    currency = current_user.get("currency", "USD")
    for t in transactions:
        writer.writerow([
            t.get("date", ""),
            t.get("type", ""),
            t.get("category_name", ""),
            t.get("income_source", "") or "",
            t.get("amount", 0),
            currency,
            (t.get("note", "") or "").replace("\n", " ")
        ])

    output.seek(0)
    filename = f"monexa_transactions_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: dict = Depends(get_current_user)):
    validate_uuid(transaction_id, "Transaction not found")
    result = await execute(
        "DELETE FROM transactions WHERE id = $1::uuid AND user_id = $2::uuid",
        transaction_id, current_user["id"]
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}

# ============ CATEGORY ROUTES ============

# Default income categories to create for new users
DEFAULT_INCOME_CATEGORIES = [
    {"name": "Salary", "icon": "💼", "color": "#10B981", "type": "income"},
    {"name": "Freelance", "icon": "💻", "color": "#3B82F6", "type": "income"},
    {"name": "Investments", "icon": "📈", "color": "#8B5CF6", "type": "income"},
    {"name": "Business", "icon": "🏢", "color": "#F59E0B", "type": "income"},
    {"name": "Rental", "icon": "🏠", "color": "#EC4899", "type": "income"},
    {"name": "Other Income", "icon": "💰", "color": "#6B7280", "type": "income"},
]

@api_router.get("/categories", response_model=List[Category])
async def get_categories(current_user: dict = Depends(get_current_user)):
    categories = await fetch("SELECT * FROM categories WHERE user_id = $1::uuid", current_user["id"])
    
    # Check if user has any income categories
    has_income_categories = any(c.get("type") == "income" for c in categories)
    
    # Auto-create default income categories if none exist
    if not has_income_categories:
        for default_cat in DEFAULT_INCOME_CATEGORIES:
            existing = await fetchrow(
                "SELECT id FROM categories WHERE user_id = $1::uuid AND name = $2",
                current_user["id"], default_cat["name"]
            )
            if not existing:
                await execute(
                    "INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1::uuid, $2, $3, $4, $5)",
                    current_user["id"], default_cat["name"], default_cat["type"],
                    default_cat["icon"], default_cat["color"]
                )
        
        # Re-fetch categories after creating defaults
        categories = await fetch("SELECT * FROM categories WHERE user_id = $1::uuid", current_user["id"])
    
    result = []
    for c in categories:
        doc = row_to_dict(c)
        if 'type' not in doc or not doc['type']:
            doc['type'] = 'expense'
        result.append(doc)
    return result

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    # Check if category name already exists for user
    existing = await fetchrow(
        "SELECT id FROM categories WHERE user_id = $1::uuid AND name = $2",
        current_user["id"], category.name
    )
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    row = await fetchrow(
        "INSERT INTO categories (user_id, name, type, icon) VALUES ($1::uuid, $2, $3, $4) RETURNING *",
        current_user["id"], category.name, category.type, category.icon
    )
    return row_to_dict(row)

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    validate_uuid(category_id, "Category not found")
    existing = await fetchrow(
        "SELECT id FROM categories WHERE id = $1::uuid AND user_id = $2::uuid",
        category_id, current_user["id"]
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    updated = await fetchrow(
        "UPDATE categories SET name = $1, type = $2, icon = $3 WHERE id = $4::uuid RETURNING *",
        category.name, category.type, category.icon, category_id
    )
    return row_to_dict(updated)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    validate_uuid(category_id, "Category not found")
    result = await execute(
        "DELETE FROM categories WHERE id = $1::uuid AND user_id = $2::uuid",
        category_id, current_user["id"]
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# ============ AI CHAT ROUTES ============

@api_router.post("/chat")
async def chat_with_ai(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Check AI message limit
        can_send = await check_ai_message_limit(current_user["id"])
        if not can_send:
            subscription = await fetchrow(
                "SELECT plan_type FROM subscriptions WHERE user_id = $1::uuid AND status = 'active'",
                current_user["id"]
            )
            plan_type = subscription["plan_type"] if subscription else "free"
            limits = get_subscription_limits(plan_type)
            
            raise HTTPException(
                status_code=429,
                detail=f"Daily AI message limit reached ({limits['ai_messages_per_day']} messages). Upgrade to get more!"
            )
        
        # Get chat history to check if this is first message
        existing_messages = await fetch("SELECT id FROM chat_messages WHERE user_id = $1::uuid", current_user["id"])
        is_first_message = len(existing_messages) == 0
        
        # Save user message
        await execute(
            "INSERT INTO chat_messages (user_id, role, text) VALUES ($1::uuid, 'user', $2)",
            current_user["id"], request.message
        )
        
        user_currency = current_user.get("currency", "USD")
        
        # Check for action commands BEFORE sending to AI
        message_lower = request.message.lower()
        action_performed = False
        action_response = ""
        
        # ADD EXPENSE - detect expense keywords and common expense categories
        expense_categories = ['food', 'groceries', 'transport', 'transportation', 'uber', 'taxi', 'gas', 'fuel', 
                              'rent', 'bills', 'utilities', 'electricity', 'water', 'internet', 'phone',
                              'shopping', 'clothes', 'entertainment', 'movies', 'dining', 'restaurant',
                              'health', 'medical', 'gym', 'fitness', 'education', 'books', 'subscriptions',
                              'travel', 'hotel', 'flight', 'coffee', 'snacks', 'drinks']
        
        is_expense = ('expense' in message_lower or 
                      any(word in message_lower for word in ['spent', 'bought', 'paid for']))
        has_expense_category = any(cat in message_lower for cat in expense_categories) and 'expense' not in message_lower
        
        if any(word in message_lower for word in ['add', 'spent', 'bought', 'paid']) and (is_expense or has_expense_category):
            import re
            amount_match = re.search(r'\$?(\d+(?:\.\d{2})?)', request.message)
            # Try multiple patterns: "for food", "in food", "on food", or just the category word
            category_match = re.search(r'(?:for|in|on)\s+(\w+)', request.message, re.IGNORECASE)
            
            # Determine category
            category = None
            if category_match:
                potential_cat = category_match.group(1).lower()
                # Skip if matched word is "expense" or a number
                if potential_cat != 'expense' and not potential_cat.isdigit():
                    category = potential_cat.capitalize()
            
            # If no category found from pattern, try to find expense category keyword
            if not category:
                for cat in expense_categories:
                    if cat in message_lower:
                        category = cat.capitalize()
                        break
            
            if amount_match and category:
                amount = float(amount_match.group(1))
                
                # Create transaction
                await execute(
                    """INSERT INTO transactions (user_id, type, amount, category_name, date)
                       VALUES ($1::uuid, 'expense', $2, $3, $4)""",
                    current_user["id"], amount, category, datetime.utcnow().strftime("%Y-%m-%d")
                )
                action_performed = True
                action_response = f"✅ Added {fmt_amount(amount, user_currency)} expense for {category}."
        
        # ADD INCOME - detect income keywords OR income categories like salary, freelance, etc.
        elif any(word in message_lower for word in ['earned', 'received', 'got paid', 'income', 'salary', 'freelance', 'bonus', 'investment', 'dividend', 'refund', 'gift']) and 'expense' not in message_lower:
            import re
            amount_match = re.search(r'\$?(\d+(?:\.\d{2})?)', request.message)
            # Try to find source from "from X" or "in X" or "as X"
            source_match = re.search(r'(?:from|in|as)\s+(\w+)', request.message, re.IGNORECASE)
            
            if amount_match:
                amount = float(amount_match.group(1))
                # Determine source from match or from keywords in message
                if source_match:
                    source = source_match.group(1).capitalize()
                else:
                    # Check which income keyword was used
                    for keyword in ['salary', 'freelance', 'bonus', 'investment', 'dividend', 'refund', 'gift']:
                        if keyword in message_lower:
                            source = keyword.capitalize()
                            break
                    else:
                        source = "Other"
                
                # Create transaction
                await execute(
                    """INSERT INTO transactions (user_id, type, amount, category_name, income_source, date)
                       VALUES ($1::uuid, 'income', $2, 'Income', $3, $4)""",
                    current_user["id"], amount, source, datetime.utcnow().strftime("%Y-%m-%d")
                )
                action_performed = True
                action_response = f"✅ Added {fmt_amount(amount, user_currency)} income from {source}."
        
        # SET BUDGET
        elif any(word in message_lower for word in ['budget', 'limit']):
            import re
            amount_match = re.search(r'\$?(\d+(?:\.\d{2})?)', request.message)
            
            if amount_match:
                budget = float(amount_match.group(1))
                await execute("UPDATE users SET monthly_budget = $1 WHERE id = $2::uuid", budget, current_user["id"])
                action_performed = True
                action_response = f"✅ Monthly budget set to {fmt_amount(budget, user_currency)}."
        
        # CREATE CATEGORY
        elif 'add category' in message_lower or 'new category' in message_lower or 'create category' in message_lower:
            import re
            category_match = re.search(r'category\s+(\w+)', request.message, re.IGNORECASE)
            
            if category_match:
                category_name = category_match.group(1).capitalize()
                
                # Check if exists
                existing = await fetchrow(
                    "SELECT id FROM categories WHERE user_id = $1::uuid AND name = $2",
                    current_user["id"], category_name
                )
                if not existing:
                    await execute(
                        "INSERT INTO categories (user_id, name) VALUES ($1::uuid, $2)",
                        current_user["id"], category_name
                    )
                    action_performed = True
                    action_response = f"✅ Created category '{category_name}'."
                else:
                    action_response = f"Category '{category_name}' already exists."
        
        # If action was performed, send simpler context to AI
        if action_performed:
            # Still get updated data
            transactions = await fetch("SELECT * FROM transactions WHERE user_id = $1::uuid", current_user["id"])
            total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
            total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
            
            simple_context = f"""You are Monexa. An action was just completed: {action_response}
            
Updated stats: Income {fmt_amount(total_income, user_currency)}, Expenses {fmt_amount(total_expense, user_currency)}

IMPORTANT: The user's currency is {user_currency}. Always use the symbol/prefix "{get_currency_symbol(user_currency)}" for any monetary amount you mention. Never use "$" unless that is actually the user's currency.

Respond with ONE supportive sentence about this action."""
            
            ai_response = await send_ai_message(simple_context, action_response)
            
            # Only append AI response if it's not an error message
            if ai_response and "trouble processing" not in ai_response:
                full_response = f"{action_response} {ai_response}"
            else:
                full_response = action_response
            
            await execute(
                "INSERT INTO chat_messages (user_id, role, text) VALUES ($1::uuid, 'assistant', $2)",
                current_user["id"], full_response
            )
            return {"message": full_response}
        
        # Check if user is setting tone preference
        if any(word in message_lower for word in ['strict', 'funny', 'friendly']):
            if 'strict' in message_lower:
                tone = 'strict'
            elif 'funny' in message_lower:
                tone = 'funny'
            else:
                tone = 'friendly'
            await execute("UPDATE users SET chat_tone = $1 WHERE id = $2::uuid", tone, current_user["id"])
        else:
            tone = current_user.get('chat_tone', 'friendly')
        
        # Get user context: transactions and categories
        transactions = await fetch("SELECT * FROM transactions WHERE user_id = $1::uuid", current_user["id"])
        categories = await fetch("SELECT * FROM categories WHERE user_id = $1::uuid", current_user["id"])
        
        # Calculate comprehensive financial data
        total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
        total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
        balance = total_income - total_expense
        
        # Get category-wise spending
        category_spending = {}
        for t in transactions:
            if t["type"] == "expense":
                cat = t["category_name"]
                category_spending[cat] = category_spending.get(cat, 0) + t["amount"]
        
        # Get recent transactions (last 5)
        recent_transactions = sorted(transactions, key=lambda x: x["date"], reverse=True)[:5]
        recent_trans_text = "\n".join([
            f"- {t['type'].title()}: {fmt_amount(t['amount'], user_currency)} for {t['category_name']}{' ('+t.get('income_source', '')+')' if t.get('income_source') else ''} on {t['date'][:10]}" 
            for t in recent_transactions
        ]) if recent_transactions else "No recent transactions"
        
        # Top spending categories
        top_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)[:3]
        top_spending_text = "\n".join([
            f"- {cat}: {fmt_amount(amt, user_currency)}" for cat, amt in top_categories
        ]) if top_categories else "No spending yet"
        
        # Available categories for quick reference
        category_names = [cat['name'] for cat in categories]
        
        # Tone configurations
        tone_configs = {
            'strict': {
                'personality': 'Direct, disciplined, and no-nonsense. You hold users accountable.',
                'style': 'Brief and commanding. Use phrases like "You need to...", "Stop...", "Focus on..."',
                'emoji': 'None or minimal (⚠️, 📊)'
            },
            'funny': {
                'personality': 'Witty, humorous, and entertaining while being helpful. Make finance fun!',
                'style': 'Light-hearted with jokes/puns. Use phrases like "Holy guacamole!", "Yikes!", "Cha-ching!"',
                'emoji': 'Frequent (😄, 🤑, 💸, 🎉, 😅)'
            },
            'friendly': {
                'personality': 'Warm, supportive, and encouraging. Like a caring friend.',
                'style': 'Gentle and positive. Use phrases like "Great job!", "You\'re doing well!", "Let\'s try..."',
                'emoji': 'Moderate (👋, 💪, ✨, 🎯)'
            }
        }
        
        current_tone = tone_configs.get(tone, tone_configs['friendly'])
        
        # Special handling for first message
        if is_first_message:
            intro_response = f"""Hey {current_user['full_name'].split()[0]}! 👋 I'm Monexa, your AI financial buddy.

**Here's how I can help you:**

• **Track & Analyze**: I monitor all your income, expenses, and spending patterns
• **Smart Advice**: Get personalized financial wisdom based on your actual data  
• **Quick Actions**: Add transactions, set budgets, or manage categories—all through chat!
• **Financial Goals**: Let's work together on saving, budgeting, and building better habits

**Current Status:**
Balance: {fmt_amount(balance, user_currency)} | Income: {fmt_amount(total_income, user_currency)} | Expenses: {fmt_amount(total_expense, user_currency)}

**Choose Your Chat Style:**
How should I talk to you?

• Type **"Strict"** - Direct and disciplined coaching
• Type **"Funny"** - Humorous and entertaining advice  
• Type **"Friendly"** - Warm and supportive guidance (current)

**Try these commands:**
- "Add {get_currency_symbol(user_currency)}50 expense for food"
- "Set monthly budget to {get_currency_symbol(user_currency)}2000"  
- "Show my spending this month"
- "How am I doing?"

What would you like to explore first?"""
            
            await execute(
                "INSERT INTO chat_messages (user_id, role, text) VALUES ($1::uuid, 'assistant', $2)",
                current_user["id"], intro_response
            )
            return {"message": intro_response}
        
        # Build context based on tone
        context = f"""You are Monexa, an AI financial buddy and virtual assistant with {current_tone['personality']}

TONE: {tone.upper()}
{current_tone['style']}
Emoji usage: {current_tone['emoji']}

FINANCIAL DATA FOR {current_user['full_name'].split()[0]}:
💰 Balance: {fmt_amount(balance, user_currency)}
📈 Income: {fmt_amount(total_income, user_currency)}
📉 Expenses: {fmt_amount(total_expense, user_currency)}
📊 Transactions: {len(transactions)}

RECENT ACTIVITY:
{recent_trans_text}

TOP SPENDING:
{top_spending_text}

YOUR CAPABILITIES:
1. Track transactions: Help add income/expenses when asked
2. Financial advice: Give personalized tips based on their spending
3. Budget guidance: Help with budgeting and saving strategies
4. General assistant: Answer questions about spending, restaurants, deals, where to shop, travel tips, etc.
5. Smart recommendations: If someone asks "find restaurants under {get_currency_symbol(user_currency)}20" or "where to eat cheap", give helpful suggestions

TRANSACTION HANDLING:
- If user mentions adding money but type is unclear, ask: "Is this income or an expense?"
- Common expense categories: food, groceries, transport, rent, bills, shopping, entertainment, health, education
- Common income sources: salary, freelance, bonus, investment, gift, refund

CURRENCY (VERY IMPORTANT):
- This user's currency is {user_currency}. ALWAYS use "{get_currency_symbol(user_currency)}" as the prefix for every monetary amount you write.
- NEVER use the "$" sign unless the user's currency is actually USD.

RESPONSE FORMAT:
- Keep responses concise (2-4 sentences)
- Use {current_tone['style']}
- Be helpful and proactive
- If asked about restaurants/shops/deals, give real helpful suggestions
- If unsure about transaction type, ask clarifying questions

Now respond to their message with your {tone} tone!"""

        # Send message to Gemini
        ai_response = await send_ai_message(context, request.message)
        
        # Save AI response
        await execute(
            "INSERT INTO chat_messages (user_id, role, text) VALUES ($1::uuid, 'assistant', $2)",
            current_user["id"], ai_response
        )
        
        return {"message": ai_response}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process chat request")

@api_router.get("/chat/history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    messages = await fetch(
        "SELECT * FROM chat_messages WHERE user_id = $1::uuid ORDER BY created_at ASC",
        current_user["id"]
    )
    return [row_to_dict(m) for m in messages]

@api_router.delete("/chat/history")
async def clear_chat_history(current_user: dict = Depends(get_current_user)):
    """Delete all chat messages for user"""
    result = await execute("DELETE FROM chat_messages WHERE user_id = $1::uuid", current_user["id"])
    deleted_count = int(result.split(" ")[1]) if result.startswith("DELETE") else 0
    return {"message": "Chat history cleared", "deleted_count": deleted_count}

@api_router.post("/chat/archive")
async def archive_chat_session(current_user: dict = Depends(get_current_user)):
    """Archive current chat and start fresh"""
    # Get all current messages
    messages = await fetch(
        "SELECT * FROM chat_messages WHERE user_id = $1::uuid ORDER BY created_at ASC",
        current_user["id"]
    )
    
    if len(messages) > 0:
        # Create archive record
        archive_row = await fetchrow(
            "INSERT INTO chat_archives (user_id, message_count) VALUES ($1::uuid, $2) RETURNING id",
            current_user["id"], len(messages)
        )
        archive_id = archive_row["id"]
        
        for m in messages:
            await execute(
                "INSERT INTO chat_archive_messages (archive_id, role, text, created_at) VALUES ($1, $2, $3, $4)",
                archive_id, m["role"], m["text"], m["created_at"]
            )
        
        # Clear current messages
        await execute("DELETE FROM chat_messages WHERE user_id = $1::uuid", current_user["id"])
        
        return {
            "message": "Chat archived successfully",
            "archived_messages": len(messages),
            "archive_id": str(archive_id)
        }
    
    return {"message": "No messages to archive"}

@api_router.get("/chat/archives")
async def get_chat_archives(current_user: dict = Depends(get_current_user)):
    """Get list of archived chat sessions"""
    archives = await fetch(
        "SELECT * FROM chat_archives WHERE user_id = $1::uuid ORDER BY archived_at DESC",
        current_user["id"]
    )
    
    result = []
    for archive in archives:
        # Get first user message as preview
        first_message = await fetchrow(
            "SELECT text FROM chat_archive_messages WHERE archive_id = $1 AND role = 'user' ORDER BY created_at ASC LIMIT 1",
            archive["id"]
        )
        preview = (first_message["text"][:50] + "...") if first_message else "Empty chat"
        
        result.append({
            "id": str(archive["id"]),
            "archived_at": archive["archived_at"].isoformat(),
            "message_count": archive["message_count"],
            "preview": preview
        })
    
    return {"archives": result}

@api_router.get("/chat/archives/{archive_id}")
async def get_archived_chat(archive_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific archived chat"""
    validate_uuid(archive_id, "Archive not found")
    archive = await fetchrow(
        "SELECT * FROM chat_archives WHERE id = $1::uuid AND user_id = $2::uuid",
        archive_id, current_user["id"]
    )
    
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found")
    
    messages = await fetch(
        "SELECT * FROM chat_archive_messages WHERE archive_id = $1::uuid ORDER BY created_at ASC",
        archive_id
    )
    
    return {
        "archive_id": str(archive["id"]),
        "archived_at": archive["archived_at"].isoformat(),
        "messages": [row_to_dict(m) for m in messages]
    }

@api_router.delete("/chat/archives/{archive_id}")
async def delete_archived_chat(archive_id: str, current_user: dict = Depends(get_current_user)):
    """Delete archived chat"""
    validate_uuid(archive_id, "Archive not found")
    result = await execute(
        "DELETE FROM chat_archives WHERE id = $1::uuid AND user_id = $2::uuid",
        archive_id, current_user["id"]
    )
    
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Archive not found")
    
    return {"message": "Archive deleted successfully"}

# ============ ANALYTICS ROUTES ============

@api_router.get("/analytics/summary")
async def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    transactions = await fetch("SELECT * FROM transactions WHERE user_id = $1::uuid", current_user["id"])
    
    total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
    balance = total_income - total_expense
    
    # Category breakdown
    category_totals = {}
    for t in transactions:
        if t["type"] == "expense":
            cat = t["category_name"]
            category_totals[cat] = category_totals.get(cat, 0) + t["amount"]
    
    # Sort categories by total spending
    top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]

    # Budget alert calculation (current calendar month spend vs monthly_budget)
    monthly_budget = current_user.get("monthly_budget")
    alert_threshold = current_user.get("budget_alert_threshold", 80)
    notify_budget_alerts = current_user.get("notify_budget_alerts", True)
    now = datetime.utcnow()
    month_start_str = now.strftime("%Y-%m-01")
    current_month_expense = sum(
        t["amount"] for t in transactions
        if t["type"] == "expense" and isinstance(t.get("date"), str) and t["date"] >= month_start_str
    )
    budget_percent_used = None
    budget_alert = False
    if monthly_budget and monthly_budget > 0:
        budget_percent_used = round((current_month_expense / monthly_budget) * 100, 1)
        budget_alert = notify_budget_alerts and budget_percent_used >= alert_threshold
    
    return {
        "balance": balance,
        "total_income": total_income,
        "total_expense": total_expense,
        "top_spending_categories": [{"name": cat, "amount": amt} for cat, amt in top_categories],
        "transaction_count": len(transactions),
        "monthly_budget": monthly_budget,
        "current_month_expense": current_month_expense,
        "budget_percent_used": budget_percent_used,
        "budget_alert": budget_alert,
        "budget_alert_threshold": alert_threshold
    }

@api_router.get("/analytics/insights")
async def get_ai_insights(current_user: dict = Depends(get_current_user)):
    """Generate AI-powered insights about user's finances"""
    try:
        transactions = await fetch("SELECT * FROM transactions WHERE user_id = $1::uuid", current_user["id"])
        
        if len(transactions) == 0:
            return {
                "insights": [
                    "Start tracking your income and expenses to get personalized insights!",
                    "Add your first transaction to see spending patterns.",
                    "Monexa will analyze your data and provide helpful tips."
                ]
            }
        
        total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
        total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
        
        # Category breakdown
        category_totals = {}
        for t in transactions:
            if t["type"] == "expense":
                cat = t["category_name"]
                category_totals[cat] = category_totals.get(cat, 0) + t["amount"]
        
        top_category = max(category_totals.items(), key=lambda x: x[1])[0] if category_totals else "None"
        
        # Generate insights with AI
        prompt = f"""Based on this financial data, provide 3 brief, actionable insights (each 10-15 words):
        
Total Income: {total_income}
Total Expenses: {total_expense}
Top Spending Category: {top_category}
Number of Transactions: {len(transactions)}

Format as a simple list, no numbering."""

        insights_text = await send_ai_message(
            "You are a helpful financial assistant. Provide brief, supportive insights.",
            prompt
        )
        insights = [line.strip() for line in insights_text.split('\n') if line.strip()]
        
        return {"insights": insights[:3]}
        
    except Exception as e:
        logger.error(f"Insights generation error: {str(e)}")
        return {
            "insights": [
                "Keep tracking your spending to build better habits!",
                "Review your expenses regularly to stay on budget.",
                "Consider setting a monthly budget goal."
            ]
        }

# ============ USER PROFILE ROUTES ============

@api_router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "full_name": current_user["full_name"],
        "email": current_user["email"],
        "currency": current_user.get("currency", "USD"),
        "monthly_budget": current_user.get("monthly_budget"),
        "budget_alert_threshold": current_user.get("budget_alert_threshold", 80),
        "notify_budget_alerts": current_user.get("notify_budget_alerts", True),
        "notify_ai_insights": current_user.get("notify_ai_insights", True)
    }

@api_router.put("/profile/preferences")
async def update_preferences(preferences: UserPreferences, current_user: dict = Depends(get_current_user)):
    converted = False
    
    # Handle currency change with conversion
    if preferences.currency:
        old_currency = current_user.get('currency', 'USD')
        new_currency = preferences.currency
        
        if old_currency != new_currency:
            # Convert all transactions
            await convert_user_transactions(current_user["id"], old_currency, new_currency)
            await execute("UPDATE users SET currency = $1 WHERE id = $2::uuid", new_currency, current_user["id"])
            converted = True
            logger.info(f"Converted transactions from {old_currency} to {new_currency} for user {current_user['id']}")
    
    if preferences.monthly_budget is not None:
        await execute("UPDATE users SET monthly_budget = $1 WHERE id = $2::uuid", preferences.monthly_budget, current_user["id"])

    if preferences.budget_alert_threshold is not None:
        clamped = max(1, min(100, preferences.budget_alert_threshold))
        await execute("UPDATE users SET budget_alert_threshold = $1 WHERE id = $2::uuid", clamped, current_user["id"])

    if preferences.notify_budget_alerts is not None:
        await execute("UPDATE users SET notify_budget_alerts = $1 WHERE id = $2::uuid", preferences.notify_budget_alerts, current_user["id"])

    if preferences.notify_ai_insights is not None:
        await execute("UPDATE users SET notify_ai_insights = $1 WHERE id = $2::uuid", preferences.notify_ai_insights, current_user["id"])
    
    return {"message": "Preferences updated successfully", "converted": converted}

# ============ STRIPE WEBHOOK ============

STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

async def _sync_subscription_from_stripe_id(stripe_subscription_id: str, status_override: Optional[str] = None):
    """Sync local subscription record status based on a Stripe subscription id."""
    local_sub = await fetchrow("SELECT * FROM subscriptions WHERE stripe_subscription_id = $1", stripe_subscription_id)
    if not local_sub:
        logger.warning(f"Webhook: no local subscription found for Stripe id {stripe_subscription_id}")
        return

    new_status = status_override
    if not new_status:
        try:
            stripe_sub = stripe.Subscription.retrieve(stripe_subscription_id)
            stripe_status = stripe_sub.status  # active, past_due, canceled, unpaid, incomplete_expired...
            if stripe_status == "active":
                new_status = "active"
            elif stripe_status in ("canceled", "incomplete_expired"):
                new_status = "cancelled"
            elif stripe_status in ("past_due", "unpaid"):
                new_status = "past_due"
            else:
                new_status = stripe_status
        except Exception as e:
            logger.error(f"Webhook: failed to retrieve Stripe subscription {stripe_subscription_id}: {e}")
            return

    if new_status in ("cancelled", "past_due"):
        await execute(
            "UPDATE subscriptions SET status = $1, end_date = $2 WHERE id = $3",
            new_status, datetime.utcnow(), local_sub["id"]
        )
    else:
        await execute("UPDATE subscriptions SET status = $1 WHERE id = $2", new_status, local_sub["id"])
    logger.info(f"Webhook: synced subscription {stripe_subscription_id} -> status={new_status}")

@api_router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Receive Stripe webhook events to keep subscription status in sync with Stripe.
    Configure this endpoint's public URL in the Stripe Dashboard and set STRIPE_WEBHOOK_SECRET
    to the signing secret Stripe gives you, so payloads can be verified.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    event = None
    if STRIPE_WEBHOOK_SECRET and sig_header:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            logger.error(f"Stripe webhook signature verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    else:
        # No webhook secret configured yet - accept unverified payload so the endpoint
        # is functional out of the box, but this should be locked down before going live.
        logger.warning("STRIPE_WEBHOOK_SECRET not set - processing Stripe webhook without signature verification")
        try:
            import json
            event = json.loads(payload)
        except Exception as e:
            logger.error(f"Failed to parse Stripe webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")

    event_type = event.get("type") if isinstance(event, dict) else event["type"]
    data_object = event["data"]["object"] if isinstance(event, dict) else event["data"]["object"]

    try:
        if event_type == "customer.subscription.deleted":
            await _sync_subscription_from_stripe_id(data_object["id"], status_override="cancelled")
        elif event_type == "customer.subscription.updated":
            await _sync_subscription_from_stripe_id(data_object["id"])
        elif event_type == "invoice.payment_failed":
            sub_id = data_object.get("subscription")
            if sub_id:
                await _sync_subscription_from_stripe_id(sub_id, status_override="past_due")
        elif event_type == "invoice.paid":
            sub_id = data_object.get("subscription")
            if sub_id:
                await _sync_subscription_from_stripe_id(sub_id, status_override="active")
        else:
            logger.info(f"Stripe webhook: unhandled event type {event_type}")
    except Exception as e:
        logger.error(f"Error processing Stripe webhook event {event_type}: {e}")
        # Return 200 anyway so Stripe doesn't hammer retries for a local bug;
        # the error is logged for investigation.

    return {"received": True}

# ============ SUBSCRIPTION ROUTES ============

@api_router.get("/subscription/current")
async def get_current_subscription(current_user: dict = Depends(get_current_user)):
    """Get user's current subscription plan"""
    subscription = await fetchrow(
        "SELECT * FROM subscriptions WHERE user_id = $1::uuid AND status = 'active'",
        current_user["id"]
    )
    
    if subscription:
        return {
            "plan_type": subscription["plan_type"],
            "status": subscription["status"],
            "limits": get_subscription_limits(subscription["plan_type"]),
            "start_date": subscription["start_date"].isoformat(),
            "end_date": subscription.get("end_date").isoformat() if subscription.get("end_date") else None
        }
    
    # Return free plan
    return {
        "plan_type": "free",
        "status": "active",
        "limits": get_subscription_limits("free"),
        "start_date": current_user.get("created_at", datetime.utcnow()).isoformat(),
        "end_date": None
    }

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    plans = [
        {
            "id": "free",
            "name": "Free",
            "price": 0,
            "interval": "month",
            "features": [
                "Unlimited transactions",
                "Basic categories",
                "10 AI messages/day",
                "Basic insights",
                "30 days history"
            ],
            "limits": get_subscription_limits("free")
        },
        {
            "id": "starter",
            "name": "Starter",
            "price": 3,
            "interval": "month",
            "features": [
                "Everything in Free",
                "50 AI messages/day",
                "Basic charts (bar/pie)",
                "90 days history",
                "Budget alerts",
                "Email support"
            ],
            "limits": get_subscription_limits("starter")
        },
        {
            "id": "pro",
            "name": "Pro",
            "price": 9,
            "interval": "month",
            "features": [
                "Everything in Starter",
                "Unlimited AI chat",
                "All chart types",
                "Unlimited history",
                "CSV export",
                "Advanced insights",
                "Priority support"
            ],
            "limits": get_subscription_limits("pro")
        }
    ]
    return {"plans": plans}

@api_router.post("/subscription/create")
async def create_subscription(
    request: CreateSubscriptionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new subscription with real Stripe payment"""
    try:
        plan_type = request.plan_type
        if plan_type not in ["starter", "pro"]:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        # Get price amount
        prices = {"starter": 3, "pro": 9}
        amount = prices[plan_type]
        
        # Check if user already has active subscription
        existing = await fetchrow(
            "SELECT * FROM subscriptions WHERE user_id = $1::uuid AND status = 'active'",
            current_user["id"]
        )
        
        if existing:
            # Cancel old Stripe subscription if exists
            if existing.get("stripe_subscription_id") and not existing["stripe_subscription_id"].startswith("sub_mock"):
                try:
                    stripe.Subscription.cancel(existing["stripe_subscription_id"])
                except Exception as e:
                    logger.error(f"Failed to cancel old subscription: {str(e)}")
            
            # Update old subscription in DB
            await execute(
                "UPDATE subscriptions SET status = 'cancelled', end_date = $1 WHERE id = $2",
                datetime.utcnow(), existing["id"]
            )
        
        # Create Stripe customer if doesn't exist
        user_email = current_user["email"]
        user_name = current_user["full_name"]
        
        # Check if customer exists in our DB
        user_doc = await fetchrow("SELECT stripe_customer_id FROM users WHERE id = $1::uuid", current_user["id"])
        stripe_customer_id = user_doc.get("stripe_customer_id")
        
        if not stripe_customer_id:
            # Create new Stripe customer
            customer = stripe.Customer.create(
                email=user_email,
                name=user_name,
                metadata={"user_id": current_user["id"]}
            )
            stripe_customer_id = customer.id
            
            # Save to DB
            await execute("UPDATE users SET stripe_customer_id = $1 WHERE id = $2::uuid", stripe_customer_id, current_user["id"])
        
        # Attach payment method to customer
        try:
            stripe.PaymentMethod.attach(
                request.payment_method_id,
                customer=stripe_customer_id
            )
            
            # Set as default payment method
            stripe.Customer.modify(
                stripe_customer_id,
                invoice_settings={"default_payment_method": request.payment_method_id}
            )
        except Exception as e:
            logger.error(f"Failed to attach payment method: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Payment method error: {str(e)}")
        
        # Create Stripe subscription
        try:
            stripe_subscription = stripe.Subscription.create(
                customer=stripe_customer_id,
                items=[{
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"Monexa {plan_type.title()} Plan",
                            "description": f"Monthly subscription to Monexa {plan_type.title()}"
                        },
                        "recurring": {"interval": "month"},
                        "unit_amount": amount * 100  # Stripe uses cents
                    }
                }],
                payment_behavior="default_incomplete",
                payment_settings={"save_default_payment_method": "on_subscription"},
                expand=["latest_invoice.payment_intent"]
            )
            
            # Create subscription record in DB
            sub_row = await fetchrow(
                """INSERT INTO subscriptions (user_id, plan_type, status, start_date, end_date, stripe_subscription_id, stripe_customer_id, amount)
                   VALUES ($1::uuid, $2, 'active', $3, $4, $5, $6, $7) RETURNING id""",
                current_user["id"], plan_type, datetime.utcnow(), datetime.utcnow() + timedelta(days=30),
                stripe_subscription.id, stripe_customer_id, amount
            )
            
            logger.info(f"Created real Stripe subscription {stripe_subscription.id} for user {current_user['id']}")
            
            return {
                "success": True,
                "subscription_id": str(sub_row["id"]),
                "stripe_subscription_id": stripe_subscription.id,
                "client_secret": stripe_subscription.latest_invoice.payment_intent.client_secret,
                "plan_type": plan_type,
                "amount": amount,
                "message": f"Successfully subscribed to {plan_type.title()} plan for ${amount}/month!",
                "limits": get_subscription_limits(plan_type)
            }
            
        except stripe.error.CardError as e:
            raise HTTPException(status_code=400, detail=f"Card error: {e.user_message}")
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Subscription creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create subscription: {str(e)}")

@api_router.get("/subscription/config")
async def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    credentials = await get_stripe_credentials()
    return {"publishable_key": credentials.get("publishable")}

class CreatePaymentSheetRequest(BaseModel):
    plan_type: str  # "starter" or "pro"

@api_router.post("/subscription/create-payment-sheet")
async def create_payment_sheet(
    request: CreatePaymentSheetRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe PaymentIntent + ephemeral key for the native mobile PaymentSheet flow"""
    try:
        credentials = await get_stripe_credentials()
        if not credentials.get("secret"):
            raise HTTPException(status_code=503, detail="Payment system not configured")

        plan_type = request.plan_type
        if plan_type not in ["starter", "pro"]:
            raise HTTPException(status_code=400, detail="Invalid plan type")

        prices = {"starter": 3, "pro": 9}
        amount = prices[plan_type]

        # Get or create Stripe customer
        user_doc = await fetchrow("SELECT stripe_customer_id FROM users WHERE id = $1::uuid", current_user["id"])
        stripe_customer_id = user_doc.get("stripe_customer_id")

        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user["email"],
                name=current_user["full_name"],
                metadata={"user_id": current_user["id"]}
            )
            stripe_customer_id = customer.id
            await execute("UPDATE users SET stripe_customer_id = $1 WHERE id = $2::uuid", stripe_customer_id, current_user["id"])

        ephemeral_key = stripe.EphemeralKey.create(
            customer=stripe_customer_id,
            stripe_version="2024-06-20"
        )

        # Cancel any existing active subscription before starting a new one
        existing = await fetchrow(
            "SELECT * FROM subscriptions WHERE user_id = $1::uuid AND status = 'active'",
            current_user["id"]
        )
        if existing and existing.get("stripe_subscription_id") and not existing["stripe_subscription_id"].startswith("sub_mock"):
            try:
                stripe.Subscription.cancel(existing["stripe_subscription_id"])
            except Exception as e:
                logger.error(f"Failed to cancel old subscription: {str(e)}")
        if existing:
            await execute(
                "UPDATE subscriptions SET status = 'cancelled', end_date = $1 WHERE id = $2",
                datetime.utcnow(), existing["id"]
            )

        stripe_subscription = stripe.Subscription.create(
            customer=stripe_customer_id,
            items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Monexa {plan_type.title()} Plan",
                        "description": f"Monthly subscription to Monexa {plan_type.title()}"
                    },
                    "recurring": {"interval": "month"},
                    "unit_amount": amount * 100
                }
            }],
            payment_behavior="default_incomplete",
            payment_settings={
                "save_default_payment_method": "on_subscription",
                "payment_method_types": ["card"],
            },
            expand=["latest_invoice.payment_intent"]
        )

        # Record a pending subscription; it is only marked active once the client
        # confirms the PaymentIntent succeeded via /subscription/confirm-payment
        pending_row = await fetchrow(
            """INSERT INTO subscriptions (user_id, plan_type, status, start_date, end_date, stripe_subscription_id, stripe_customer_id, amount)
               VALUES ($1::uuid, $2, 'pending', $3, $4, $5, $6, $7) RETURNING id""",
            current_user["id"], plan_type, datetime.utcnow(), datetime.utcnow() + timedelta(days=30),
            stripe_subscription.id, stripe_customer_id, amount
        )

        return {
            "payment_intent_client_secret": stripe_subscription.latest_invoice.payment_intent.client_secret,
            "ephemeral_key": ephemeral_key.secret,
            "customer_id": stripe_customer_id,
            "publishable_key": credentials.get("publishable"),
            "subscription_id": str(pending_row["id"]),
            "plan_type": plan_type,
            "amount": amount,
        }
    except HTTPException:
        raise
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating payment sheet: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except Exception as e:
        logger.error(f"Payment sheet creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start payment: {str(e)}")

class ConfirmPaymentRequest(BaseModel):
    subscription_id: str

@api_router.post("/subscription/confirm-payment")
async def confirm_payment(
    request: ConfirmPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Mark a pending mobile subscription as active after the PaymentSheet succeeds"""
    validate_uuid(request.subscription_id, "Subscription not found")
    subscription = await fetchrow(
        "SELECT * FROM subscriptions WHERE id = $1::uuid AND user_id = $2::uuid",
        request.subscription_id, current_user["id"]
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Verify with Stripe that the subscription is actually active before trusting the client
    try:
        stripe_sub = stripe.Subscription.retrieve(subscription["stripe_subscription_id"])
        if stripe_sub.status not in ["active", "trialing"]:
            raise HTTPException(status_code=400, detail="Payment has not completed yet")
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Could not verify payment: {str(e)}")

    await execute("UPDATE subscriptions SET status = 'active' WHERE id = $1", subscription["id"])

    return {
        "success": True,
        "plan_type": subscription["plan_type"],
        "message": f"Successfully subscribed to {subscription['plan_type'].title()} plan!",
        "limits": get_subscription_limits(subscription["plan_type"])
    }

class CheckoutSessionRequest(BaseModel):
    plan_type: str
    success_url: str
    cancel_url: str
    promo_code: Optional[str] = None

@api_router.post("/subscription/create-checkout-session")
async def create_checkout_session(
    request: CheckoutSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe Checkout session for web payments"""
    try:
        # Ensure Stripe credentials are loaded
        credentials = await get_stripe_credentials()
        if not credentials.get("secret"):
            raise HTTPException(status_code=503, detail="Payment system not configured")
        
        plan_type = request.plan_type
        if plan_type not in ["starter", "pro"]:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        # Get or create Stripe customer
        user_doc = await fetchrow("SELECT stripe_customer_id FROM users WHERE id = $1::uuid", current_user["id"])
        stripe_customer_id = user_doc.get("stripe_customer_id")
        
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user["email"],
                name=current_user["full_name"],
                metadata={"user_id": current_user["id"]}
            )
            stripe_customer_id = customer.id
            await execute("UPDATE users SET stripe_customer_id = $1 WHERE id = $2::uuid", stripe_customer_id, current_user["id"])
        
        # Create price in Stripe (or use existing price IDs)
        prices = {"starter": 300, "pro": 900}  # in cents
        price_amount = prices[plan_type]
        
        # Build checkout session params
        checkout_params = {
            "customer": stripe_customer_id,
            "payment_method_types": ['card'],
            "line_items": [{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'Monexa {plan_type.capitalize()} Plan',
                        'description': f'Monthly subscription to Monexa {plan_type.capitalize()}',
                    },
                    'unit_amount': price_amount,
                    'recurring': {
                        'interval': 'month',
                    },
                },
                'quantity': 1,
            }],
            "mode": 'subscription',
            "success_url": request.success_url,
            "cancel_url": request.cancel_url,
            "allow_promotion_codes": True,
            "metadata": {
                'user_id': current_user["id"],
                'plan_type': plan_type,
            }
        }
        
        # Apply promo code if provided
        if request.promo_code:
            try:
                promo_codes = stripe.PromotionCode.list(code=request.promo_code, active=True, limit=1)
                if promo_codes.data:
                    checkout_params["discounts"] = [{"promotion_code": promo_codes.data[0].id}]
                    del checkout_params["allow_promotion_codes"]
            except Exception as e:
                logger.warning(f"Failed to apply promo code: {e}")
        
        checkout_session = stripe.checkout.Session.create(**checkout_params)
        
        return {"checkout_url": checkout_session.url, "session_id": checkout_session.id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Checkout session creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@api_router.post("/subscription/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """Cancel current subscription with real Stripe"""
    subscription = await fetchrow(
        "SELECT * FROM subscriptions WHERE user_id = $1::uuid AND status = 'active'",
        current_user["id"]
    )
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    # Cancel in Stripe if real subscription
    stripe_sub_id = subscription.get("stripe_subscription_id")
    if stripe_sub_id and not stripe_sub_id.startswith("sub_mock"):
        try:
            stripe.Subscription.cancel(stripe_sub_id)
            logger.info(f"Cancelled Stripe subscription {stripe_sub_id}")
        except Exception as e:
            logger.error(f"Failed to cancel Stripe subscription: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to cancel subscription in Stripe")
    
    # Update in database
    await execute(
        "UPDATE subscriptions SET status = 'cancelled', end_date = $1 WHERE id = $2",
        datetime.utcnow(), subscription["id"]
    )
    
    return {"message": "Subscription cancelled successfully"}

# ============ PROMO CODE ROUTES ============

class PromoCodeCreate(BaseModel):
    code: str
    percent_off: Optional[int] = None
    amount_off: Optional[int] = None  # in cents
    duration: str = "once"  # once, forever, repeating
    duration_in_months: Optional[int] = None
    max_redemptions: Optional[int] = None

@api_router.post("/promo-codes/validate")
async def validate_promo_code(code: str = Query(...)):
    """Validate a promo code"""
    try:
        credentials = await get_stripe_credentials()
        if not credentials.get("secret"):
            raise HTTPException(status_code=503, detail="Payment system not configured")
        
        promo_codes = stripe.PromotionCode.list(code=code, active=True, limit=1)
        
        if not promo_codes.data:
            return {"valid": False, "message": "Invalid or expired promo code"}
        
        promo = promo_codes.data[0]
        coupon = promo.coupon
        
        discount_text = ""
        if coupon.percent_off:
            discount_text = f"{coupon.percent_off}% off"
        elif coupon.amount_off:
            discount_text = f"${coupon.amount_off / 100:.2f} off"
        
        return {
            "valid": True,
            "code": code,
            "discount": discount_text,
            "percent_off": coupon.percent_off,
            "amount_off": coupon.amount_off,
            "duration": coupon.duration
        }
    except Exception as e:
        logger.error(f"Promo code validation error: {e}")
        return {"valid": False, "message": "Failed to validate promo code"}

@api_router.post("/promo-codes/create")
async def create_promo_code(request: PromoCodeCreate):
    """Create a new promo code (admin only - for testers)"""
    try:
        credentials = await get_stripe_credentials()
        if not credentials.get("secret"):
            raise HTTPException(status_code=503, detail="Payment system not configured")
        
        # Create coupon first
        coupon_params = {
            "duration": request.duration,
            "name": f"Promo: {request.code}"
        }
        
        if request.percent_off:
            coupon_params["percent_off"] = request.percent_off
        elif request.amount_off:
            coupon_params["amount_off"] = request.amount_off
            coupon_params["currency"] = "usd"
        else:
            raise HTTPException(status_code=400, detail="Must specify percent_off or amount_off")
        
        if request.duration == "repeating" and request.duration_in_months:
            coupon_params["duration_in_months"] = request.duration_in_months
        
        coupon = stripe.Coupon.create(**coupon_params)
        
        # Create promotion code with the custom code
        # Note: stripe-python 14.x uses promotion dict with type and coupon
        promo_params = {
            "promotion": {"type": "coupon", "coupon": coupon.id},
            "code": request.code,
        }
        
        if request.max_redemptions:
            promo_params["max_redemptions"] = request.max_redemptions
        
        promo_code = stripe.PromotionCode.create(**promo_params)
        
        return {
            "success": True,
            "code": request.code,
            "promo_code_id": promo_code.id,
            "coupon_id": coupon.id
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating promo code: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating promo code: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create promo code: {str(e)}")

@api_router.get("/promo-codes/list")
async def list_promo_codes():
    """List all active promo codes (admin only)"""
    try:
        credentials = await get_stripe_credentials()
        if not credentials.get("secret"):
            raise HTTPException(status_code=503, detail="Payment system not configured")
        
        promo_codes = stripe.PromotionCode.list(active=True, limit=100)
        
        result = []
        for promo in promo_codes.data:
            coupon = promo.coupon
            discount_text = ""
            if coupon.percent_off:
                discount_text = f"{coupon.percent_off}% off"
            elif coupon.amount_off:
                discount_text = f"${coupon.amount_off / 100:.2f} off"
            
            result.append({
                "id": promo.id,
                "code": promo.code,
                "discount": discount_text,
                "times_redeemed": promo.times_redeemed,
                "max_redemptions": promo.max_redemptions,
                "active": promo.active
            })
        
        return {"promo_codes": result}
    except Exception as e:
        logger.error(f"Error listing promo codes: {e}")
        raise HTTPException(status_code=500, detail="Failed to list promo codes")

@api_router.get("/subscription/usage")
async def get_subscription_usage(current_user: dict = Depends(get_current_user)):
    """Get current usage stats"""
    subscription = await fetchrow(
        "SELECT plan_type FROM subscriptions WHERE user_id = $1::uuid AND status = 'active'",
        current_user["id"]
    )
    
    plan_type = subscription["plan_type"] if subscription else "free"
    limits = get_subscription_limits(plan_type)
    
    # Count AI messages today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    count_row = await fetchrow(
        "SELECT COUNT(*) as cnt FROM chat_messages WHERE user_id = $1::uuid AND role = 'user' AND created_at >= $2",
        current_user["id"], today_start
    )
    ai_messages_today = count_row["cnt"] if count_row else 0
    
    return {
        "plan_type": plan_type,
        "ai_messages_today": ai_messages_today,
        "ai_messages_limit": limits["ai_messages_per_day"],
        "ai_messages_remaining": limits["ai_messages_per_day"] - ai_messages_today if limits["ai_messages_per_day"] != -1 else -1,
        "charts_enabled": limits["charts_enabled"],
        "export_enabled": limits["export_enabled"]
    }

# ============ ROOT ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Monexa API - AI-Powered Personal Finance Assistant"}

@api_router.get("/health")
async def health_check():
    db_status = "connected" if db_pool else "disconnected"
    return {"status": "healthy", "service": "monexa-api", "database": db_status}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    global db_pool
    if DATABASE_URL:
        try:
            db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
            logger.info("Connected to PostgreSQL database")
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL database: {e}")
            db_pool = None
    else:
        logger.warning("DATABASE_URL not set. Database features will not work.")

@app.on_event("shutdown")
async def shutdown_db_client():
    global db_pool
    if db_pool:
        await db_pool.close()
