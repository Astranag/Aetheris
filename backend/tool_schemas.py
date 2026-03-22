"""
AETHERIS SPATIAL — Tool Schemas & Function-Calling Templates
Formal JSON schemas for spatial intelligence payloads + structured function definitions.
"""

# ─────────── TOOL SCHEMAS ───────────
# These define the exact shape of every payload in the Aetheris spatial API

SPATIAL_ACTION_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "AetherisSpatialAction",
    "description": "An action payload from the AI Co-Designer or external tools",
    "type": "object",
    "required": ["action", "target", "parameters"],
    "properties": {
        "action": {
            "type": "string",
            "enum": ["modify", "generate", "optimize", "analyze", "morph", "compose"],
            "description": "The type of spatial operation"
        },
        "target": {
            "type": "string",
            "enum": ["shape", "material", "color", "layout", "environment", "concept", "dimension"],
            "description": "What aspect of the design to act upon"
        },
        "parameters": {
            "type": "object",
            "properties": {
                "shape": {"type": "string", "description": "Target geometry primitive"},
                "color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$", "description": "Hex color value"},
                "colorName": {"type": "string", "description": "Human-readable color name"},
                "material": {"type": "string", "description": "Material identifier"},
                "scale": {"type": "array", "items": {"type": "number"}, "minItems": 3, "maxItems": 3, "description": "[x, y, z] scale factors"},
                "rotation": {"type": "array", "items": {"type": "number"}, "minItems": 3, "maxItems": 3, "description": "[x, y, z] rotation in degrees"},
                "position": {"type": "array", "items": {"type": "number"}, "minItems": 3, "maxItems": 3, "description": "[x, y, z] position"},
                "notes": {"type": "string", "description": "Agent reasoning or explanation"}
            }
        },
        "dimensional_context": {
            "type": "object",
            "description": "N-dimensional parameter state",
            "properties": {
                "dimensions": {"type": "integer", "minimum": 1, "maximum": 12},
                "parameter_vector": {"type": "array", "items": {"type": "number"}},
                "constraint_satisfaction": {"type": "number", "minimum": 0, "maximum": 1}
            }
        }
    }
}

MATERIAL_SPEC_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "AetherisMaterialSpec",
    "description": "Material specification with sustainability vectors",
    "type": "object",
    "required": ["name", "category"],
    "properties": {
        "name": {"type": "string"},
        "category": {"type": "string", "enum": ["organic", "recycled", "synthetic", "composite", "smart"]},
        "sustainability": {
            "type": "object",
            "properties": {
                "eco_score": {"type": "integer", "minimum": 0, "maximum": 100},
                "recyclability": {"type": "number", "minimum": 0, "maximum": 1},
                "carbon_kg_co2e": {"type": "number"},
                "origin": {"type": "string"},
                "lifespan_years": {"type": "number"}
            }
        },
        "physical": {
            "type": "object",
            "properties": {
                "density_kg_m3": {"type": "number"},
                "tensile_strength_mpa": {"type": "number"},
                "texture": {"type": "string"},
                "finish": {"type": "string", "enum": ["matte", "satin", "gloss", "raw", "brushed"]}
            }
        }
    }
}

DIMENSIONAL_STATE_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "AetherisDimensionalState",
    "description": "N-dimensional design state for parameter space exploration",
    "type": "object",
    "required": ["dimensions", "parameters"],
    "properties": {
        "dimensions": {"type": "integer", "minimum": 1, "maximum": 12},
        "parameters": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["name", "value", "range"],
                "properties": {
                    "name": {"type": "string"},
                    "value": {"type": "number"},
                    "range": {"type": "array", "items": {"type": "number"}, "minItems": 2, "maxItems": 2},
                    "unit": {"type": "string"},
                    "step": {"type": "number"}
                }
            }
        },
        "constraints": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["min", "max", "equal", "range", "dependency"]},
                    "parameter": {"type": "string"},
                    "value": {},
                    "depends_on": {"type": "string"}
                }
            }
        },
        "topology": {
            "type": "string",
            "enum": ["euclidean", "spherical", "toroidal", "hyperbolic"],
            "default": "euclidean"
        }
    }
}

