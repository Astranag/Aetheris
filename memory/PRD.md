# Aetheris Spatial — Product Requirements Document

## Original Problem Statement
AI-Native 3D Marketplace blending immersive UI, AI-driven personalization, and real-time 3D product previews. Key features: Discovery Hub, Creator Studio, Product Detail Page, Design Vault, Account/Settings, Admin Control Nexus with Dimensional Console.

## Core Architecture
- **Frontend**: React 19, Tailwind CSS, Framer Motion, Vanilla Three.js (no @react-three/fiber), Recharts, Phosphor Icons
- **Backend**: FastAPI, Motor (async MongoDB)
- **AI**: GPT-5.2 via Emergent LLM Key
- **Auth**: Emergent Google Auth
- **Storage**: Emergent Object Storage
- **Design**: Dark futuristic spatial computing aesthetic

## Implemented Features

### Phase 1 — Core Platform (DONE)
- React + FastAPI + MongoDB boilerplate
- Vanilla Three.js 3D viewer (Scene3D.js)
- Product catalog with seed data (6 products)
- Discovery Hub with search/filter/sort
- Product Detail page
- Creator Studio with AI Co-Designer (GPT-5.2)
- Design Vault with versioning and collections
- User Settings and Preferences
- Emergent Google Auth integration
- Object Storage for file uploads

### Phase 2 — Legal, A11y & Quality (DONE)
- WCAG 2.2 AA accessibility layer
- GDPR compliance (cookie consent, data export, erasure)
- Privacy Policy and Terms of Service pages
- Security headers (OWASP)
- Rate limiting (general + AI endpoints)
- Input sanitization

### Phase 3 — Spatial Intelligence Protocol (DONE)
- Multi-agent AI routing (Design/Material/Style/Spatial/Generative)
- Structured JSON action payloads from AI
- Product recommendations engine (stub)
- Public Spatial Intelligence API
- Aetheris Ontology system

### Phase 4 — Admin Control Nexus (DONE - March 22, 2026)
- Admin auth with JWT (hardcoded admin: meta360d@gmail.com)
- **Panel 1**: System Overview & Health Monitor (CPU, Memory, Disk, DB metrics, stat cards, ontology summary)
- **Panel 2**: User Intelligence Matrix (user engagement bar charts, user table with design/chat counts)
- **Panel 3**: Design & Product Management (category pie chart, full designs table)
- **Panel 4**: AI Agent Control Center (5 agent mode status, conversation flow area chart, chat log with action payloads)
- **Panel 5**: Spatial Intelligence Analytics (shapes, materials, colors, dimensional extensions, sustainability vectors, constraint framework)
- **Panel 6**: Security & Compliance (GDPR/CCPA/WCAG/Cookie compliance status, security headers, rate limits, admin login history, active sessions)
- **Hidden Dimensional Console**: Super-Admin ontology editor (Ctrl+Shift+D), live add/remove shapes/materials/colors/extensions

## Pending / In Progress

### P1 — Voice Input for Spatial Commands (NOT STARTED)
- Web Speech API integration in Creator Studio
- Route voice commands to AI Co-Designer

### P1 — Product Recommendations Engine (IN PROGRESS)
- Backend stubs exist, frontend Discovery Hub integration pending

### P1 — N-Dimensional Visualization (NOT STARTED)
- Parameter space exploration for design variants

## Future / Backlog
- P2: Public API payload format for Figma/AR tools
- P2: Design Marketplace (publish/sell configurations)
- P2: Compliance Dashboard in user settings (GDPR self-service)

## Key Technical Notes
- **DO NOT** use @react-three/fiber or multiple <Canvas> elements — causes crashes
- Admin credentials: meta360d@gmail.com / Adimnaetheris
- All 3D rendering via Vanilla Three.js in Scene3D.js
- Recharts for admin dashboard analytics charts
