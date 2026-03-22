"""
AETHERIS SPATIAL — Agent Evaluation Tests
Automated test suite to validate AI agent responses, action payload correctness,
and spatial reasoning quality.
"""
import json
import re
from tool_schemas import validate_action_payload, SPATIAL_FUNCTIONS
from spatial_dsl import evaluate_dsl, DSLError


def run_all_tests() -> dict:
    """Run all agent evaluation tests and return results."""
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "tests": []
    }

    test_suites = [
        test_action_payload_validation,
        test_spatial_response_format,
        test_dsl_parser,
        test_function_schema_completeness,
        test_ontology_coverage,
        test_dimensional_reasoning,
    ]

    for suite in test_suites:
        suite_results = suite()
        for t in suite_results:
            results["tests"].append(t)
            results["total"] += 1
            if t["passed"]:
                results["passed"] += 1
            else:
                results["failed"] += 1

    results["pass_rate"] = round(results["passed"] / max(results["total"], 1) * 100, 1)
    return results


def test_action_payload_validation():
    """Test that action payload validation catches all error cases."""
    tests = []

    # Valid payload
    valid = {"action": "modify", "target": "shape", "parameters": {"shape": "desk", "color": "#00F0FF"}}
    result = validate_action_payload(valid)
    tests.append({"name": "Valid action payload passes validation", "passed": result["valid"], "detail": str(result)})

    # Missing action
    bad1 = {"target": "shape", "parameters": {}}
    result = validate_action_payload(bad1)
    tests.append({"name": "Missing action field detected", "passed": not result["valid"], "detail": str(result)})

    # Invalid action value
    bad2 = {"action": "destroy", "target": "shape", "parameters": {}}
    result = validate_action_payload(bad2)
    tests.append({"name": "Invalid action value detected", "passed": not result["valid"], "detail": str(result)})

    # Invalid target value
    bad3 = {"action": "modify", "target": "universe", "parameters": {}}
    result = validate_action_payload(bad3)
    tests.append({"name": "Invalid target value detected", "passed": not result["valid"], "detail": str(result)})

    # Invalid color format
    bad4 = {"action": "modify", "target": "color", "parameters": {"color": "red"}}
    result = validate_action_payload(bad4)
    tests.append({"name": "Invalid color format detected", "passed": not result["valid"], "detail": str(result)})

    # Valid with all new actions (morph, compose)
    for action in ["morph", "compose", "analyze", "generate", "optimize"]:
        payload = {"action": action, "target": "shape", "parameters": {"notes": f"test {action}"}}
        result = validate_action_payload(payload)
        tests.append({"name": f"Action '{action}' accepted", "passed": result["valid"], "detail": str(result)})

    # Valid with all targets
    for target in ["shape", "material", "color", "layout", "environment", "concept", "dimension"]:
        payload = {"action": "modify", "target": target, "parameters": {}}
        result = validate_action_payload(payload)
        tests.append({"name": f"Target '{target}' accepted", "passed": result["valid"], "detail": str(result)})

    return tests


def test_spatial_response_format():
    """Test that spatial AI response parsing handles all expected formats."""
    tests = []

    # Standard format with json block
    response1 = """[INTERPRETATION]
User wants a cyan desk.

[MODE]
Design Agent + Style Agent

[REASONING]
Applying neon cyan to the desk shape.

[TRANSFORMS]
1. Set color to Neon Cyan (#00F0FF)

[VARIANTS]
MINIMAL: Simple cyan application
BOLD: Gradient cyan-to-magenta
EXPERIMENTAL: Procedural color noise

[ACTION]
```json
{"action": "modify", "target": "color", "parameters": {"color": "#00F0FF", "colorName": "Neon Cyan", "shape": "desk"}}
```"""

    # Try to parse the JSON from the response
    parsed = None
    try:
        if '```json' in response1:
            json_block = response1.split('```json')[1].split('```')[0].strip()
            parsed = json.loads(json_block)
    except Exception:
        pass

    tests.append({
        "name": "Standard response format parses correctly",
        "passed": parsed is not None and parsed.get("action") == "modify",
        "detail": str(parsed)
    })

    # Validate the parsed payload
    if parsed:
        result = validate_action_payload(parsed)
        tests.append({"name": "Parsed payload validates", "passed": result["valid"], "detail": str(result)})

    # Test all required sections exist
    required_sections = ["[INTERPRETATION]", "[MODE]", "[REASONING]", "[TRANSFORMS]", "[VARIANTS]", "[ACTION]"]
    for section in required_sections:
        tests.append({
            "name": f"Response contains {section}",
            "passed": section in response1,
            "detail": f"Found: {section in response1}"
        })

    return tests


