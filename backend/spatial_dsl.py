"""
AETHERIS SPATIAL — Generative Geometry DSL
A domain-specific language for describing and generating multi-dimensional forms.

Grammar:
  expression := operation ('>>' operation)*
  operation  := FUNCTION_NAME '(' args ')'
  args       := arg (',' arg)*
  arg        := STRING | NUMBER | expression

Supported operations:
  SHAPE(name)                — Create a base primitive (cube, sphere, cylinder, torus, plane, hexprism)
  SCALE(x, y, z)             — Scale transform
  ROTATE(x, y, z)            — Rotate in degrees
  TRANSLATE(x, y, z)         — Move position
  EXTRUDE(axis, amount)      — Extrude along axis
  FILLET(radius)             — Round edges
  BOOLEAN(op, SHAPE(name))   — Boolean operation (union, subtract, intersect)
  MIRROR(axis)               — Mirror across axis
  ARRAY(axis, count, spacing) — Linear array
  TWIST(axis, angle)         — Twist deformation
  TAPER(axis, factor)        — Taper deformation
  NOISE(amplitude, frequency) — Procedural noise displacement
  COLOR(hex)                 — Apply color
  MATERIAL(name)             — Apply material
  DIM(n, param_vector)       — Set dimensional parameter state
"""
import re
import math
import random


class DSLError(Exception):
    pass


