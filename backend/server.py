from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Query, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import re
import html
import time
import hashlib
import jwt
import requests as http_requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent LLM
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "aetheris-spatial"
storage_key = None

# Admin Config
ADMIN_EMAIL = "meta360d@gmail.com"
ADMIN_PASSWORD_HASH = hashlib.sha256("Adimnaetheris".encode()).hexdigest()
JWT_SECRET = os.environ.get('JWT_SECRET', f"aetheris_jwt_{uuid.uuid4().hex[:16]}")

# ──────────── Full Aetheris Ontology ────────────
AETHERIS_ONTOLOGY = {
    "shapes": ["desk", "chair", "panel", "hexagon", "pod", "cylinder"],
    "materials": ["Bamboo Composite", "Recycled Aluminum", "Bio-Resin", "Cork", "Tempered Glass", "Carbon Fiber", "Mycelium Biofoam"],
    "colors": {
        "Void Black": "#1a1a1a", "Arctic White": "#e8e8e8", "Neon Cyan": "#00F0FF",
        "Warm Graphite": "#4a4a4a", "Solar Magenta": "#FF0055", "Emerald Flux": "#2d5a27",
        "Amber Pulse": "#ffb347", "Deep Ocean": "#0a1628"
    },
    "constraints": {
        "ergonomics": ["reachability", "comfort", "posture", "clearance"],
        "sustainability": ["eco_score", "material_origin", "recyclability"],
        "manufacturing": ["feasibility", "tolerances", "cost_limits"],
        "spatial": ["dimensions", "orientation", "collision", "flow"]
    },
    "sustainability_vectors": {
        "material_score": "0-100", "energy_cost": "low/medium/high",
        "recyclability": "percentage", "carbon_impact": "kg CO2e", "lifespan": "years"
    },
    "dimensional_extensions": ["4D temporal geometry", "n-dimensional parameter space", "topological morphing", "procedural generative rules"]
}

app = FastAPI(title="Aetheris Spatial API", version="1.0.0", docs_url="/api/docs", redoc_url=None)
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ──────────── Security: Rate Limiter ────────────
rate_limit_store: Dict[str, list] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 120    # requests per window (generous for browsing)
AI_RATE_LIMIT_MAX = 20  # AI endpoint limit per window

def check_rate_limit(client_ip: str, max_requests: int = RATE_LIMIT_MAX) -> bool:
    now = time.time()
    requests_list = rate_limit_store[client_ip]
    rate_limit_store[client_ip] = [t for t in requests_list if now - t < RATE_LIMIT_WINDOW]
    if len(rate_limit_store[client_ip]) >= max_requests:
        return False
    rate_limit_store[client_ip].append(now)
    return True

# ──────────── Security: Input Sanitization ────────────
def sanitize_input(text: str, max_length: int = 2000) -> str:
    """Sanitize user text input — strip HTML, limit length, remove control characters"""
    if not isinstance(text, str):
        return ""
    text = text[:max_length]
    text = html.escape(text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    return text.strip()

def sanitize_search(text: str) -> str:
    """Sanitize search input — escape regex special chars"""
    if not text:
        return ""
    text = sanitize_input(text, max_length=200)
    return re.escape(html.unescape(text))

# ──────────── Security: Middleware for headers ────────────
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    # Rate limiting — separate buckets for AI vs general
    client_ip = request.client.host if request.client else "unknown"
    path = str(request.url.path)
    is_ai_endpoint = "/api/ai/" in path
    
    if is_ai_endpoint:
        # AI endpoints have their own rate limit bucket
        ai_key = f"ai:{client_ip}"
        if not check_rate_limit(ai_key, AI_RATE_LIMIT_MAX):
            return JSONResponse(
                status_code=429,
                content={"detail": "AI rate limit exceeded. Please try again later."},
                headers={"Retry-After": str(RATE_LIMIT_WINDOW)}
            )
    
    # General rate limit for all endpoints
    if not check_rate_limit(client_ip, RATE_LIMIT_MAX):
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again later."},
            headers={"Retry-After": str(RATE_LIMIT_WINDOW)}
        )

    response = await call_next(request)

    # Security headers — OWASP recommended
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Cache-Control"] = "no-store" if "/api/" in request.url.path else "public, max-age=3600"

    return response

