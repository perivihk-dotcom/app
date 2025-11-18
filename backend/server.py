from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Get Emergent LLM key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# ====================
# Models
# ====================

class UserSignup(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class WorkoutPlan(BaseModel):
    userId: str
    name: str
    description: str
    duration: int
    exercises: List[dict]
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Exercise(BaseModel):
    name: str
    category: str
    sets: int
    reps: str
    description: Optional[str] = None

class Meal(BaseModel):
    userId: str
    name: str
    calories: float
    protein: float
    carbs: float
    fats: float
    date: str
    time: str = Field(default_factory=lambda: datetime.now().strftime("%H:%M"))

class WeightEntry(BaseModel):
    userId: str
    weight: float
    date: str

class ChatMessage(BaseModel):
    userId: str
    message: str

class AIWorkoutRequest(BaseModel):
    userId: str
    prompt: str

# ====================
# Auth Routes
# ====================

@api_router.post("/auth/signup")
async def signup(user: UserSignup):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = pwd_context.hash(user.password)
    
    # Create user
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "createdAt": datetime.utcnow()
    }
    
    await db.users.insert_one(user_data)
    
    return {
        "success": True,
        "user": {
            "id": user_id,
            "name": user.name,
            "email": user.email
        }
    }

@api_router.post("/auth/login")
async def login(user: UserLogin):
    # Find user
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "success": True,
        "user": {
            "id": db_user["id"],
            "name": db_user["name"],
            "email": db_user["email"]
        }
    }

# ====================
# User Stats Routes
# ====================

@api_router.get("/users/{user_id}/stats")
async def get_user_stats(user_id: str):
    # Calculate stats
    today = datetime.now()
    week_ago = today - timedelta(days=7)
    
    # Count workouts this week
    workouts = await db.workout_logs.count_documents({
        "userId": user_id,
        "date": {"$gte": week_ago.strftime("%Y-%m-%d")}
    })
    
    # Get total calories burned (mock calculation)
    calories_burned = workouts * 350  # Assume 350 cal per workout
    
    # Active minutes
    active_minutes = workouts * 45  # Assume 45 min per workout
    
    # Current streak
    streak = await calculate_streak(user_id)
    
    return {
        "success": True,
        "stats": {
            "workoutsThisWeek": workouts,
            "caloriesBurned": calories_burned,
            "activeMinutes": active_minutes,
            "currentStreak": streak
        }
    }

async def calculate_streak(user_id: str):
    # Simple streak calculation
    logs = await db.workout_logs.find({"userId": user_id}).sort("date", -1).to_list(100)
    if not logs:
        return 0
    
    streak = 0
    current_date = datetime.now().date()
    
    for log in logs:
        log_date = datetime.strptime(log["date"], "%Y-%m-%d").date()
        if log_date == current_date or log_date == current_date - timedelta(days=1):
            streak += 1
            current_date = log_date - timedelta(days=1)
        else:
            break
    
    return streak

# ====================
# Workout Routes
# ====================

@api_router.get("/workouts")
async def get_workouts(userId: str):
    # Get workout plans
    workout_plans = await db.workout_plans.find({"userId": userId}).to_list(100)
    
    # Get exercise library
    exercises = [
        {"id": "1", "name": "Push-ups", "category": "Strength", "sets": 3, "reps": "12-15"},
        {"id": "2", "name": "Squats", "category": "Strength", "sets": 4, "reps": "10-12"},
        {"id": "3", "name": "Plank", "category": "Strength", "sets": 3, "reps": "30-60s"},
        {"id": "4", "name": "Running", "category": "Cardio", "sets": 1, "reps": "30 min"},
        {"id": "5", "name": "Burpees", "category": "HIIT", "sets": 4, "reps": "15"},
        {"id": "6", "name": "Lunges", "category": "Strength", "sets": 3, "reps": "12 each leg"},
        {"id": "7", "name": "Mountain Climbers", "category": "HIIT", "sets": 3, "reps": "20"},
        {"id": "8", "name": "Yoga Flow", "category": "Flexibility", "sets": 1, "reps": "20 min"},
    ]
    
    return {
        "success": True,
        "workoutPlans": workout_plans,
        "exercises": exercises
    }

# ====================
# AI Workout Generation
# ====================

