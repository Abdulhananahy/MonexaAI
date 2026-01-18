from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId
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

# MongoDB connection
import certifi
import ssl
mongo_url = os.environ.get('MONGO_URL', '')
db_name = os.environ.get('DB_NAME', 'monexa')
if mongo_url:
    if '?' in mongo_url:
        mongo_url_with_tls = mongo_url + '&tls=true&tlsAllowInvalidCertificates=true'
    else:
        mongo_url_with_tls = mongo_url + '?tls=true&tlsAllowInvalidCertificates=true'
    client = AsyncIOMotorClient(mongo_url_with_tls)
    db = client[db_name]
else:
    client = None
    db = None
    print("WARNING: MONGO_URL not set. Database features will not work.")

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

class UserPreferences(BaseModel):
    currency: Optional[str] = None
    monthly_budget: Optional[float] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

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
    transactions = await db.transactions.find({"user_id": user_id}).to_list(10000)
    
    for transaction in transactions:
        new_amount = transaction['amount'] * rate
        await db.transactions.update_one(
            {"_id": transaction["_id"]},
            {"$set": {"amount": new_amount}}
        )
    
    # Update budget if exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user and user.get('monthly_budget'):
        new_budget = user['monthly_budget'] * rate
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"monthly_budget": new_budget}}
        )

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
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    subscription = await db.subscriptions.find_one({"user_id": user_id, "status": "active"})
    
    plan_type = subscription.get("plan_type", "free") if subscription else "free"
    limits = get_subscription_limits(plan_type)
    
    if limits["ai_messages_per_day"] == -1:
        return True  # Unlimited
    
    # Count messages today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    message_count = await db.chat_messages.count_documents({
        "user_id": user_id,
        "role": "user",
        "created_at": {"$gte": today_start}
    })
    
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
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        user["id"] = str(user["_id"])
        del user["_id"]
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def serialize_mongo_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

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
        category = {
            "user_id": user_id,
            "name": cat["name"],
            "icon": cat["icon"],
            "created_at": datetime.utcnow()
        }
        await db.categories.insert_one(category)

