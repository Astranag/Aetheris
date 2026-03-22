from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Query, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import requests as http_requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta

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

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
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
@api_router.post("/ai/chat")
async def ai_chat(msg: ChatMessage, request: Request):
    user = await get_current_user(request)
    product_context = ""
    if msg.product_id:
        product = await db.products.find_one({"product_id": msg.product_id}, {"_id": 0})
        if product:
            product_context = f"\nCurrent product: {product['name']} - {product['description']}. Materials: {', '.join(product.get('materials', []))}. Colors: {', '.join(product.get('colors', []))}."

    config_context = ""
    if msg.context:
        config_context = f"\nCurrent configuration: {msg.context}"

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"aetheris_{user['user_id']}_{msg.product_id or 'general'}",
            system_message=f"""You are the Aetheris AI Co-Designer, an expert spatial design assistant for a next-generation 3D marketplace. You help users customize modular products, suggest materials, colors, and configurations. Be creative, concise, and spatial-design focused. Give specific, actionable suggestions.{product_context}{config_context}"""
        )
        chat.with_model("openai", "gpt-5.2")
        user_message = UserMessage(text=msg.message)
        response = await chat.send_message(user_message)

        chat_record = {
            "chat_id": str(uuid.uuid4()),
            "user_id": user["user_id"],
            "product_id": msg.product_id,
            "user_message": msg.message,
            "ai_response": response,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_history.insert_one(chat_record)

        return {"response": response, "chat_id": chat_record["chat_id"]}
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
