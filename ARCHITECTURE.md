# AETHERIS SPATIAL — Complete Architectural Blueprint
## AI-Native 3D Marketplace | Engineering Documentation

---

## 1. SITE MAP

```
AETHERIS SPATIAL
│
├── / ──────────────────────────── Landing Page (public)
│   ├── Hero Section (3D desk model + CTA)
│   ├── Features Bento Grid (6 cards)
│   └── Footer (legal links, compliance badges)
│
├── /dashboard ─────────────────── Discovery Hub (auth required)
│   ├── Search bar (smart search)
│   ├── Category filter (All, Furniture, Lighting, Storage, Workspace, Living)
│   ├── Sort controls (Newest, Price Low/High, Eco Score)
│   └── Product grid (bento layout, 6 products)
│
├── /product/:productId ────────── Product Detail (public)
│   ├── 3D Viewer (interactive, color-reactive)
│   ├── Color swatch selector
│   ├── Material selector
│   ├── Size selector
│   ├── Save to Vault / Open in Studio actions
│   └── Specifications panel (sustainability bar, tags)
│
├── /studio ────────────────────── Creator Studio (auth required)
│   ├── 3D Canvas (full viewport, shape/color reactive)
│   ├── Floating toolbar (design name + save)
│   ├── Shape selector (Desk, Chair, Panel, Hexagon, Pod, Cylinder)
│   ├── Side panel: Color palette (8 colors)
│   ├── Side panel: Material selector (7 materials)
│   └── AI Co-Designer chat panel (GPT-5.2 powered)
│
├── /vault ─────────────────────── Design Vault (auth required)
│   ├── Collection filter tabs
│   ├── Design cards (version badge, collection tag)
│   ├── Per-card actions: Edit, Versions, Share, Delete
│   └── Version history expandable panel
│
├── /settings ──────────────────── Account & Settings (auth required)
│   ├── Profile section (avatar, name, email)
│   ├── AI Personalization (suggestions toggle, personality: Creative/Minimal/Technical)
│   ├── Preferences (UI density, notifications, auto-save)
│   └── Session management (sign out)
│
├── /privacy ───────────────────── Privacy Policy (public, GDPR Art. 12-23)
├── /terms ─────────────────────── Terms of Service (public)
├── /dashboard#session_id=... ──── Auth Callback (processes Google OAuth)
└── /* ─────────────────────────── 404 Not Found (public)
```

---

## 2. COMPONENT TREE

```
<App>
├── <ErrorBoundary>                         ← Crash recovery wrapper
│   └── <BrowserRouter>
│       └── <AuthProvider>                  ← Auth state (user, login, logout)
│           ├── <a.skip-to-main />          ← WCAG 2.4.1 skip link
│           ├── <Navbar />                  ← Fixed top, glassmorphism
│           │   ├── Logo (Cube + "AETHERIS")
│           │   ├── Desktop nav links (Discovery, Creator Studio, Design Vault, Settings)
│           │   ├── User avatar + logout
│           │   └── Mobile hamburger menu
│           │
│           ├── <Routes>
│           │   ├── "/" → <Landing />
│           │   │   ├── Hero (Scene3D + CTA buttons)
│           │   │   ├── Features bento grid (6 motion cards)
│           │   │   └── Footer (legal links + compliance)
│           │   │
│           │   ├── "/dashboard" → <ProtectedRoute> → <DiscoveryHub />
│           │   │   ├── Header (title + subtitle)
│           │   │   ├── Search input
│           │   │   ├── Sort buttons (4 options)
│           │   │   ├── Category pills (dynamic from API)
│           │   │   └── Product cards grid (bento 12-col, CSS glow)
│           │   │
│           │   ├── "/product/:id" → <ProductDetail />
│           │   │   ├── Back link
│           │   │   ├── Scene3D (single canvas, color-reactive)
│           │   │   ├── Color swatches overlay
│           │   │   ├── Product info (name, price, description)
│           │   │   ├── Material fieldset (radio group)
│           │   │   ├── Size fieldset (radio group)
│           │   │   ├── Action buttons (Save to Vault, Open in Studio)
│           │   │   └── Specifications dl (category, materials, sizes, sustainability, tags)
│           │   │
│           │   ├── "/studio" → <ProtectedRoute> → <CreatorStudio />
│           │   │   ├── Scene3D (9-col, full height)
│           │   │   ├── Floating toolbar (name input + save)
│           │   │   ├── Shape selector bar (6 shapes)
│           │   │   ├── Side panel (3-col):
│           │   │   │   ├── Color grid (4x2, radio group)
│           │   │   │   ├── Material list (7 items, radio group)
│           │   │   │   └── AI Co-Designer chat:
│           │   │   │       ├── Header (Brain icon + "AI Co-Designer")
│           │   │   │       ├── Message log (aria-live)
│           │   │   │       ├── Loading dots animation
│           │   │   │       └── Input form (text + send button)
│           │   │
│           │   ├── "/vault" → <ProtectedRoute> → <DesignVault />
│           │   │   ├── Header (count)
│           │   │   ├── Collection pills
│           │   │   └── Design cards grid (4-col):
│           │   │       ├── CSS glow preview
│           │   │       ├── Version badge, collection tag
│           │   │       ├── Actions (Edit, Versions, Share, Delete)
│           │   │       └── Expandable version history
│           │   │
│           │   ├── "/settings" → <ProtectedRoute> → <Settings />
│           │   │   ├── Profile card (avatar, name, email, save)
│           │   │   ├── AI Personalization card (toggle, personality grid)
│           │   │   ├── Preferences card (density, notifications, auto-save)
│           │   │   └── Session card (sign out)
│           │   │
│           │   ├── "/privacy" → <PrivacyPolicy />
│           │   ├── "/terms" → <TermsOfService />
│           │   └── "/*" → <NotFound />
│           │
│           ├── <CookieConsent />            ← GDPR banner (fixed bottom)
│           └── <Toaster />                  ← Sonner toast notifications
```