def test_dsl_parser():
    """Test the Generative Geometry DSL parser."""
    tests = []

    # Basic shape
    result = evaluate_dsl("SHAPE(cube)")
    tests.append({
        "name": "DSL: Basic shape parsing",
        "passed": result["final_state"]["shape"] == "cube" and len(result["transforms"]) == 1,
        "detail": str(result["final_state"]["shape"])
    })

    # Pipeline
    result = evaluate_dsl("SHAPE(sphere) >> SCALE(2, 2, 2) >> COLOR(#FF0055)")
    tests.append({
        "name": "DSL: Pipeline parsing",
        "passed": len(result["transforms"]) == 3 and result["final_state"]["color"] == "#FF0055",
        "detail": f"Transforms: {len(result['transforms'])}, color: {result['final_state']['color']}"
    })

    # Complex expression
    result = evaluate_dsl("SHAPE(cylinder) >> EXTRUDE(z, 3.0) >> FILLET(0.2) >> TWIST(y, 45) >> MATERIAL(Carbon Fiber)")
    tests.append({
        "name": "DSL: Complex expression",
        "passed": len(result["transforms"]) == 5 and result["final_state"]["material"] == "Carbon Fiber",
        "detail": f"Transforms: {len(result['transforms'])}"
    })

    # Boolean operations
    result = evaluate_dsl("SHAPE(cube) >> BOOLEAN(subtract, SHAPE(sphere))")
    tests.append({
        "name": "DSL: Boolean operation",
        "passed": any(t["op"] == "boolean" for t in result["transforms"]),
        "detail": str([t for t in result["transforms"] if t["op"] == "boolean"])
    })

    # Array operation
    result = evaluate_dsl("SHAPE(hexprism) >> ARRAY(x, 5, 1.5)")
    tests.append({
        "name": "DSL: Array operation",
        "passed": any(t.get("count") == 5 for t in result["transforms"]),
        "detail": str(result["transforms"])
    })

    # Variables
    result = evaluate_dsl("SHAPE(cube) >> SCALE($w, $h, $d)", variables={"w": 2, "h": 3, "d": 1})
    tests.append({
        "name": "DSL: Variable substitution",
        "passed": result["final_state"]["scale"] == [2.0, 3.0, 1.0],
        "detail": str(result["final_state"]["scale"])
    })

    # Dimensional state
    result = evaluate_dsl("SHAPE(cube) >> DIM(4, 1.0:0.5:0.3:0.8)")
    dim = result["final_state"]["dimensional_state"]
    tests.append({
        "name": "DSL: Dimensional state",
        "passed": dim is not None and dim["dimensions"] == 4 and len(dim["parameter_vector"]) == 4,
        "detail": str(dim)
    })

    # Error handling - invalid shape
    try:
        evaluate_dsl("SHAPE(banana)")
        tests.append({"name": "DSL: Invalid shape error", "passed": False, "detail": "Should have raised DSLError"})
    except DSLError:
        tests.append({"name": "DSL: Invalid shape error", "passed": True, "detail": "DSLError raised correctly"})

    # Error handling - empty expression
    try:
        evaluate_dsl("")
        tests.append({"name": "DSL: Empty expression error", "passed": False, "detail": "Should have raised DSLError"})
    except DSLError:
        tests.append({"name": "DSL: Empty expression error", "passed": True, "detail": "DSLError raised correctly"})

    # Error handling - invalid function
    try:
        evaluate_dsl("EXPLODE(cube)")
        tests.append({"name": "DSL: Unknown function error", "passed": False, "detail": "Should have raised DSLError"})
    except DSLError:
        tests.append({"name": "DSL: Unknown function error", "passed": True, "detail": "DSLError raised correctly"})

    return tests