DSL_EXPRESSION_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "AetherisGeometryDSL",
    "description": "Generative Geometry DSL expression",
    "type": "object",
    "required": ["expression"],
    "properties": {
        "expression": {"type": "string", "description": "DSL expression string"},
        "context": {
            "type": "object",
            "properties": {
                "variables": {"type": "object", "additionalProperties": {"type": "number"}},
                "seed": {"type": "integer"},
                "resolution": {"type": "integer", "minimum": 4, "maximum": 128}
            }
        }
    }
}


# ─────────── FUNCTION-CALLING TEMPLATES ───────────
# Structured function definitions for AI agents to execute spatial transforms

SPATIAL_FUNCTIONS = [
    {
        "name": "modify_shape",
        "description": "Change the geometric form of the current object. Accepts any valid shape primitive from the ontology.",
        "agent_modes": ["Design Agent", "Generative Agent"],
        "parameters": {
            "type": "object",
            "required": ["shape"],
            "properties": {
                "shape": {"type": "string", "enum": ["desk", "chair", "panel", "hexagon", "pod", "cylinder"]},
                "scale": {"type": "array", "items": {"type": "number"}, "default": [1, 1, 1]},
                "smooth": {"type": "boolean", "default": False, "description": "Apply subdivision smoothing"}
            }
        },
        "returns": {"type": "object", "properties": {"shape": {"type": "string"}, "vertices": {"type": "integer"}, "bounds": {"type": "array"}}}
    },
    {
        "name": "apply_material",
        "description": "Set or change the material of the current object. Includes sustainability impact calculation.",
        "agent_modes": ["Material Agent", "Design Agent"],
        "parameters": {
            "type": "object",
            "required": ["material"],
            "properties": {
                "material": {"type": "string"},
                "finish": {"type": "string", "enum": ["matte", "satin", "gloss", "raw", "brushed"], "default": "matte"},
                "opacity": {"type": "number", "minimum": 0, "maximum": 1, "default": 1}
            }
        },
        "returns": {"type": "object", "properties": {"material": {"type": "string"}, "eco_delta": {"type": "number"}}}
    },
    {
        "name": "set_color",
        "description": "Apply a color to the current object. Validates against the Aetheris color palette.",
        "agent_modes": ["Style Agent", "Design Agent"],
        "parameters": {
            "type": "object",
            "required": ["color"],
            "properties": {
                "color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
                "colorName": {"type": "string"},
                "gradient": {"type": "boolean", "default": False},
                "gradient_target": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"}
            }
        },
        "returns": {"type": "object", "properties": {"color": {"type": "string"}, "colorName": {"type": "string"}}}
    },
    {
        "name": "morph_geometry",
        "description": "Smoothly interpolate between two geometric states. Used for dimensional transitions and generative exploration.",
        "agent_modes": ["Generative Agent", "Spatial Agent"],
        "parameters": {
            "type": "object",
            "required": ["from_state", "to_state", "t"],
            "properties": {
                "from_state": {"type": "string", "description": "Source shape or DSL expression"},
                "to_state": {"type": "string", "description": "Target shape or DSL expression"},
                "t": {"type": "number", "minimum": 0, "maximum": 1, "description": "Interpolation factor"},
                "easing": {"type": "string", "enum": ["linear", "ease_in", "ease_out", "ease_in_out"], "default": "ease_in_out"}
            }
        },
        "returns": {"type": "object", "properties": {"interpolated_state": {"type": "object"}, "constraint_violations": {"type": "array"}}}
    },
    {
        "name": "generate_variant",
        "description": "Generate a new design variant by exploring the n-dimensional parameter space around the current configuration.",
        "agent_modes": ["Generative Agent"],
        "parameters": {
            "type": "object",
            "required": ["base_config", "exploration_radius"],
            "properties": {
                "base_config": {"type": "object", "description": "Current design configuration"},
                "exploration_radius": {"type": "number", "minimum": 0.01, "maximum": 1.0, "description": "How far to explore from base (0=identical, 1=maximal change)"},
                "dimensions_to_vary": {"type": "array", "items": {"type": "string"}, "description": "Which parameters to vary"},
                "count": {"type": "integer", "minimum": 1, "maximum": 8, "default": 3}
            }
        },
        "returns": {"type": "object", "properties": {"variants": {"type": "array"}, "parameter_deltas": {"type": "array"}}}
    },
    {
        "name": "optimize_layout",
        "description": "Run constraint-satisfaction optimization on spatial arrangement. Considers ergonomics, flow, and sustainability.",
        "agent_modes": ["Spatial Agent"],
        "parameters": {
            "type": "object",
            "required": ["objects", "room_dimensions"],
            "properties": {
                "objects": {"type": "array", "items": {"type": "object"}},
                "room_dimensions": {"type": "array", "items": {"type": "number"}, "minItems": 3, "maxItems": 3},
                "optimize_for": {"type": "array", "items": {"type": "string", "enum": ["ergonomics", "flow", "sustainability", "aesthetics", "density"]}, "default": ["ergonomics", "flow"]},
                "constraints": {"type": "array", "items": {"type": "object"}}
            }
        },
        "returns": {"type": "object", "properties": {"layout": {"type": "array"}, "score": {"type": "number"}, "violations": {"type": "array"}}}
    },
    {
        "name": "analyze_sustainability",
        "description": "Compute comprehensive sustainability metrics for a design configuration.",
        "agent_modes": ["Material Agent", "Design Agent"],
        "parameters": {
            "type": "object",
            "required": ["configuration"],
            "properties": {
                "configuration": {"type": "object"},
                "include_lifecycle": {"type": "boolean", "default": True},
                "include_alternatives": {"type": "boolean", "default": True}
            }
        },
        "returns": {"type": "object", "properties": {"eco_score": {"type": "integer"}, "carbon_kg": {"type": "number"}, "alternatives": {"type": "array"}}}
    },
    {
        "name": "evaluate_dsl",
        "description": "Parse and evaluate a Generative Geometry DSL expression to produce a 3D transform sequence.",
        "agent_modes": ["Generative Agent", "Design Agent"],
        "parameters": {
            "type": "object",
            "required": ["expression"],
            "properties": {
                "expression": {"type": "string", "description": "DSL expression (e.g. 'SHAPE(cube) >> SCALE(1,2,1) >> FILLET(0.1)')"},
                "variables": {"type": "object", "additionalProperties": {"type": "number"}}
            }
        },
        "returns": {"type": "object", "properties": {"transforms": {"type": "array"}, "final_state": {"type": "object"}}}
    }
]