---

## 3. DATA MODELS (MongoDB Collections)

### `users`
```json
{
  "user_id": "user_abc123def456",       // unique, generated on first login
  "email": "user@example.com",          // from Google OAuth
  "name": "Jane Designer",              // from Google OAuth
  "picture": "https://...",             // Google avatar URL
  "preferences": {
    "theme": "dark",
    "ai_suggestions": true,
    "density": "comfortable",
    "ai_personality": "creative",
    "notifications": true,
    "auto_save": true
  },
  "created_at": "2026-03-22T14:00:00Z"
}
```

### `user_sessions`
```json
{
  "user_id": "user_abc123def456",
  "session_token": "st_a1b2c3d4e5f6",  // HttpOnly Secure cookie
  "expires_at": "2026-03-29T14:00:00Z", // 7-day TTL
  "created_at": "2026-03-22T14:00:00Z"
}
```

### `products` (6 seeded)
```json
{
  "product_id": "prod_modular_desk_01",
  "name": "Nexus Modular Desk",
  "description": "A configurable workspace system...",
  "category": "Furniture",                // Furniture | Lighting | Storage | Workspace | Living
  "price": 1299.00,
  "sustainability_score": 92,             // 0-100
  "materials": ["Bamboo Composite", "Recycled Aluminum", "Bio-Resin", "Cork"],
  "colors": ["Void Black", "Arctic White", "Neon Cyan", "Warm Graphite"],
  "sizes": ["Compact (120cm)", "Standard (160cm)", "Extended (200cm)"],
  "tags": ["modular", "desk", "workspace", "sustainable", "smart"],
  "shape": "desk",                        // desk | chair | panel | hexagon | pod | cylinder
  "image_url": "https://images.unsplash.com/...",
  "created_at": "2026-03-22T14:00:00Z"
}
```

### `designs`
```json
{
  "design_id": "design_abc123def456",
  "user_id": "user_abc123def456",
  "product_id": "prod_modular_desk_01",
  "name": "Nexus Modular Desk - Custom",
  "configuration": {
    "shape": "desk",
    "color": "Neon Cyan",
    "colorHex": "#00F0FF",
    "material": "Bamboo Composite",
    "size": "Standard (160cm)"
  },
  "collection": "Default",
  "version": 1,
  "created_at": "2026-03-22T14:00:00Z",
  "updated_at": "2026-03-22T14:00:00Z"
}
```

### `design_versions` (auto-created on design update)
```json
{
  "version_id": "uuid",
  "design_id": "design_abc123def456",
  "configuration": { ... },              // snapshot of previous config
  "version": 1,
  "created_at": "2026-03-22T14:00:00Z"
}
```

### `chat_history`
```json
{
  "chat_id": "uuid",
  "user_id": "user_abc123def456",
  "product_id": "prod_modular_desk_01",  // nullable
  "user_message": "Make it more minimal",
  "ai_response": "I'd suggest switching to...",
  "created_at": "2026-03-22T14:00:00Z"
}
```