@api_router.post("/ai/generate-workout")
async def generate_ai_workout(request: AIWorkoutRequest):
    try:
        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"workout_{request.userId}_{datetime.now().timestamp()}",
            system_message="""You are an expert fitness coach. Create personalized workout plans based on user requirements. 
            Return ONLY a JSON object with this exact structure:
            {
                "name": "Workout Plan Name",
                "description": "Brief description",
                "duration": 45,
                "exercises": [
                    {"name": "Exercise name", "sets": 3, "reps": "12-15", "rest": "60s"}
                ]
            }"""
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(
            text=f"Create a workout plan based on: {request.prompt}. Return ONLY valid JSON, no markdown or extra text."
        )
        
        response = await chat.send_message(user_message)
        
        # Parse AI response
        import json
        # Clean response - remove markdown code blocks if present
        clean_response = response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
            clean_response = clean_response.strip()
        
        workout_data = json.loads(clean_response)
        
        # Save to database
        workout_plan = {
            "id": str(uuid.uuid4()),
            "userId": request.userId,
            "name": workout_data.get("name", "AI Generated Workout"),
            "description": workout_data.get("description", "Custom workout plan"),
            "duration": workout_data.get("duration", 45),
            "exercises": workout_data.get("exercises", []),
            "createdAt": datetime.utcnow()
        }
        
        await db.workout_plans.insert_one(workout_plan)
        
        # Log the workout completion
        await db.workout_logs.insert_one({
            "userId": request.userId,
            "workoutId": workout_plan["id"],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "completed": False
        })
        
        return {
            "success": True,
            "workout": workout_plan
        }
        
    except Exception as e:
        logging.error(f"Error generating workout: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate workout: {str(e)}")

# ====================
# Nutrition Routes
# ====================

@api_router.get("/nutrition")
async def get_nutrition(userId: str, date: str):
    # Get meals for the date
    meals = await db.meals.find({"userId": userId, "date": date}).to_list(100)
    
    # Calculate consumed totals
    consumed = {
        "calories": sum(meal.get("calories", 0) for meal in meals),
        "protein": sum(meal.get("protein", 0) for meal in meals),
        "carbs": sum(meal.get("carbs", 0) for meal in meals),
        "fats": sum(meal.get("fats", 0) for meal in meals),
    }
    
    return {
        "success": True,
        "meals": meals,
        "consumed": consumed
    }

@api_router.post("/nutrition/add-meal")
async def add_meal(meal: Meal):
    meal_data = {
        "id": str(uuid.uuid4()),
        **meal.dict(),
        "createdAt": datetime.utcnow()
    }
    
    await db.meals.insert_one(meal_data)
    
    return {
        "success": True,
        "meal": meal_data
    }

# ====================
# Progress Routes
# ====================

@api_router.get("/progress")
async def get_progress(userId: str):
    # Get weight data
    weight_data = await db.weight_entries.find({"userId": userId}).sort("date", 1).to_list(100)
    
    # Get measurements
    measurements = await db.measurements.find_one({"userId": userId})
    
    # Calculate overall stats
    total_workouts = await db.workout_logs.count_documents({"userId": userId})
    total_calories = total_workouts * 350  # Mock calculation
    avg_duration = 45  # Mock
    streak = await calculate_streak(userId)
    
    return {
        "success": True,
        "weightData": weight_data,
        "measurements": measurements,
        "stats": {
            "totalWorkouts": total_workouts,
            "totalCaloriesBurned": total_calories,
            "avgWorkoutDuration": avg_duration,
            "currentStreak": streak
        }
    }

@api_router.post("/progress/add-weight")
async def add_weight(entry: WeightEntry):
    weight_data = {
        "id": str(uuid.uuid4()),
        **entry.dict(),
        "createdAt": datetime.utcnow()
    }
    
    await db.weight_entries.insert_one(weight_data)
    
    return {
        "success": True,
        "entry": weight_data
    }

# ====================
# AI Chat Routes
# ====================

@api_router.get("/ai/chat-history")
async def get_chat_history(userId: str):
    messages = await db.chat_messages.find({"userId": userId}).sort("timestamp", 1).limit(50).to_list(50)
    return {
        "success": True,
        "messages": messages
    }

@api_router.post("/ai/chat")
async def ai_chat(chat_msg: ChatMessage):
    try:
        # Save user message
        user_msg_data = {
            "id": str(uuid.uuid4()),
            "userId": chat_msg.userId,
            "text": chat_msg.message,
            "isUser": True,
            "timestamp": datetime.utcnow()
        }
        await db.chat_messages.insert_one(user_msg_data)
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"chat_{chat_msg.userId}",
            system_message="""You are an expert AI fitness coach. Provide helpful, motivating, and accurate fitness and nutrition advice. 
            Be friendly, supportive, and encouraging. Keep responses concise but informative."""
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=chat_msg.message)
        response = await chat.send_message(user_message)
        
        # Save AI response
        ai_msg_data = {
            "id": str(uuid.uuid4()),
            "userId": chat_msg.userId,
            "text": response,
            "isUser": False,
            "timestamp": datetime.utcnow()
        }
        await db.chat_messages.insert_one(ai_msg_data)
        
        return {
            "success": True,
            "response": response
        }
        
    except Exception as e:
        logging.error(f"Error in AI chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get AI response: {str(e)}")

# ====================
# Health Check
# ====================

@api_router.get("/")
async def root():
    return {"message": "FitGenius API is running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "FitGenius API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