# ============ AUTH ROUTES ============

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = {
        "full_name": user_data.full_name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "currency": "USD",
        "monthly_budget": None,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
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
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
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
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # In a real app, send email with reset token
    # For MVP, just return success
    return {"message": "If the email exists, a password reset link has been sent"}

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
    transactions = await db.transactions.find({"user_id": current_user["id"]}).sort("date", -1).to_list(1000)
    return [serialize_mongo_doc(t) for t in transactions]

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate, current_user: dict = Depends(get_current_user)):
    transaction_dict = transaction.dict()
    transaction_dict["user_id"] = current_user["id"]
    transaction_dict["created_at"] = datetime.utcnow()
    
    result = await db.transactions.insert_one(transaction_dict)
    transaction_dict["id"] = str(result.inserted_id)
    if "_id" in transaction_dict:
        del transaction_dict["_id"]
    
    return transaction_dict

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, transaction: TransactionCreate, current_user: dict = Depends(get_current_user)):
    # Check ownership
    existing = await db.transactions.find_one({"_id": ObjectId(transaction_id), "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = transaction.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    await db.transactions.update_one(
        {"_id": ObjectId(transaction_id)},
        {"$set": update_data}
    )
    
    updated = await db.transactions.find_one({"_id": ObjectId(transaction_id)})
    return serialize_mongo_doc(updated)

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.transactions.delete_one({"_id": ObjectId(transaction_id), "user_id": current_user["id"]})
    if result.deleted_count == 0:
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
    categories = await db.categories.find({"user_id": current_user["id"]}).to_list(1000)
    
    # Check if user has any income categories
    has_income_categories = any(c.get("type") == "income" for c in categories)
    
    # Auto-create default income categories if none exist
    if not has_income_categories:
        for default_cat in DEFAULT_INCOME_CATEGORIES:
            existing = await db.categories.find_one({
                "user_id": current_user["id"],
                "name": default_cat["name"]
            })
            if not existing:
                cat_doc = {
                    **default_cat,
                    "user_id": current_user["id"],
                    "created_at": datetime.utcnow()
                }
                await db.categories.insert_one(cat_doc)
        
        # Re-fetch categories after creating defaults
        categories = await db.categories.find({"user_id": current_user["id"]}).to_list(1000)
    
    result = []
    for c in categories:
        doc = serialize_mongo_doc(c)
        if 'type' not in doc or not doc['type']:
            doc['type'] = 'expense'
        result.append(doc)
    return result

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    # Check if category name already exists for user
    existing = await db.categories.find_one({"user_id": current_user["id"], "name": category.name})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    category_dict = category.dict()
    category_dict["user_id"] = current_user["id"]
    category_dict["created_at"] = datetime.utcnow()
    
    result = await db.categories.insert_one(category_dict)
    category_dict["id"] = str(result.inserted_id)
    if "_id" in category_dict:
        del category_dict["_id"]
    
    return category_dict

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.categories.find_one({"_id": ObjectId(category_id), "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.categories.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": category.dict()}
    )
    
    updated = await db.categories.find_one({"_id": ObjectId(category_id)})
    return serialize_mongo_doc(updated)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.categories.delete_one({"_id": ObjectId(category_id), "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# ============ AI CHAT ROUTES ============

@api_router.post("/chat")
async def chat_with_ai(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Check AI message limit
        can_send = await check_ai_message_limit(current_user["id"])
        if not can_send:
            subscription = await db.subscriptions.find_one({
                "user_id": current_user["id"],
                "status": "active"
            })
            plan_type = subscription.get("plan_type", "free") if subscription else "free"
            limits = get_subscription_limits(plan_type)
            
            raise HTTPException(
                status_code=429,
                detail=f"Daily AI message limit reached ({limits['ai_messages_per_day']} messages). Upgrade to get more!"
            )
        
        # Get chat history to check if this is first message
        existing_messages = await db.chat_messages.find({"user_id": current_user["id"]}).to_list(1000)
        is_first_message = len(existing_messages) == 0
        
        # Save user message
        user_message_doc = {
            "user_id": current_user["id"],
            "role": "user",
            "text": request.message,
            "created_at": datetime.utcnow()
        }
        await db.chat_messages.insert_one(user_message_doc)
        
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
                transaction = {
                    "user_id": current_user["id"],
                    "type": "expense",
                    "amount": amount,
                    "category_name": category,
                    "date": datetime.utcnow().strftime("%Y-%m-%d"),
                    "created_at": datetime.utcnow()
                }
                await db.transactions.insert_one(transaction)
                action_performed = True
                action_response = f"✅ Added ${amount} expense for {category}."
        
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
                transaction = {
                    "user_id": current_user["id"],
                    "type": "income",
                    "amount": amount,
                    "category_name": "Income",
                    "income_source": source,
                    "date": datetime.utcnow().strftime("%Y-%m-%d"),
                    "created_at": datetime.utcnow()
                }
                await db.transactions.insert_one(transaction)
                action_performed = True
                action_response = f"✅ Added ${amount} income from {source}."
        
        # SET BUDGET
        elif any(word in message_lower for word in ['budget', 'limit']):
            import re
            amount_match = re.search(r'\$?(\d+(?:\.\d{2})?)', request.message)
            
            if amount_match:
                budget = float(amount_match.group(1))
                await db.users.update_one(
                    {"_id": ObjectId(current_user["id"])},
                    {"$set": {"monthly_budget": budget}}
                )
                action_performed = True
                action_response = f"✅ Monthly budget set to ${budget}."
        
        # CREATE CATEGORY
        elif 'add category' in message_lower or 'new category' in message_lower or 'create category' in message_lower:
            import re
            category_match = re.search(r'category\s+(\w+)', request.message, re.IGNORECASE)
            
            if category_match:
                category_name = category_match.group(1).capitalize()
                
                # Check if exists
                existing = await db.categories.find_one({"user_id": current_user["id"], "name": category_name})
                if not existing:
                    category = {
                        "user_id": current_user["id"],
                        "name": category_name,
                        "created_at": datetime.utcnow()
                    }
                    await db.categories.insert_one(category)
                    action_performed = True
                    action_response = f"✅ Created category '{category_name}'."
                else:
                    action_response = f"Category '{category_name}' already exists."
        
        # If action was performed, send simpler context to AI
        if action_performed:
            # Still get updated data
            transactions = await db.transactions.find({"user_id": current_user["id"]}).to_list(1000)
            total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
            total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
            
            simple_context = f"""You are Monexa. An action was just completed: {action_response}
            
Updated stats: Income ${total_income:.2f}, Expenses ${total_expense:.2f}

Respond with ONE supportive sentence about this action."""
            
            ai_response = await send_ai_message(simple_context, action_response)
            
            # Only append AI response if it's not an error message
            if ai_response and "trouble processing" not in ai_response:
                full_response = f"{action_response} {ai_response}"
            else:
                full_response = action_response
            
            ai_message_doc = {
                "user_id": current_user["id"],
                "role": "assistant",
                "text": full_response,
                "created_at": datetime.utcnow()
            }
            await db.chat_messages.insert_one(ai_message_doc)
            return {"message": full_response}
        
        # Check if user is setting tone preference
        if any(word in message_lower for word in ['strict', 'funny', 'friendly']):
            if 'strict' in message_lower:
                tone = 'strict'
                await db.users.update_one(
                    {"_id": ObjectId(current_user["id"])},
                    {"$set": {"chat_tone": "strict"}}
                )
            elif 'funny' in message_lower:
                tone = 'funny'
                await db.users.update_one(
                    {"_id": ObjectId(current_user["id"])},
                    {"$set": {"chat_tone": "funny"}}
                )
            else:
                tone = 'friendly'
                await db.users.update_one(
                    {"_id": ObjectId(current_user["id"])},
                    {"$set": {"chat_tone": "friendly"}}
                )
        else:
            tone = current_user.get('chat_tone', 'friendly')
        
        # Get user context: transactions and categories
        transactions = await db.transactions.find({"user_id": current_user["id"]}).to_list(1000)
        categories = await db.categories.find({"user_id": current_user["id"]}).to_list(100)
        
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
            f"- {t['type'].title()}: ${t['amount']:.2f} for {t['category_name']}{' ('+t.get('income_source', '')+')' if t.get('income_source') else ''} on {t['date'][:10]}" 
            for t in recent_transactions
        ]) if recent_transactions else "No recent transactions"
        
        # Top spending categories
        top_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)[:3]
        top_spending_text = "\n".join([
            f"- {cat}: ${amt:.2f}" for cat, amt in top_categories
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
Balance: ${balance:.2f} | Income: ${total_income:.2f} | Expenses: ${total_expense:.2f}

**Choose Your Chat Style:**
How should I talk to you?

• Type **"Strict"** - Direct and disciplined coaching
• Type **"Funny"** - Humorous and entertaining advice  
• Type **"Friendly"** - Warm and supportive guidance (current)

**Try these commands:**
- "Add $50 expense for food"
- "Set monthly budget to $2000"  
- "Show my spending this month"
- "How am I doing?"

What would you like to explore first?"""
            
            ai_message_doc = {
                "user_id": current_user["id"],
                "role": "assistant",
                "text": intro_response,
                "created_at": datetime.utcnow()
            }
            await db.chat_messages.insert_one(ai_message_doc)
            return {"message": intro_response}
        
        # Build context based on tone
        context = f"""You are Monexa, an AI financial buddy and virtual assistant with {current_tone['personality']}

TONE: {tone.upper()}
{current_tone['style']}
Emoji usage: {current_tone['emoji']}

FINANCIAL DATA FOR {current_user['full_name'].split()[0]}:
💰 Balance: ${balance:.2f}
📈 Income: ${total_income:.2f}
📉 Expenses: ${total_expense:.2f}
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
5. Smart recommendations: If someone asks "find restaurants under $20" or "where to eat cheap", give helpful suggestions

TRANSACTION HANDLING:
- If user mentions adding money but type is unclear, ask: "Is this income or an expense?"
- Common expense categories: food, groceries, transport, rent, bills, shopping, entertainment, health, education
- Common income sources: salary, freelance, bonus, investment, gift, refund

RESPONSE FORMAT:
- Keep responses concise (2-4 sentences)
- Use {current_tone['style']}
- Be helpful and proactive
- If asked about restaurants/shops/deals, give real helpful suggestions
- If unsure about transaction type, ask clarifying questions

Now respond to their message with your {tone} tone!"""

        # Send message to OpenAI
        ai_response = await send_ai_message(context, request.message)
        
        # Save AI response
        ai_message_doc = {
            "user_id": current_user["id"],
            "role": "assistant",
            "text": ai_response,
            "created_at": datetime.utcnow()
        }
        await db.chat_messages.insert_one(ai_message_doc)
        
        return {"message": ai_response}
        
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process chat request")

@api_router.get("/chat/history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    messages = await db.chat_messages.find({"user_id": current_user["id"]}).sort("created_at", 1).to_list(1000)
    return [serialize_mongo_doc(m) for m in messages]

@api_router.delete("/chat/history")
async def clear_chat_history(current_user: dict = Depends(get_current_user)):
    """Delete all chat messages for user"""
    result = await db.chat_messages.delete_many({"user_id": current_user["id"]})
    return {"message": "Chat history cleared", "deleted_count": result.deleted_count}

@api_router.post("/chat/archive")
async def archive_chat_session(current_user: dict = Depends(get_current_user)):
    """Archive current chat and start fresh"""
    # Get all current messages
    messages = await db.chat_messages.find({"user_id": current_user["id"]}).to_list(10000)
    
    if len(messages) > 0:
        # Create archive record
        archive = {
            "user_id": current_user["id"],
            "messages": messages,
            "archived_at": datetime.utcnow(),
            "message_count": len(messages)
        }
        await db.chat_archives.insert_one(archive)
        
        # Clear current messages
        await db.chat_messages.delete_many({"user_id": current_user["id"]})
        
        return {
            "message": "Chat archived successfully",
            "archived_messages": len(messages),
            "archive_id": str(archive["_id"])
        }
    
    return {"message": "No messages to archive"}

@api_router.get("/chat/archives")
async def get_chat_archives(current_user: dict = Depends(get_current_user)):
    """Get list of archived chat sessions"""
    archives = await db.chat_archives.find({"user_id": current_user["id"]}).sort("archived_at", -1).to_list(100)
    
    result = []
    for archive in archives:
        # Get first user message as preview
        first_message = next((m for m in archive["messages"] if m["role"] == "user"), None)
        preview = first_message["text"][:50] + "..." if first_message else "Empty chat"
        
        result.append({
            "id": str(archive["_id"]),
            "archived_at": archive["archived_at"].isoformat(),
            "message_count": archive["message_count"],
            "preview": preview
        })
    
    return {"archives": result}

@api_router.get("/chat/archives/{archive_id}")
async def get_archived_chat(archive_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific archived chat"""
    archive = await db.chat_archives.find_one({
        "_id": ObjectId(archive_id),
        "user_id": current_user["id"]
    })
    
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found")
    
    messages = [serialize_mongo_doc(m) for m in archive["messages"]]
    
    return {
        "archive_id": str(archive["_id"]),
        "archived_at": archive["archived_at"].isoformat(),
        "messages": messages
    }

@api_router.delete("/chat/archives/{archive_id}")
async def delete_archived_chat(archive_id: str, current_user: dict = Depends(get_current_user)):
    """Delete archived chat"""
    result = await db.chat_archives.delete_one({
        "_id": ObjectId(archive_id),
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Archive not found")
    
    return {"message": "Archive deleted successfully"}

# ============ ANALYTICS ROUTES ============

@api_router.get("/analytics/summary")
async def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": current_user["id"]}).to_list(1000)
    
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
    
    return {
        "balance": balance,
        "total_income": total_income,
        "total_expense": total_expense,
        "top_spending_categories": [{"name": cat, "amount": amt} for cat, amt in top_categories],
        "transaction_count": len(transactions)
    }

@api_router.get("/analytics/insights")
async def get_ai_insights(current_user: dict = Depends(get_current_user)):
    """Generate AI-powered insights about user's finances"""
    try:
        transactions = await db.transactions.find({"user_id": current_user["id"]}).to_list(1000)
        
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
        "monthly_budget": current_user.get("monthly_budget")
    }

@api_router.put("/profile/preferences")
async def update_preferences(preferences: UserPreferences, current_user: dict = Depends(get_current_user)):
    update_data = {}
    
    # Handle currency change with conversion
    if preferences.currency:
        old_currency = current_user.get('currency', 'USD')
        new_currency = preferences.currency
        
        if old_currency != new_currency:
            # Convert all transactions
            await convert_user_transactions(current_user["id"], old_currency, new_currency)
            update_data["currency"] = new_currency
            logger.info(f"Converted transactions from {old_currency} to {new_currency} for user {current_user['id']}")
    
    if preferences.monthly_budget is not None:
        update_data["monthly_budget"] = preferences.monthly_budget
    
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": update_data}
        )
    
    return {"message": "Preferences updated successfully", "converted": bool(preferences.currency)}

# ============ SUBSCRIPTION ROUTES ============

@api_router.get("/subscription/current")
async def get_current_subscription(current_user: dict = Depends(get_current_user)):
    """Get user's current subscription plan"""
    subscription = await db.subscriptions.find_one({
        "user_id": current_user["id"],
        "status": "active"
    })
    
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
        existing = await db.subscriptions.find_one({
            "user_id": current_user["id"],
            "status": "active"
        })
        
        if existing:
            # Cancel old Stripe subscription if exists
            if existing.get("stripe_subscription_id") and not existing["stripe_subscription_id"].startswith("sub_mock"):
                try:
                    stripe.Subscription.cancel(existing["stripe_subscription_id"])
                except Exception as e:
                    logger.error(f"Failed to cancel old subscription: {str(e)}")
            
            # Update old subscription in DB
            await db.subscriptions.update_one(
                {"_id": existing["_id"]},
                {"$set": {"status": "cancelled", "end_date": datetime.utcnow()}}
            )
        
        # Create Stripe customer if doesn't exist
        user_email = current_user["email"]
        user_name = current_user["full_name"]
        
        # Check if customer exists in our DB
        user_doc = await db.users.find_one({"_id": ObjectId(current_user["id"])})
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
            await db.users.update_one(
                {"_id": ObjectId(current_user["id"])},
                {"$set": {"stripe_customer_id": stripe_customer_id}}
            )
        
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
            subscription = {
                "user_id": current_user["id"],
                "plan_type": plan_type,
                "status": "active",
                "start_date": datetime.utcnow(),
                "end_date": datetime.utcnow() + timedelta(days=30),
                "stripe_subscription_id": stripe_subscription.id,
                "stripe_customer_id": stripe_customer_id,
                "amount": amount,
                "created_at": datetime.utcnow()
            }
            
            result = await db.subscriptions.insert_one(subscription)
            
            logger.info(f"Created real Stripe subscription {stripe_subscription.id} for user {current_user['id']}")
            
            return {
                "success": True,
                "subscription_id": str(result.inserted_id),
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
        user_doc = await db.users.find_one({"_id": ObjectId(current_user["id"])})
        stripe_customer_id = user_doc.get("stripe_customer_id")
        
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user["email"],
                name=current_user["full_name"],
                metadata={"user_id": current_user["id"]}
            )
            stripe_customer_id = customer.id
            await db.users.update_one(
                {"_id": ObjectId(current_user["id"])},
                {"$set": {"stripe_customer_id": stripe_customer_id}}
            )
        
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
    subscription = await db.subscriptions.find_one({
        "user_id": current_user["id"],
        "status": "active"
    })
    
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
    await db.subscriptions.update_one(
        {"_id": subscription["_id"]},
        {"$set": {"status": "cancelled", "end_date": datetime.utcnow()}}
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
    subscription = await db.subscriptions.find_one({
        "user_id": current_user["id"],
        "status": "active"
    })
    
    plan_type = subscription.get("plan_type", "free") if subscription else "free"
    limits = get_subscription_limits(plan_type)
    
    # Count AI messages today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    ai_messages_today = await db.chat_messages.count_documents({
        "user_id": current_user["id"],
        "role": "user",
        "created_at": {"$gte": today_start}
    })
    
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
    return {"status": "healthy", "service": "monexa-api"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()