def get_all_schemas():
    """Return all tool schemas for the public API."""
    return {
        "version": "1.0.0",
        "schemas": {
            "spatial_action": SPATIAL_ACTION_SCHEMA,
            "material_spec": MATERIAL_SPEC_SCHEMA,
            "dimensional_state": DIMENSIONAL_STATE_SCHEMA,
            "dsl_expression": DSL_EXPRESSION_SCHEMA,
        },
        "functions": SPATIAL_FUNCTIONS,
        "ontology_reference": {
            "shapes": ["desk", "chair", "panel", "hexagon", "pod", "cylinder"],
            "materials": ["Bamboo Composite", "Recycled Aluminum", "Bio-Resin", "Cork", "Tempered Glass", "Carbon Fiber", "Mycelium Biofoam"],
            "actions": ["modify", "generate", "optimize", "analyze", "morph", "compose"],
            "targets": ["shape", "material", "color", "layout", "environment", "concept", "dimension"],
        }
    }

def validate_action_payload(payload: dict) -> dict:
    """Validate an action payload against the schema. Returns {valid, errors}."""
    errors = []
    if not isinstance(payload, dict):
        return {"valid": False, "errors": ["Payload must be a JSON object"]}

    # Required fields
    for field in ["action", "target", "parameters"]:
        if field not in payload:
            errors.append(f"Missing required field: {field}")

    if "action" in payload:
        valid_actions = SPATIAL_ACTION_SCHEMA["properties"]["action"]["enum"]
        if payload["action"] not in valid_actions:
            errors.append(f"Invalid action '{payload['action']}'. Must be one of: {valid_actions}")

    if "target" in payload:
        valid_targets = SPATIAL_ACTION_SCHEMA["properties"]["target"]["enum"]
        if payload["target"] not in valid_targets:
            errors.append(f"Invalid target '{payload['target']}'. Must be one of: {valid_targets}")

    if "parameters" in payload:
        params = payload["parameters"]
        if not isinstance(params, dict):
            errors.append("parameters must be a JSON object")
        else:
            color = params.get("color")
            if color and not (isinstance(color, str) and len(color) == 7 and color[0] == '#'):
                errors.append(f"Invalid color format: {color}. Must be #RRGGBB hex.")

    return {"valid": len(errors) == 0, "errors": errors}