### `files` (object storage metadata)
```json
{
  "file_id": "uuid",
  "user_id": "user_abc123def456",
  "storage_path": "aetheris-spatial/uploads/user_abc/uuid.png",
  "original_filename": "design-screenshot.png",
  "content_type": "image/png",
  "size": 245760,
  "is_deleted": false,
  "created_at": "2026-03-22T14:00:00Z"
}
```

---

## 4. API SCHEMA (All prefixed with `/api`)

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/session` | - | Exchange Google OAuth session_id for app session |
| GET | `/api/auth/me` | Cookie/Bearer | Get current authenticated user |
| POST | `/api/auth/logout` | Cookie | Destroy session, clear cookie |

### Products
| Method | Endpoint | Auth | Params | Description |
|--------|----------|------|--------|-------------|
| GET | `/api/products` | - | `?category=&search=&min_price=&max_price=&sort=` | List/search/filter products |
| GET | `/api/products/:product_id` | - | - | Get single product |
| GET | `/api/categories` | - | - | List distinct categories |

### AI Co-Designer
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/ai/chat` | Required | `{message, product_id?, context?}` | Send message to GPT-5.2 AI |
| GET | `/api/ai/history` | Required | `?product_id=` | Get user's chat history |

### Design Vault
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/designs` | Required | Create or update (version) a design |
| GET | `/api/designs` | Required | List user's designs (`?collection=`) |
| GET | `/api/designs/:design_id` | Required | Get single design |
| DELETE | `/api/designs/:design_id` | Required | Delete a design |
| GET | `/api/designs/:design_id/versions` | Required | Get version history |
| GET | `/api/collections` | Required | List user's collection names |

### User / Preferences
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/preferences` | Required | Get user preferences |
| PUT | `/api/users/preferences` | Required | Update preferences |
| PUT | `/api/users/profile` | Required | Update profile (name) |

### Files
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload` | Required | Upload file to object storage |
| GET | `/api/files/:path` | Required | Download file |

### Health & Legal (Compliance)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | - | Health check (status, version, timestamp) |
| GET | `/api/legal/privacy-summary` | - | Machine-readable GDPR/CCPA privacy summary |
| DELETE | `/api/users/data` | Required | GDPR Article 17: Right to erasure |
| GET | `/api/users/data-export` | Required | GDPR Article 20: Data portability export |

---

## 5. INTERACTION FLOWS

### Flow 1: First-Time User Journey
```
Landing (/) → Click "Enter the Spatial"
  → Redirect to auth.emergentagent.com (Google OAuth)
  → Callback to /dashboard#session_id=...
  → AuthCallback.js exchanges session_id via POST /api/auth/session
  → Cookie set (session_token, HttpOnly, Secure, SameSite=None, 7d)
  → Redirect to /dashboard (Discovery Hub)
  → Cookie consent banner appears → Accept
  → Browse products → Click card → /product/:id
  → Interact with 3D viewer, select color/material/size
  → "Save to Vault" → POST /api/designs
  → "Open in Studio" → /studio?product=:id
  → Customize in 3D, chat with AI Co-Designer
  → "Save" → POST /api/designs (version incremented)
  → Navigate to /vault → See saved designs
```

### Flow 2: AI Co-Designer Chat
```
User in Creator Studio → Types "Make it more minimal"
  → POST /api/ai/chat { message, product_id, context: {shape, color, material} }
  → Backend: sanitize_input() → emergentintegrations GPT-5.2 call
  → System prompt includes product context + current config
  → Response stored in chat_history collection
  → AI response displayed in chat panel (aria-live region)
```

### Flow 3: Design Versioning
```
User has existing design (v1) → Makes changes in Studio → Saves
  → POST /api/designs { design_id: existing_id, configuration: new_config }
  → Backend: copies current config → design_versions (v1 snapshot)
  → Updates design document → version: 2, updated_at: now
  → User goes to /vault → Clicks clock icon → sees v1 in history
```

### Flow 4: GDPR Data Management
```
User goes to /settings → Wants to delete all data
  → Triggers DELETE /api/users/data
  → Backend deletes: designs, design_versions, chat_history, files (soft), sessions, user
  → Logs: "GDPR erasure completed for user_xxx"
  → Response: { message: "All personal data has been deleted" }