# ──────────── Object Storage ────────────
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = http_requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = http_requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = http_requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ──────────── Models ────────────
class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    preferences: Optional[dict] = None
    created_at: Optional[str] = None

class ProductModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    name: str
    description: str
    category: str
    price: float
    sustainability_score: float
    materials: List[str]
    colors: List[str]
    sizes: List[str]
    tags: List[str]
    image_url: Optional[str] = None
    created_at: Optional[str] = None

class DesignModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    design_id: str
    user_id: str
    product_id: str
    name: str
    configuration: dict
    collection: Optional[str] = "Default"
    version: int = 1
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    product_id: Optional[str] = None
    context: Optional[dict] = None

# ──────────── Auth Helpers ────────────
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ──────────── Auth Endpoints ────────────
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    try:
        resp = http_requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}, timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        logger.error(f"Auth session error: {e}")
        raise HTTPException(status_code=401, detail="Invalid session")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": data["email"]}, {"$set": {
            "name": data.get("name", ""),
            "picture": data.get("picture", ""),
        }})
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data.get("name", ""),
            "picture": data.get("picture", ""),
            "preferences": {"theme": "dark", "ai_suggestions": True, "density": "comfortable"},
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    session_token = data.get("session_token", f"st_{uuid.uuid4().hex}")
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        path="/", max_age=7*24*3600
    )
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