def test_function_schema_completeness():
    """Test that all function-calling templates are well-formed."""
    tests = []

    required_fields = ["name", "description", "agent_modes", "parameters", "returns"]
    for func in SPATIAL_FUNCTIONS:
        for field in required_fields:
            tests.append({
                "name": f"Function '{func['name']}' has '{field}'",
                "passed": field in func,
                "detail": str(field in func)
            })

        # Check parameters has type and properties
        params = func.get("parameters", {})
        tests.append({
            "name": f"Function '{func['name']}' params well-formed",
            "passed": params.get("type") == "object" and "properties" in params,
            "detail": str(list(params.get("properties", {}).keys()))
        })

    return tests


def test_ontology_coverage():
    """Test that schemas cover the full Aetheris ontology."""
    tests = []
    from tool_schemas import get_all_schemas
    schemas = get_all_schemas()
    ref = schemas["ontology_reference"]

    tests.append({
        "name": "Ontology has shapes",
        "passed": len(ref["shapes"]) >= 6,
        "detail": str(ref["shapes"])
    })
    tests.append({
        "name": "Ontology has materials",
        "passed": len(ref["materials"]) >= 7,
        "detail": str(ref["materials"])
    })
    tests.append({
        "name": "Ontology has actions",
        "passed": len(ref["actions"]) >= 4,
        "detail": str(ref["actions"])
    })
    tests.append({
        "name": "Ontology has targets",
        "passed": len(ref["targets"]) >= 6,
        "detail": str(ref["targets"])
    })

    # All shapes in DSL parser
    from spatial_dsl import DSLParser
    for shape in ref["shapes"]:
        tests.append({
            "name": f"Shape '{shape}' in DSL parser",
            "passed": shape in DSLParser.VALID_SHAPES,
            "detail": str(shape in DSLParser.VALID_SHAPES)
        })

    return tests


def test_dimensional_reasoning():
    """Test dimensional state transitions and constraints."""
    tests = []

    # 1D to 3D progression
    for dim in [1, 2, 3, 4]:
        expr = f"SHAPE(cube) >> DIM({dim}, {':'.join(['0.5'] * dim)})"
        result = evaluate_dsl(expr)
        state = result["final_state"]["dimensional_state"]
        tests.append({
            "name": f"Dimensional state D={dim}",
            "passed": state["dimensions"] == dim and len(state["parameter_vector"]) == dim,
            "detail": str(state)
        })

    # Compose multi-step transform chain
    expr = "SHAPE(cube) >> SCALE(2,1,1) >> ROTATE(0,45,0) >> TRANSLATE(1,0,0) >> FILLET(0.05) >> COLOR(#00F0FF) >> MATERIAL(Bamboo Composite)"
    result = evaluate_dsl(expr)
    tests.append({
        "name": "Full transform chain (7 operations)",
        "passed": result["transform_count"] == 7,
        "detail": f"Count: {result['transform_count']}"
    })

    # Verify state accumulates correctly
    tests.append({
        "name": "Scale accumulates",
        "passed": result["final_state"]["scale"] == [2.0, 1.0, 1.0],
        "detail": str(result["final_state"]["scale"])
    })
    tests.append({
        "name": "Color applied",
        "passed": result["final_state"]["color"] == "#00F0FF",
        "detail": str(result["final_state"]["color"])
    })

    return tests


if __name__ == "__main__":
    results = run_all_tests()
    print(f"\n{'='*60}")
    print(f"AETHERIS Agent Evaluation: {results['passed']}/{results['total']} passed ({results['pass_rate']}%)")
    print(f"{'='*60}\n")
    for t in results["tests"]:
        status = "PASS" if t["passed"] else "FAIL"
        print(f"  [{status}] {t['name']}")
        if not t["passed"]:
            print(f"         Detail: {t['detail']}")
    print()