```

---

## 6. TECHNOLOGY STACK

### Frontend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2.3 |
| Routing | react-router-dom | 6.x |
| 3D Rendering | Three.js (vanilla) | 0.183.2 |
| Animation | Framer Motion | latest |
| Styling | Tailwind CSS | 3.x |
| Component Library | Shadcn/UI | (local components) |
| Icons | @phosphor-icons/react | latest |
| HTTP Client | Axios | latest |
| Toast | Sonner | latest |
| Fonts | Unbounded, Outfit, JetBrains Mono | Google Fonts |

### Backend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | FastAPI | latest |
| Database Driver | Motor (async MongoDB) | latest |
| AI Integration | emergentintegrations (GPT-5.2) | latest |
| Auth Provider | Emergent Google Auth | managed |
| Object Storage | Emergent Object Storage | managed |
| Validation | Pydantic v2 | latest |

### Infrastructure
| Component | Service |
|-----------|---------|
| Database | MongoDB (local, MONGO_URL from env) |
| Process Manager | Supervisor |
| Frontend Port | 3000 (hot reload) |
| Backend Port | 8001 (uvicorn, hot reload) |
| Ingress | Kubernetes (routes /api → 8001, /* → 3000) |

---

## 7. SECURITY ARCHITECTURE

### HTTP Security Headers (OWASP)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
Cache-Control: no-store (API routes) | public, max-age=3600 (static)
```

### Rate Limiting
- General: 120 requests/minute per IP
- AI endpoints: 20 requests/minute per IP (separate bucket)
- Response on exceed: HTTP 429 + Retry-After header

### Input Sanitization
- `sanitize_input()`: HTML entity encoding, control char removal, length limit (2000 chars)
- `sanitize_search()`: Regex special char escaping (prevents ReDoS)
- AI chat messages: sanitized before LLM call, max 1000 chars, min 2 chars

### Authentication
- Session-based (HttpOnly, Secure, SameSite=None cookies)
- 7-day session TTL with server-side expiry check
- Supports both Cookie and Bearer token auth headers

---

## 8. ACCESSIBILITY COMPLIANCE (WCAG 2.2 AA)

| WCAG Criterion | Implementation |
|----------------|----------------|
| 2.4.1 Bypass Blocks | Skip-to-content link (`<a.skip-to-main>`) |
| 2.4.7 Focus Visible | `focus-visible` outline on all interactive elements |
| 2.3.3 Animation | `prefers-reduced-motion` disables all animations |
| 2.5.8 Target Size | Min 44x44px touch targets on `pointer: coarse` |
| 1.3.1 Info & Relationships | Semantic HTML: `<main>`, `<nav>`, `<article>`, `<fieldset>`, `<legend>`, `<dl>` |
| 4.1.2 Name, Role, Value | ARIA: `role`, `aria-label`, `aria-pressed`, `aria-checked`, `aria-expanded`, `aria-live` |
| 1.4.11 Non-text Contrast | 3:1+ contrast ratios on interactive elements |
| Forced Colors | `forced-colors: active` media query support |

---

## 9. LEGAL COMPLIANCE

| Regulation | Feature |
|------------|---------|
| GDPR Art. 6 | Lawful basis: consent (cookie consent banner) |
| GDPR Art. 12-14 | Privacy Policy page (9 sections, transparent processing) |
| GDPR Art. 15 | Right of access: GET /api/users/data-export |
| GDPR Art. 17 | Right to erasure: DELETE /api/users/data |
| GDPR Art. 20 | Right to data portability: GET /api/users/data-export (JSON) |
| GDPR Art. 25 | Data protection by design (HttpOnly cookies, input sanitization) |
| GDPR Art. 32 | Security measures (HTTPS, HSTS, security headers) |
| ePrivacy Dir. | Cookie consent banner (strictly necessary only, Accept/Decline) |
| CCPA | Machine-readable privacy summary API |
| AI Transparency | Terms of Service Section 5: AI-Generated Content disclaimers |

---

## 10. FILE STRUCTURE