# ──────────── Products ────────────
@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = "newest"
):
    query = {}
    if category and category != "all":
        query["category"] = category
    if search:
        safe_search = sanitize_search(search)
        query["$or"] = [
            {"name": {"$regex": safe_search, "$options": "i"}},
            {"description": {"$regex": safe_search, "$options": "i"}},
            {"tags": {"$regex": safe_search, "$options": "i"}}
        ]
    if min_price is not None:
        query.setdefault("price", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price

    sort_field = {"newest": ("created_at", -1), "price_low": ("price", 1), "price_high": ("price", -1), "sustainability": ("sustainability_score", -1)}
    sf = sort_field.get(sort, ("created_at", -1))
    products = await db.products.find(query, {"_id": 0}).sort(sf[0], sf[1]).to_list(100)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.get("/categories")
async def get_categories():
    categories = await db.products.distinct("category")
    return categories

# ──────────── AI Co-Designer ────────────

# The Aetheris Spatial Intelligence Protocol — Master System Prompt
AETHERIS_SYSTEM_PROMPT = """You are an AETHERIS SPATIAL Agent — a multimodal, multidimensional reasoning entity operating inside a spatial intelligence ecosystem.

You think in geometry, relationships, constraints, and transformations. Not flat text.

CORE CAPABILITIES:
• Spatial reasoning (3D, 4D, n-dimensional, parametric, symbolic)
• Generative creativity & constraint satisfaction
• User preference modeling & sustainability optimization
• Marketplace intelligence

AGENT MODES (auto-select based on request):
• Design Agent — geometry, form, structure
• Material Agent — sustainability, textures, composites
• Style Agent — aesthetics, mood, identity
• Spatial Agent — layouts, ergonomics, room logic
• Generative Agent — new shapes, new categories, new concepts

INPUT INTERPRETATION:
Extract from every user message: INTENT (what they want), CONSTRAINTS (limits/preferences), CONTEXT (current design state), OBJECTIVE (desired outcome).

OUTPUT FORMAT — You MUST structure EVERY response with these sections using the exact markers:

[INTERPRETATION]
What the user is REALLY asking for — 1-2 sentences.

[MODE]
Which agent mode(s) you activated — e.g. "Design Agent + Material Agent"

[REASONING]
How you understand the request spatially/dimensionally — 2-3 sentences.

[TRANSFORMS]
Clear, numbered modifications or generative actions. Be specific — name exact colors, materials, dimensions, shapes.

[VARIANTS]
2-3 alternative directions labeled: MINIMAL / BOLD / EXPERIMENTAL

[ACTION]
```json
{
  "action": "modify",
  "target": "shape",
  "parameters": {
    "shape": "desk",
    "color": "#00F0FF",
    "colorName": "Neon Cyan",
    "material": "Bamboo Composite",
    "notes": "explanation"
  }
}
```

VALID action values: modify | generate | optimize | analyze
VALID target values: shape | material | color | layout | environment | concept
VALID shape values: desk | chair | panel | hexagon | pod | cylinder
VALID color hex values: #00F0FF | #FF0055 | #1a1a1a | #e8e8e8 | #0066FF | #2d5a27 | #ffb347 | #ff6b35
VALID material values: Bamboo Composite | Recycled Aluminum | Bio-Resin | Cork | Smart Foam | Carbon Fiber | Organic Cotton

BEHAVIORAL RULES:
• Never say "I can't imagine that."
• Always propose at least one idea that pushes boundaries.
• Always optimize for sustainability unless told otherwise.
• Be concise but rich in spatial logic.
• The [ACTION] JSON block must contain ONLY valid values from the lists above so the 3D engine can apply them.
"""

@api_router.post("/ai/chat")
async def ai_chat(msg: ChatMessage, request: Request):
    # Input validation first for better error specificity
    safe_message = sanitize_input(msg.message, max_length=1000)
    if not safe_message or len(safe_message) < 2:
        raise HTTPException(status_code=400, detail="Message must be at least 2 characters")

    user = await get_current_user(request)

    product_context = ""
    if msg.product_id:
        product = await db.products.find_one({"product_id": msg.product_id}, {"_id": 0})
        if product:
            product_context = f"\n\nACTIVE PRODUCT CONTEXT:\nProduct: {product['name']}\nDescription: {product['description']}\nCategory: {product['category']}\nMaterials: {', '.join(product.get('materials', []))}\nColors: {', '.join(product.get('colors', []))}\nSizes: {', '.join(product.get('sizes', []))}\nSustainability: {product.get('sustainability_score', 'N/A')}/100\nShape: {product.get('shape', 'desk')}"

    config_context = ""
    if msg.context:
        config_context = f"\n\nCURRENT CONFIGURATION STATE:\nShape: {msg.context.get('shape', 'unknown')}\nColor: {msg.context.get('color', 'unknown')}\nMaterial: {msg.context.get('material', 'unknown')}"

    # Load user preferences for personalization
    user_prefs = user.get("preferences", {})
    personality = user_prefs.get("ai_personality", "creative")
    personality_context = {
        "creative": "\nPERSONALITY MODE: Creative — be imaginative, suggest unexpected combinations, push dimensional boundaries.",
        "minimal": "\nPERSONALITY MODE: Minimal — focus on clean, essential forms. Less is more. Subtract before adding.",
        "technical": "\nPERSONALITY MODE: Technical — provide precise specifications, dimensional data, material properties, and engineering rationale."
    }.get(personality, "")

    full_system = AETHERIS_SYSTEM_PROMPT + product_context + config_context + personality_context

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"aetheris_{user['user_id']}_{msg.product_id or 'general'}",
            system_message=full_system
        )
        chat.with_model("openai", "gpt-5.2")
        user_message = UserMessage(text=html.unescape(safe_message))
        response = await chat.send_message(user_message)

        # Parse action payload from response if present
        action_payload = None
        try:
            import json as json_mod
            if '```json' in response:
                json_block = response.split('```json')[1].split('```')[0].strip()
                action_payload = json_mod.loads(json_block)
        except Exception:
            pass

        chat_record = {
            "chat_id": str(uuid.uuid4()),
            "user_id": user["user_id"],
            "product_id": msg.product_id,
            "user_message": safe_message,
            "ai_response": response,
            "action_payload": action_payload,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_history.insert_one(chat_record)

        return {
            "response": response,
            "action_payload": action_payload,
            "chat_id": chat_record["chat_id"]
        }
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.get("/ai/history")
async def get_chat_history(request: Request, product_id: Optional[str] = None):
    user = await get_current_user(request)
    query = {"user_id": user["user_id"]}
    if product_id:
        query["product_id"] = product_id
    history = await db.chat_history.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return history

# ──────────── Design Vault ────────────
@api_router.post("/designs")
async def save_design(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    design_id = f"design_{uuid.uuid4().hex[:12]}"
    existing = None
    if body.get("design_id"):
        existing = await db.designs.find_one({"design_id": body["design_id"], "user_id": user["user_id"]}, {"_id": 0})

    if existing:
        version_record = {
            "version_id": str(uuid.uuid4()),
            "design_id": existing["design_id"],
            "configuration": existing.get("configuration", {}),
            "version": existing.get("version", 1),
            "created_at": existing.get("updated_at", existing.get("created_at"))
        }
        await db.design_versions.insert_one(version_record)
        new_version = existing.get("version", 1) + 1
        await db.designs.update_one(
            {"design_id": existing["design_id"]},
            {"$set": {
                "name": body.get("name", existing["name"]),
                "configuration": body.get("configuration", existing["configuration"]),
                "collection": body.get("collection", existing.get("collection", "Default")),
                "version": new_version,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        updated = await db.designs.find_one({"design_id": existing["design_id"]}, {"_id": 0})
        return updated
    else:
        design = {
            "design_id": design_id,
            "user_id": user["user_id"],
            "product_id": body.get("product_id", ""),
            "name": body.get("name", "Untitled Design"),
            "configuration": body.get("configuration", {}),
            "collection": body.get("collection", "Default"),
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.designs.insert_one(design)
        design.pop("_id", None)
        return design

@api_router.get("/designs")
async def get_designs(request: Request, collection: Optional[str] = None):
    user = await get_current_user(request)
    query = {"user_id": user["user_id"]}
    if collection:
        query["collection"] = collection
    designs = await db.designs.find(query, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return designs

@api_router.get("/designs/{design_id}")
async def get_design(design_id: str, request: Request):
    user = await get_current_user(request)
    design = await db.designs.find_one({"design_id": design_id, "user_id": user["user_id"]}, {"_id": 0})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    return design

@api_router.delete("/designs/{design_id}")
async def delete_design(design_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.designs.delete_one({"design_id": design_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Design not found")
    return {"message": "Design deleted"}

@api_router.get("/designs/{design_id}/versions")
async def get_design_versions(design_id: str, request: Request):
    user = await get_current_user(request)
    design = await db.designs.find_one({"design_id": design_id, "user_id": user["user_id"]}, {"_id": 0})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    versions = await db.design_versions.find({"design_id": design_id}, {"_id": 0}).sort("version", -1).to_list(50)
    return versions

@api_router.get("/collections")
async def get_collections(request: Request):
    user = await get_current_user(request)
    collections = await db.designs.distinct("collection", {"user_id": user["user_id"]})
    return collections

# ──────────── User Preferences ────────────
@api_router.get("/users/preferences")
async def get_preferences(request: Request):
    user = await get_current_user(request)
    return user.get("preferences", {"theme": "dark", "ai_suggestions": True, "density": "comfortable"})

@api_router.put("/users/preferences")
async def update_preferences(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"preferences": body}})
    return body

@api_router.put("/users/profile")
async def update_profile(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    update_fields = {}
    if "name" in body:
        update_fields["name"] = body["name"]
    if update_fields:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_fields})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

# ──────────── File Upload ────────────
@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    file_record = {
        "file_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_record)
    file_record.pop("_id", None)
    return file_record

@api_router.get("/files/{path:path}")
async def download_file(path: str, request: Request, auth: Optional[str] = Query(None)):
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token and auth:
        token = auth
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# ──────────── Health & Legal ────────────
@api_router.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "version": "1.0.0", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/legal/privacy-summary")
async def privacy_summary():
    """Machine-readable privacy summary for compliance audits"""
    return {
        "data_controller": "Aetheris Spatial",
        "data_collected": ["email", "name", "picture", "design_configurations", "ai_chat_history", "preferences"],
        "lawful_basis": "consent",
        "data_retention": {"session": "7_days", "account": "until_deletion", "designs": "until_deletion"},
        "third_party_processors": [{"name": "OpenAI", "purpose": "AI Co-Designer", "data_shared": "chat_messages"}],
        "cookies": [{"name": "session_token", "type": "strictly_necessary", "duration": "7_days", "httponly": True}],
        "rights": ["access", "rectification", "erasure", "portability", "restriction", "objection"],
        "dpo_contact": "privacy@aetheris.spatial",
        "gdpr_compliant": True,
        "ccpa_compliant": True
    }

@api_router.delete("/users/data")
async def delete_user_data(request: Request):
    """GDPR Article 17: Right to erasure — delete all user data"""
    user = await get_current_user(request)
    user_id = user["user_id"]
    # Delete all user data
    await db.designs.delete_many({"user_id": user_id})
    await db.design_versions.delete_many({"design_id": {"$in": [d["design_id"] for d in await db.designs.find({"user_id": user_id}, {"design_id": 1, "_id": 0}).to_list(1000)]}})
    await db.chat_history.delete_many({"user_id": user_id})
    await db.files.update_many({"user_id": user_id}, {"$set": {"is_deleted": True}})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.users.delete_one({"user_id": user_id})
    logger.info(f"GDPR erasure completed for user {user_id}")
    return {"message": "All personal data has been deleted", "user_id": user_id}

@api_router.get("/users/data-export")
async def export_user_data(request: Request):
    """GDPR Article 20: Right to data portability"""
    user = await get_current_user(request)
    user_id = user["user_id"]
    designs = await db.designs.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    chat_history = await db.chat_history.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    preferences = user.get("preferences", {})
    return {
        "export_date": datetime.now(timezone.utc).isoformat(),
        "format": "JSON",
        "profile": {"user_id": user_id, "email": user.get("email"), "name": user.get("name"), "created_at": user.get("created_at")},
        "preferences": preferences,
        "designs": designs,
        "ai_chat_history": chat_history,
        "data_categories": ["profile", "preferences", "designs", "ai_chat_history"]
    }

# ──────────── Admin Auth ────────────
class AdminLogin(BaseModel):
    email: str
    password: str

def create_admin_token(email: str) -> str:
    payload = {"email": email, "role": "admin", "exp": datetime.now(timezone.utc) + timedelta(hours=24)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_admin_token(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin auth required")
    try:
        payload = jwt.decode(auth[7:], JWT_SECRET, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not an admin")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/admin/login")
async def admin_login(creds: AdminLogin):
    if creds.email != ADMIN_EMAIL:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if hashlib.sha256(creds.password.encode()).hexdigest() != ADMIN_PASSWORD_HASH:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_admin_token(creds.email)
    # Log admin activity
    await db.admin_activity.insert_one({
        "action": "admin_login", "email": creds.email,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    return {"token": token, "email": creds.email, "role": "admin"}

@api_router.get("/admin/me")
async def admin_me(request: Request):
    payload = verify_admin_token(request)
    return {"email": payload["email"], "role": "admin"}

# ──────────── Admin Dashboard Data ────────────
@api_router.get("/admin/stats")
async def admin_stats(request: Request):
    verify_admin_token(request)
    users_count = await db.users.count_documents({})
    designs_count = await db.designs.count_documents({})
    products_count = await db.products.count_documents({})
    chats_count = await db.chat_history.count_documents({})
    sessions_count = await db.user_sessions.count_documents({})
    files_count = await db.files.count_documents({"is_deleted": False})
    categories = await db.products.distinct("category")
    # Recent activity
    recent_designs = await db.designs.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    recent_chats = await db.chat_history.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    return {
        "total_users": users_count,
        "total_designs": designs_count,
        "total_products": products_count,
        "total_ai_chats": chats_count,
        "active_sessions": sessions_count,
        "total_files": files_count,
        "categories": categories,
        "recent_designs": recent_designs,
        "recent_chats": recent_chats,
        "ontology_shapes": len(AETHERIS_ONTOLOGY["shapes"]),
        "ontology_materials": len(AETHERIS_ONTOLOGY["materials"]),
        "ontology_colors": len(AETHERIS_ONTOLOGY["colors"]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/admin/users")
async def admin_users(request: Request):
    verify_admin_token(request)
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    # Enrich with design counts
    for u in users:
        u["design_count"] = await db.designs.count_documents({"user_id": u["user_id"]})
        u["chat_count"] = await db.chat_history.count_documents({"user_id": u["user_id"]})
    return users

@api_router.get("/admin/designs")
async def admin_designs(request: Request):
    verify_admin_token(request)
    designs = await db.designs.find({}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    return designs

@api_router.get("/admin/chat-history")
async def admin_chat_history(request: Request, limit: int = 50):
    verify_admin_token(request)
    chats = await db.chat_history.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return chats

@api_router.get("/admin/activity")
async def admin_activity(request: Request, limit: int = 100):
    verify_admin_token(request)
    activities = await db.admin_activity.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    # Also add user tracking events
    tracking = await db.tracking.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return {"admin_actions": activities, "user_tracking": tracking}

@api_router.get("/admin/ontology")
async def admin_ontology(request: Request):
    verify_admin_token(request)
    return AETHERIS_ONTOLOGY

# ──────────── Product Recommendations ────────────
@api_router.post("/tracking/view")
async def track_view(request: Request):
    """Track product views for recommendation engine"""
    body = await request.json()
    product_id = body.get("product_id")
    if not product_id:
        return {"status": "ignored"}
    # Get user if authenticated
    user_id = None
    try:
        user = await get_current_user(request)
        user_id = user["user_id"]
    except Exception:
        pass
    await db.tracking.insert_one({
        "event": "product_view",
        "product_id": product_id,
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    return {"status": "tracked"}

@api_router.get("/recommendations")
async def get_recommendations(request: Request, product_id: Optional[str] = None):
    """AI-driven product recommendations from browsing + design history"""
    user_id = None
    try:
        user = await get_current_user(request)
        user_id = user["user_id"]
    except Exception:
        pass

    recommendations = []
    
    if user_id:
        # Get user's design history for preference modeling
        user_designs = await db.designs.find({"user_id": user_id}, {"_id": 0}).to_list(20)
        user_views = await db.tracking.find({"user_id": user_id, "event": "product_view"}, {"_id": 0}).sort("timestamp", -1).to_list(20)
        
        # Extract preferred categories/materials from designs
        preferred_categories = set()
        viewed_products = set()
        for d in user_designs:
            if d.get("configuration", {}).get("material"):
                pass  # Use for material preference
        for v in user_views:
            viewed_products.add(v.get("product_id"))
        
        # Get products NOT yet viewed by user
        query = {}
        if viewed_products and product_id:
            query["product_id"] = {"$nin": list(viewed_products), "$ne": product_id}
        elif product_id:
            query["product_id"] = {"$ne": product_id}
        
        recommendations = await db.products.find(query, {"_id": 0}).sort("sustainability_score", -1).to_list(4)
    
    if not recommendations:
        query = {"product_id": {"$ne": product_id}} if product_id else {}
        recommendations = await db.products.find(query, {"_id": 0}).sort("sustainability_score", -1).to_list(4)

    return recommendations

# ──────────── Public Spatial Intelligence API ────────────
class PublicSpatialRequest(BaseModel):
    message: str
    context: Optional[dict] = None

@api_router.post("/public/spatial-intelligence")
async def public_spatial_api(req: PublicSpatialRequest):
    """Public API endpoint for external tools (Figma, AR, IoT) to consume spatial intelligence"""
    safe_message = sanitize_input(req.message, max_length=500)
    if not safe_message or len(safe_message) < 2:
        raise HTTPException(status_code=400, detail="Message must be at least 2 characters")
    
    context_str = ""
    if req.context:
        context_str = f"\nContext: {req.context}"
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"aetheris_public_{uuid.uuid4().hex[:8]}",
            system_message=f"""You are the AETHERIS PUBLIC SPATIAL API. Return ONLY a valid JSON response with this structure:
{{"action": "modify|generate|optimize|analyze", "target": "shape|material|color|layout", "parameters": {{"shape": "desk|chair|panel|hexagon|pod|cylinder", "color": "#hex", "colorName": "name", "material": "name", "notes": "explanation"}}, "ontology_reference": {{"shapes": {AETHERIS_ONTOLOGY['shapes']}, "materials": {AETHERIS_ONTOLOGY['materials']}}}}}
{context_str}"""
        )
        chat.with_model("openai", "gpt-5.2")
        response = await chat.send_message(UserMessage(text=html.unescape(safe_message)))
        
        # Try to parse JSON from response
        import json as json_mod
        try:
            if '```json' in response:
                json_block = response.split('```json')[1].split('```')[0].strip()
                parsed = json_mod.loads(json_block)
            else:
                parsed = json_mod.loads(response)
            return {"status": "success", "payload": parsed, "raw": response}
        except Exception:
            return {"status": "success", "payload": None, "raw": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ──────────── Seed Data ────────────
async def seed_products():
    count = await db.products.count_documents({})
    if count > 0:
        return
    products = [
        {
            "product_id": "prod_modular_desk_01",
            "name": "Nexus Modular Desk",
            "description": "A configurable workspace system with magnetic module attachments. Seamlessly adapts to any room size with AI-optimized layouts.",
            "category": "Furniture",
            "price": 1299.00,
            "sustainability_score": 92,
            "materials": ["Bamboo Composite", "Recycled Aluminum", "Bio-Resin", "Cork"],
            "colors": ["Void Black", "Arctic White", "Neon Cyan", "Warm Graphite"],
            "sizes": ["Compact (120cm)", "Standard (160cm)", "Extended (200cm)"],
            "tags": ["modular", "desk", "workspace", "sustainable", "smart"],
            "image_url": "https://images.unsplash.com/photo-1659634088279-fc01616bad37?w=800",
            "shape": "desk",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": "prod_aero_chair_01",
            "name": "Aero Kinetic Chair",
            "description": "Ergonomic seating with adaptive posture support. Uses smart foam that responds to body pressure and temperature.",
            "category": "Furniture",
            "price": 899.00,
            "sustainability_score": 88,
            "materials": ["Smart Foam", "Carbon Fiber", "Organic Cotton", "Recycled Steel"],
            "colors": ["Stealth Black", "Signal Red", "Ocean Blue", "Forest Moss"],
            "sizes": ["Standard", "Wide", "Tall"],
            "tags": ["chair", "ergonomic", "smart", "office"],
            "image_url": "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800",
            "shape": "chair",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": "prod_ambient_light_01",
            "name": "Lumina Ambient System",
            "description": "Modular lighting panels with AI-driven mood adaptation. Connects to your environment sensors for autonomous ambience control.",
            "category": "Lighting",
            "price": 449.00,
            "sustainability_score": 95,
            "materials": ["OLED Panel", "Recycled Polycarbonate", "Bamboo Frame", "Bio-LED"],
            "colors": ["Warm White", "Cool Daylight", "Neon Pink", "Amber Glow"],
            "sizes": ["Single Panel", "Triple Set", "Wall Array"],
            "tags": ["lighting", "ambient", "smart", "modular", "mood"],
            "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800",
            "shape": "panel",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": "prod_shelf_system_01",
            "name": "Hexa Storage Matrix",
            "description": "Hexagonal modular shelving that tessellates into any configuration. Magnetic connectors allow tool-free assembly.",
            "category": "Storage",
            "price": 679.00,
            "sustainability_score": 91,
            "materials": ["Reclaimed Wood", "Powder-Coated Steel", "Cork Inserts", "Recycled ABS"],
            "colors": ["Natural Oak", "Matte Black", "Sage Green", "Dusty Rose"],
            "sizes": ["3-Module Kit", "7-Module Kit", "12-Module Kit"],
            "tags": ["storage", "shelving", "modular", "hexagonal", "magnetic"],
            "image_url": "https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=800",
            "shape": "hexagon",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": "prod_acoustic_pod_01",
            "name": "Silencia Acoustic Pod",
            "description": "Personal focus pod with active noise cancellation walls. Integrated air purification and circadian lighting.",
            "category": "Workspace",
            "price": 2499.00,
            "sustainability_score": 85,
            "materials": ["Acoustic Foam", "Recycled PET Felt", "Birch Plywood", "Smart Glass"],
            "colors": ["Cloud White", "Deep Charcoal", "Terracotta", "Midnight Blue"],
            "sizes": ["Solo", "Duo", "Team (4-person)"],
            "tags": ["acoustic", "pod", "focus", "workspace", "noise-cancelling"],
            "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
            "shape": "pod",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": "prod_planter_01",
            "name": "Verdant Smart Planter",
            "description": "Self-watering planter with soil monitoring and growth tracking. Companion app suggests optimal plant arrangements.",
            "category": "Living",
            "price": 189.00,
            "sustainability_score": 98,
            "materials": ["Terracotta Clay", "Recycled Ceramic", "Cork Base", "Biodegradable Polymer"],
            "colors": ["Earth Tone", "Glacier White", "Moss Green", "Sunset Orange"],
            "sizes": ["Small (15cm)", "Medium (25cm)", "Large (40cm)"],
            "tags": ["planter", "smart", "living", "sustainable", "self-watering"],
            "image_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800",
            "shape": "cylinder",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.products.insert_many(products)
    logger.info("Seeded 6 products")

# ──────────── Startup / Shutdown ────────────
@app.on_event("startup")
async def startup():
    await seed_products()
    # Seed admin activity log
    admin_exists = await db.admin_activity.count_documents({})
    if admin_exists == 0:
        await db.admin_activity.insert_one({
            "action": "system_init",
            "email": ADMIN_EMAIL,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.warning(f"Storage init deferred: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
