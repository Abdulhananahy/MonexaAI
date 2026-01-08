from fastapi import FastAPI, APIRouter, HTTPException, status, Depends
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
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    icon: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    name: str
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

# ============ HELPER FUNCTIONS ============

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

@api_router.get("/categories", response_model=List[Category])
async def get_categories(current_user: dict = Depends(get_current_user)):
    categories = await db.categories.find({"user_id": current_user["id"]}).to_list(1000)
    return [serialize_mongo_doc(c) for c in categories]

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
        
        # Check if user is setting tone preference
        message_lower = request.message.lower()
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
        context = f"""You are Monexa, an AI financial buddy with {current_tone['personality']}

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

AVAILABLE CATEGORIES: {', '.join(category_names)}

SPECIAL CAPABILITIES - You can help users take actions:
1. Add transactions: "add $50 expense for food", "log $1000 income from salary"
2. Set budgets: "set budget to $2000", "monthly budget $1500"
3. Create categories: "add category coffee", "new category entertainment"
4. Financial queries: "how much did I spend?", "show my income"

DETECTION RULES - When user wants to:
- ADD EXPENSE: "add", "spent", "bought", "paid" + amount + category
- ADD INCOME: "earned", "received", "got paid", "income" + amount + source
- SET BUDGET: "budget", "limit" + amount
- CREATE CATEGORY: "add category", "new category" + name
- QUERY DATA: "how much", "show me", "what did I", "spending"

RESPONSE FORMAT:
1. Detect if action is requested
2. If action: Confirm what you'll do (I'll add/set/create...) + provide transaction details
3. Keep under 3 sentences
4. Use {current_tone['style']}

If user asks to add/modify data, format response like:
"✅ [Action confirmed]. [Brief insight]. [Optional question]"

Example: "✅ Added $50 expense for Food. That brings your food spending to $150 this month. Want to set a food budget?"

Now respond to their message with your {tone} tone!"""

        # Initialize AI chat
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"monexa_{current_user['id']}_{tone}",
            system_message=context
        ).with_model("openai", "gpt-5.2")
        
        # Send message to AI
        user_msg = UserMessage(text=request.message)
        ai_response = await chat.send_message(user_msg)
        
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
    await db.chat_messages.delete_many({"user_id": current_user["id"]})
    return {"message": "Chat history cleared"}

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

        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"insights_{current_user['id']}",
            system_message="You are a helpful financial assistant. Provide brief, supportive insights."
        ).with_model("openai", "gpt-5.2")
        
        insights_text = await chat.send_message(UserMessage(text=prompt))
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
    if preferences.currency:
        update_data["currency"] = preferences.currency
    if preferences.monthly_budget is not None:
        update_data["monthly_budget"] = preferences.monthly_budget
    
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": update_data}
        )
    
    return {"message": "Preferences updated successfully"}

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
    client.close()