```
/app/
├── backend/
│   ├── .env                              # MONGO_URL, DB_NAME, CORS_ORIGINS, EMERGENT_LLM_KEY
│   ├── server.py                         # 701 lines — FastAPI app, all endpoints, middleware
│   └── requirements.txt                  # pip freeze (123 packages)
│
├── frontend/
│   ├── .env                              # REACT_APP_BACKEND_URL
│   ├── package.json                      # React 19, Three.js, Framer Motion, Phosphor Icons
│   ├── tailwind.config.js                # Tailwind config
│   ├── public/
│   │   └── index.html                    # lang="en", meta description, title
│   └── src/
│       ├── index.js                      # React entry point
│       ├── index.css                     # Global styles, CSS variables, WCAG a11y layer
│       ├── App.js                        # Router, ErrorBoundary, CookieConsent, Toaster
│       ├── App.css                       # Minimal overrides
│       ├── contexts/
│       │   └── AuthContext.js            # Auth state, Google OAuth flow, session check
│       ├── components/
│       │   ├── Navbar.js                 # Fixed nav, glassmorphism, mobile menu, ARIA
│       │   ├── Scene3D.js                # Vanilla Three.js 3D renderer (6 product shapes)
│       │   ├── ProtectedRoute.js         # Auth guard, redirect to /
│       │   ├── ErrorBoundary.js          # React error boundary with recovery UI
│       │   ├── CookieConsent.js          # GDPR cookie consent banner
│       │   └── ui/                       # Shadcn/UI components (switch, sonner, etc.)
│       └── pages/
│           ├── Landing.js                # Hero + 3D + features bento + footer
│           ├── DiscoveryHub.js           # Product grid, search, filters, sort
│           ├── ProductDetail.js          # 3D viewer, selectors, specs, save/studio
│           ├── CreatorStudio.js          # 3D customizer + AI Co-Designer chat
│           ├── DesignVault.js            # Saved designs, collections, versions
│           ├── Settings.js               # Profile, AI personalization, preferences
│           ├── AuthCallback.js           # Google OAuth session exchange
│           ├── PrivacyPolicy.js          # GDPR-compliant privacy policy
│           ├── TermsOfService.js         # Legal terms of service
│           └── NotFound.js               # 404 page
│
└── memory/
    └── PRD.md                            # Product Requirements Document
```

---

## 11. DESIGN SYSTEM

### Color Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-void` | `#000000` | Absolute black backgrounds |
| `--bg-default` | `#030303` | Page background |
| `--bg-surface` | `#0A0A0A` | Card/panel surfaces |
| `--text-primary` | `#FFFFFF` | Headings, important text |
| `--text-secondary` | `#A1A1AA` | Body text, descriptions |
| `--text-muted` | `#71717A` | Captions, labels |
| `--brand-primary` | `#00F0FF` | CTAs, active states, links |
| `--brand-hover` | `#66F6FF` | Hover states |
| `--brand-ai` | `#FF0055` | AI features, magenta accent |
| `--brand-success` | `#E0FF00` | Sustainability, success states |

### Typography
| Role | Font | Weight |
|------|------|--------|
| Headings | Unbounded | 300-900 |
| Body | Outfit | 200-700 |
| Code/Labels | JetBrains Mono | 300-600 |

### Effects
| Effect | Implementation |
|--------|----------------|
| Glassmorphism | `backdrop-filter: blur(24px)`, `rgba(255,255,255,0.04)` bg, `rgba(255,255,255,0.08)` border |
| Glow (cyan) | `box-shadow: 0 0 20px rgba(0,240,255,0.3)` |
| Glow (magenta) | `box-shadow: 0 0 20px rgba(255,0,85,0.3)` |
| Text glow | `text-shadow: 0 0 20px rgba(0,240,255,0.5)` |
| Noise overlay | SVG fractalNoise filter via CSS ::after |
| Tracing beam | Gradient `from-[#FF0055] to-[#00F0FF]` with blur overlay |

### 3D Product Shapes
| Shape | Geometry | Usage |
|-------|----------|-------|
| `desk` | BoxGeometry top + 4 CylinderGeometry legs | Furniture category |
| `chair` | BoxGeometry seat + back + 4 legs | Furniture category |
| `panel` | BoxGeometry with emissive glow | Lighting category |
| `hexagon` | 3 CylinderGeometry (6-sided) tessellated | Storage category |
| `pod` | CapsuleGeometry | Workspace category |
| `cylinder` | CylinderGeometry + SphereGeometry (plant) | Living category |

---

## 12. SEEDED PRODUCTS

| ID | Name | Category | Price | Eco Score | Shape |
|----|------|----------|-------|-----------|-------|
| `prod_modular_desk_01` | Nexus Modular Desk | Furniture | $1,299 | 92 | desk |
| `prod_aero_chair_01` | Aero Kinetic Chair | Furniture | $899 | 88 | chair |
| `prod_ambient_light_01` | Lumina Ambient System | Lighting | $449 | 95 | panel |
| `prod_shelf_system_01` | Hexa Storage Matrix | Storage | $679 | 91 | hexagon |
| `prod_acoustic_pod_01` | Silencia Acoustic Pod | Workspace | $2,499 | 85 | pod |
| `prod_planter_01` | Verdant Smart Planter | Living | $189 | 98 | cylinder |
