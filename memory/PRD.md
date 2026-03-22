# Aetheris Spatial - AI-Native 3D Marketplace PRD

## Original Problem Statement
Build Aetheris Spatial — a next-generation web experience where users explore, customize, and visualize modular products in real-time 3D. The platform blends immersive UI, AI-driven personalization, and fluid spatial interactions. Must fundamentally surpass OpenSea.

## Architecture
- **Frontend**: React 19 + Vanilla Three.js + Tailwind CSS + Shadcn/UI + Framer Motion
- **Backend**: FastAPI + MongoDB (Motor async) + emergentintegrations (GPT-5.2)
- **Auth**: Emergent Google Auth (session-based)
- **Storage**: Emergent Object Storage
- **3D**: Vanilla Three.js (bypasses R3F React 19 compatibility issues)

## User Personas
1. **Creative Professionals** - Designers/architects customizing modular products
2. **Tech-Savvy Consumers** - Users who want spatial 3D product visualization
3. **Sustainability-Conscious Buyers** - Users filtering by sustainability score

## Core Requirements
- [x] Discovery Hub with bento grid, search, filters, categories, sort
- [x] Creator Studio with real-time 3D customization + AI Co-Designer (GPT-5.2)
- [x] Product Detail with 3D viewer, material/color/size selectors, sustainability score
- [x] Design Vault with saved designs, version history, collections, sharing
- [x] Account & Settings with profile, AI personalization, preferences
- [x] Google Auth with session management
- [x] Object storage for file uploads
- [x] Full accessibility (ARIA labels, semantic HTML, roles, keyboard nav)
- [x] Dark futuristic spatial theme (Unbounded + Outfit + JetBrains Mono fonts)
- [x] 6 seeded products across 5 categories

## What's Been Implemented (March 22, 2026)
### Backend (FastAPI)
- Auth: POST /api/auth/session, GET /api/auth/me, POST /api/auth/logout
- Products: GET /api/products (search, filter, sort), GET /api/products/:id, GET /api/categories
- AI: POST /api/ai/chat (GPT-5.2), GET /api/ai/history
- Designs: POST/GET/DELETE /api/designs, GET /api/designs/:id/versions, GET /api/collections
- Users: GET/PUT /api/users/preferences, PUT /api/users/profile
- Upload: POST /api/upload, GET /api/files/:path
- Seed: 6 products (Nexus Desk, Aero Chair, Lumina Panel, Hexa Storage, Silencia Pod, Verdant Planter)

### Frontend (React)
- Landing page with 3D hero, feature bento grid, CTA buttons
- Discovery Hub with product cards (CSS lightweight), search, categories, sort
- Product Detail with 3D viewer, color/material/size selectors, save-to-vault
- Creator Studio with 3D canvas, shape/color/material customizer, AI chat sidebar
- Design Vault with cards, version history, collections, delete/share
- Settings with profile edit, AI personality, density, toggles
- Navbar with active state, mobile responsive menu
- Auth flow (Google Auth redirect + callback + session)

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (Important)
- Voice input for AI Co-Designer
- Smart search with AI (natural language product queries)
- Personalized product recommendations based on browsing history
- Mood-adaptive UI (color/density/typography based on user behavior)

### P2 (Nice to Have)
- Gesture input for 3D manipulation
- GLTF/GLB model loading support
- Product comparison view
- Social sharing with 3D preview cards (Open Graph)
- WebGPU renderer upgrade
- Scroll-triggered animations for product reveal

## Next Tasks
1. Add smart AI-powered search using GPT-5.2
2. Implement product recommendations engine
3. Add GLTF model loading for real product models
4. Build social sharing with OG image generation
5. Add advanced 3D controls (zoom, pan, orbit with touch)
