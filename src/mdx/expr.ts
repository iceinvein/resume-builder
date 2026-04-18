import JSON5 from "json5";

// Parses MDX JSX attribute-expression literals (objects, arrays, primitives).
// Safe: data-only; JSON5 does not execute code.
export function parseAttributeExpression(source: string): unknown {
  return JSON5.parse(source);
}