class DSLParser:
    """Parses and evaluates Aetheris Geometry DSL expressions."""

    VALID_SHAPES = {"cube", "sphere", "cylinder", "torus", "plane", "hexprism", "cone", "desk", "chair", "panel", "hexagon", "pod"}
    VALID_AXES = {"x", "y", "z"}
    VALID_BOOLEAN_OPS = {"union", "subtract", "intersect"}

    def __init__(self, variables=None, seed=None):
        self.variables = variables or {}
        self.rng = random.Random(seed) if seed is not None else random.Random()
        self.transforms = []
        self.state = {
            "shape": None,
            "position": [0, 0, 0],
            "rotation": [0, 0, 0],
            "scale": [1, 1, 1],
            "color": None,
            "material": None,
            "modifiers": [],
            "children": [],
            "dimensional_state": None
        }

    def parse(self, expression: str) -> dict:
        """Parse a DSL expression string into a transform sequence."""
        expression = expression.strip()
        if not expression:
            raise DSLError("Empty expression")

        # Split by '>>' operator (pipeline)
        operations = [op.strip() for op in re.split(r'\s*>>\s*', expression)]
        self.transforms = []

        for op_str in operations:
            self._parse_operation(op_str)

        return {
            "expression": expression,
            "transforms": self.transforms,
            "final_state": dict(self.state),
            "transform_count": len(self.transforms)
        }

    def _parse_operation(self, op_str: str):
        """Parse a single operation like SHAPE(cube) or SCALE(1,2,1)."""
        match = re.match(r'^(\w+)\s*\((.*)\)\s*$', op_str, re.DOTALL)
        if not match:
            raise DSLError(f"Invalid operation syntax: '{op_str}'. Expected FUNCTION(args)")

        func_name = match.group(1).upper()
        args_str = match.group(2).strip()
        args = self._parse_args(args_str)

        handler = {
            "SHAPE": self._op_shape,
            "SCALE": self._op_scale,
            "ROTATE": self._op_rotate,
            "TRANSLATE": self._op_translate,
            "EXTRUDE": self._op_extrude,
            "FILLET": self._op_fillet,
            "BOOLEAN": self._op_boolean,
            "MIRROR": self._op_mirror,
            "ARRAY": self._op_array,
            "TWIST": self._op_twist,
            "TAPER": self._op_taper,
            "NOISE": self._op_noise,
            "COLOR": self._op_color,
            "MATERIAL": self._op_material,
            "DIM": self._op_dim,
        }.get(func_name)

        if not handler:
            raise DSLError(f"Unknown function: {func_name}. Valid: {', '.join(['SHAPE','SCALE','ROTATE','TRANSLATE','EXTRUDE','FILLET','BOOLEAN','MIRROR','ARRAY','TWIST','TAPER','NOISE','COLOR','MATERIAL','DIM'])}")

        handler(args)

    def _parse_args(self, args_str: str) -> list:
        """Parse comma-separated arguments, handling nested parens."""
        if not args_str:
            return []
        args = []
        depth = 0
        current = ""
        for ch in args_str:
            if ch == '(' :
                depth += 1
                current += ch
            elif ch == ')':
                depth -= 1
                current += ch
            elif ch == ',' and depth == 0:
                args.append(current.strip())
                current = ""
            else:
                current += ch
        if current.strip():
            args.append(current.strip())

        # Convert types
        parsed = []
        for a in args:
            # Check for variable reference
            if a.startswith('$') and a[1:] in self.variables:
                parsed.append(self.variables[a[1:]])
            # Number
            elif re.match(r'^-?\d+\.?\d*$', a):
                parsed.append(float(a) if '.' in a else int(a))
            # Nested expression
            elif '(' in a:
                parsed.append(a)  # Keep as string for nested parsing
            else:
                # String (strip quotes if present)
                parsed.append(a.strip("'\""))
        return parsed

    def _num(self, args, idx, default=0):
        """Safely get a numeric arg."""
        if idx >= len(args):
            return default
        v = args[idx]
        return float(v) if isinstance(v, (int, float)) else default

    def _str(self, args, idx, default=""):
        if idx >= len(args):
            return default
        return str(args[idx])

    # ─── Operation Handlers ───

    def _op_shape(self, args):
        name = self._str(args, 0, "cube").lower()
        if name not in self.VALID_SHAPES:
            raise DSLError(f"Invalid shape: {name}. Valid: {', '.join(sorted(self.VALID_SHAPES))}")
        self.state["shape"] = name
        self.transforms.append({"op": "shape", "shape": name})

    def _op_scale(self, args):
        x, y, z = self._num(args, 0, 1), self._num(args, 1, 1), self._num(args, 2, 1)
        self.state["scale"] = [self.state["scale"][i] * v for i, v in enumerate([x, y, z])]
        self.transforms.append({"op": "scale", "x": x, "y": y, "z": z})

    def _op_rotate(self, args):
        x, y, z = self._num(args, 0), self._num(args, 1), self._num(args, 2)
        self.state["rotation"] = [self.state["rotation"][i] + v for i, v in enumerate([x, y, z])]
        self.transforms.append({"op": "rotate", "x": x, "y": y, "z": z})

    def _op_translate(self, args):
        x, y, z = self._num(args, 0), self._num(args, 1), self._num(args, 2)
        self.state["position"] = [self.state["position"][i] + v for i, v in enumerate([x, y, z])]
        self.transforms.append({"op": "translate", "x": x, "y": y, "z": z})

    def _op_extrude(self, args):
        axis = self._str(args, 0, "z").lower()
        amount = self._num(args, 1, 1)
        if axis not in self.VALID_AXES:
            raise DSLError(f"Invalid axis: {axis}")
        self.transforms.append({"op": "extrude", "axis": axis, "amount": amount})
        self.state["modifiers"].append({"type": "extrude", "axis": axis, "amount": amount})

    def _op_fillet(self, args):
        radius = self._num(args, 0, 0.1)
        self.transforms.append({"op": "fillet", "radius": radius})
        self.state["modifiers"].append({"type": "fillet", "radius": radius})

    def _op_boolean(self, args):
        op = self._str(args, 0, "union").lower()
        if op not in self.VALID_BOOLEAN_OPS:
            raise DSLError(f"Invalid boolean op: {op}. Valid: {', '.join(self.VALID_BOOLEAN_OPS)}")
        operand = self._str(args, 1, "")
        self.transforms.append({"op": "boolean", "boolean_op": op, "operand": operand})
        self.state["children"].append({"boolean_op": op, "operand": operand})

    def _op_mirror(self, args):
        axis = self._str(args, 0, "x").lower()
        if axis not in self.VALID_AXES:
            raise DSLError(f"Invalid axis: {axis}")
        self.transforms.append({"op": "mirror", "axis": axis})
        self.state["modifiers"].append({"type": "mirror", "axis": axis})

    def _op_array(self, args):
        axis = self._str(args, 0, "x").lower()
        count = int(self._num(args, 1, 3))
        spacing = self._num(args, 2, 1.0)
        self.transforms.append({"op": "array", "axis": axis, "count": count, "spacing": spacing})
        self.state["modifiers"].append({"type": "array", "axis": axis, "count": count, "spacing": spacing})

    def _op_twist(self, args):
        axis = self._str(args, 0, "y").lower()
        angle = self._num(args, 1, 45)
        self.transforms.append({"op": "twist", "axis": axis, "angle": angle})
        self.state["modifiers"].append({"type": "twist", "axis": axis, "angle": angle})

    def _op_taper(self, args):
        axis = self._str(args, 0, "y").lower()
        factor = self._num(args, 1, 0.5)
        self.transforms.append({"op": "taper", "axis": axis, "factor": factor})
        self.state["modifiers"].append({"type": "taper", "axis": axis, "factor": factor})

    def _op_noise(self, args):
        amplitude = self._num(args, 0, 0.1)
        frequency = self._num(args, 1, 1.0)
        self.transforms.append({"op": "noise", "amplitude": amplitude, "frequency": frequency})
        self.state["modifiers"].append({"type": "noise", "amplitude": amplitude, "frequency": frequency})

    def _op_color(self, args):
        color = self._str(args, 0, "#00F0FF")
        self.state["color"] = color
        self.transforms.append({"op": "color", "color": color})

    def _op_material(self, args):
        material = self._str(args, 0, "Bamboo Composite")
        self.state["material"] = material
        self.transforms.append({"op": "material", "material": material})

    def _op_dim(self, args):
        n = int(self._num(args, 0, 3))
        param_str = self._str(args, 1, "")
        params = []
        if param_str:
            try:
                params = [float(x.strip()) for x in param_str.split(":")]
            except ValueError:
                params = []
        self.state["dimensional_state"] = {"dimensions": n, "parameter_vector": params}
        self.transforms.append({"op": "dim", "dimensions": n, "parameter_vector": params})


def evaluate_dsl(expression: str, variables=None, seed=None) -> dict:
    """Top-level DSL evaluation function."""
    parser = DSLParser(variables=variables, seed=seed)
    return parser.parse(expression)
