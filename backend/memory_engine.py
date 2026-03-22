"""
AETHERIS SPATIAL — Memory Architecture
Persistent user preference modeling, design history embeddings, spatial context memory.
"""
from datetime import datetime, timezone
import math

class MemoryEngine:
    """Computes and maintains spatial memory profiles for users."""

    def __init__(self, db):
        self.db = db

    async def compute_user_profile(self, user_id: str) -> dict:
        """Build a comprehensive memory profile from user's history."""
        designs = await self.db.designs.find({"user_id": user_id}, {"_id": 0}).to_list(200)
        chats = await self.db.chat_history.find({"user_id": user_id}, {"_id": 0}).to_list(200)
        views = await self.db.tracking.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).to_list(500)
        user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})

        # ─── Material Affinity ───
        material_counts = {}
        for d in designs:
            mat = d.get("configuration", {}).get("material")
            if mat:
                material_counts[mat] = material_counts.get(mat, 0) + 1

        # ─── Color Preferences ───
        color_counts = {}
        for d in designs:
            col = d.get("configuration", {}).get("color") or d.get("configuration", {}).get("colorName")
            if col:
                color_counts[col] = color_counts.get(col, 0) + 1

        # ─── Shape Preferences ───
        shape_counts = {}
        for d in designs:
            shape = d.get("configuration", {}).get("shape")
            if shape:
                shape_counts[shape] = shape_counts.get(shape, 0) + 1

        # ─── Category Affinity from Views ───
        viewed_products = {}
        for v in views:
            pid = v.get("product_id")
            if pid:
                viewed_products[pid] = viewed_products.get(pid, 0) + 1
        # Resolve categories
        category_counts = {}
        if viewed_products:
            products = await self.db.products.find(
                {"product_id": {"$in": list(viewed_products.keys())}},
                {"_id": 0, "product_id": 1, "category": 1}
            ).to_list(100)
            for p in products:
                cat = p.get("category")
                if cat:
                    category_counts[cat] = category_counts.get(cat, 0) + viewed_products.get(p["product_id"], 0)

        # ─── AI Interaction Patterns ───
        ai_topics = []
        action_types = {}
        for c in chats:
            payload = c.get("action_payload")
            if payload:
                action = payload.get("action")
                if action:
                    action_types[action] = action_types.get(action, 0) + 1
            # Extract first 50 chars of user messages as topic hints
            msg = c.get("user_message", "")[:80]
            if msg:
                ai_topics.append(msg)

        # ─── Engagement Metrics ───
        total_designs = len(designs)
        total_chats = len(chats)
        total_views = len(views)
        avg_design_version = sum(d.get("version", 1) for d in designs) / max(total_designs, 1)

        # ─── Temporal Patterns ───
        session_context = await self.db.spatial_memory.find_one(
            {"user_id": user_id, "type": "session_context"},
            {"_id": 0}
        )

        return {
            "user_id": user_id,
            "material_affinity": self._rank(material_counts),
            "color_preferences": self._rank(color_counts),
            "shape_preferences": self._rank(shape_counts),
            "category_interests": self._rank(category_counts),
            "ai_action_patterns": self._rank(action_types),
            "recent_ai_topics": ai_topics[-10:],
            "engagement": {
                "total_designs": total_designs,
                "total_ai_chats": total_chats,
                "total_product_views": total_views,
                "avg_design_iterations": round(avg_design_version, 1),
                "exploration_breadth": len(set(viewed_products.keys())),
            },
            "session_context": session_context.get("context", {}) if session_context else {},
            "explicit_preferences": user.get("preferences", {}) if user else {},
            "computed_at": datetime.now(timezone.utc).isoformat()
        }

    async def store_session_context(self, user_id: str, context: dict):
        """Store or update session-level spatial context memory."""
        await self.db.spatial_memory.update_one(
            {"user_id": user_id, "type": "session_context"},
            {"$set": {
                "user_id": user_id,
                "type": "session_context",
                "context": context,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )

    async def record_interaction(self, user_id: str, interaction_type: str, metadata: dict):
        """Record a user interaction for memory building."""
        await self.db.spatial_memory.insert_one({
            "user_id": user_id,
            "type": "interaction",
            "interaction_type": interaction_type,
            "metadata": metadata,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    async def get_ai_context_prompt(self, user_id: str) -> str:
        """Generate a personalization prompt segment from user memory."""
        profile = await self.compute_user_profile(user_id)
        parts = ["\n\nUSER SPATIAL MEMORY:"]

        if profile["material_affinity"]:
            top = profile["material_affinity"][:3]
            parts.append(f"Preferred materials: {', '.join(t['item'] for t in top)}")
        if profile["color_preferences"]:
            top = profile["color_preferences"][:3]
            parts.append(f"Color preferences: {', '.join(t['item'] for t in top)}")
        if profile["shape_preferences"]:
            top = profile["shape_preferences"][:2]
            parts.append(f"Shape affinity: {', '.join(t['item'] for t in top)}")
        if profile["category_interests"]:
            top = profile["category_interests"][:2]
            parts.append(f"Category interests: {', '.join(t['item'] for t in top)}")
        if profile["ai_action_patterns"]:
            top = profile["ai_action_patterns"][:2]
            parts.append(f"Preferred actions: {', '.join(t['item'] for t in top)}")

        eng = profile["engagement"]
        parts.append(f"Engagement: {eng['total_designs']} designs, {eng['total_ai_chats']} AI chats, {eng['avg_design_iterations']} avg iterations")

        ctx = profile.get("session_context", {})
        if ctx:
            parts.append(f"Current session context: {ctx}")

        return "\n".join(parts) if len(parts) > 1 else ""

    @staticmethod
    def _rank(counts: dict) -> list:
        """Rank items by count, return sorted list of {item, count, weight}."""
        total = sum(counts.values()) or 1
        ranked = [
            {"item": k, "count": v, "weight": round(v / total, 3)}
            for k, v in counts.items()
        ]
        return sorted(ranked, key=lambda x: x["count"], reverse=True)

    async def compute_similarity(self, user_id: str, product: dict) -> float:
        """Compute a similarity score between user preferences and a product."""
        profile = await self.compute_user_profile(user_id)
        score = 0.0

        # Material overlap
        user_mats = {m["item"] for m in profile.get("material_affinity", [])}
        prod_mats = set(product.get("materials", []))
        if user_mats and prod_mats:
            overlap = len(user_mats & prod_mats) / max(len(user_mats | prod_mats), 1)
            score += overlap * 30

        # Category match
        user_cats = {c["item"] for c in profile.get("category_interests", [])}
        if product.get("category") in user_cats:
            score += 25

        # Sustainability alignment (higher-scoring users get pushed towards greener products)
        sus_score = product.get("sustainability_score", 0)
        score += (sus_score / 100) * 20

        # Color preference overlap
        user_colors = {c["item"] for c in profile.get("color_preferences", [])}
        prod_colors = set(product.get("colors", []))
        if user_colors and prod_colors:
            overlap = len(user_colors & prod_colors) / max(len(user_colors | prod_colors), 1)
            score += overlap * 15

        # Novelty bonus (products user hasn't seen much)
        eng = profile.get("engagement", {})
        breadth = eng.get("exploration_breadth", 0)
        if breadth < 3:
            score += 10  # Encourage exploration for new users

        return min(round(score, 1), 100)
