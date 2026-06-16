import fs from "node:fs/promises";
import type { OpenAPIV3 } from "openapi-types";

function transformNullableSchemas(
  spec: OpenAPIV3.Document,
): OpenAPIV3.Document {
  const transform = (obj: unknown): unknown => {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(transform);

    const record = obj as Record<string, unknown>;

    if (
      record.nullable === true &&
      Array.isArray(record.anyOf) &&
      record.anyOf.length === 2
    ) {
      const anyOf = record.anyOf as Array<Record<string, unknown>>;
      const nullType = anyOf.find((item) => item.type === "null");
      const otherType = anyOf.find((item) => item.type !== "null");

      if (nullType && otherType) {
        const { anyOf: _, ...rest } = record;
        return transform({ ...otherType, ...rest, nullable: true });
      }
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      result[key] = transform(value);
    }
    return result;
  };

  return transform(spec) as OpenAPIV3.Document;
}

function transformNullableTypes<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformNullableTypes) as T;
  }

  const record = obj as Record<string, unknown>;

  if (
    Array.isArray(record.type) &&
    record.type.length === 2 &&
    record.type.includes("null")
  ) {
    const actualType = record.type.find((value) => value !== "null");

    if (typeof actualType === "string") {
      const { type: _type, ...rest } = record;

      return {
        ...Object.fromEntries(
          Object.entries(rest).map(([k, v]) => [k, transformNullableTypes(v)]),
        ),
        type: actualType,
        nullable: true,
      } as T;
    }
  }

  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k, transformNullableTypes(v)]),
  ) as T;
}

async function main() {
  const response = await fetch("http://localhost:3333/openapi/json");

  const spec: OpenAPIV3.Document = await response.json();

  let transformed = transformNullableSchemas(spec);

  transformed = transformNullableTypes(transformed);

  await fs.writeFile(
    "./openapi.fixed.json",
    JSON.stringify(transformed, null, 2),
  );

  console.log("OpenAPI transformed successfully");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
