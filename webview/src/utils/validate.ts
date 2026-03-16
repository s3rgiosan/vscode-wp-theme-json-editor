import Ajv, { type ErrorObject } from "ajv";

/**
 * Validation error mapped to a specific field path.
 */
export interface ValidationError {
  /** Dot-separated path to the invalid field (e.g. "settings.color.custom"). */
  path: string;
  /** Human-readable error message. */
  message: string;
}

let ajvInstance: Ajv | null = null;
let cachedSchema: Record<string, unknown> | null = null;
let cachedValidate: ReturnType<Ajv["compile"]> | null = null;

/**
 * Validate theme.json data against the merged schema.
 * Returns an array of field-level validation errors.
 *
 * Uses a singleton Ajv instance for performance.
 * Caches the compiled validator so `ajvInstance.compile` is only called when the schema changes.
 * Errors are mapped to dot-separated field paths for the UI to display inline.
 */
export function validateThemeJson(
  data: Record<string, unknown>,
  schema: Record<string, unknown>,
): ValidationError[] {
  if (Object.keys(schema).length === 0) {
    return [];
  }

  try {
    if (!ajvInstance) {
      ajvInstance = new Ajv({
        allErrors: true,
        verbose: false,
        strict: false,
      });
    }

    if (schema !== cachedSchema) {
      cachedSchema = schema;
      cachedValidate = ajvInstance.compile(schema);
    }

    const validate = cachedValidate;
    if (!validate) {
      return [];
    }
    validate(data);

    if (!validate.errors) {
      return [];
    }

    return mapErrors(validate.errors);
  } catch (err) {
    console.error("Validation failed:", err);
    return [];
  }
}

/**
 * Map Ajv errors to field-level ValidationErrors.
 */
function mapErrors(errors: ErrorObject[]): ValidationError[] {
  const result: ValidationError[] = [];
  const seen = new Set<string>();

  for (const err of errors) {
    const path = normalizeInstancePath(err.instancePath);
    const key = `${path}:${err.keyword}`;

    // Deduplicate errors for the same field and keyword
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const message = formatErrorMessage(err);
    if (message) {
      result.push({ path, message });
    }
  }

  return result;
}

/** Convert ajv's `/settings/color/custom` path format to dot-separated `settings.color.custom`. */
function normalizeInstancePath(instancePath: string): string {
  // Ajv uses "/settings/color/custom" — convert to "settings.color.custom"
  return instancePath.replace(/^\//, "").replace(/\//g, ".");
}

/** Convert an ajv ErrorObject into a human-readable message string. */
function formatErrorMessage(err: ErrorObject): string {
  switch (err.keyword) {
    case "type":
      return `Must be of type ${err.params["type"] as string}`;
    case "required":
      return `Missing required property: ${err.params["missingProperty"] as string}`;
    case "enum":
      return `Must be one of: ${(err.params["allowedValues"] as string[]).join(", ")}`;
    case "additionalProperties":
      return `Unknown property: ${err.params["additionalProperty"] as string}`;
    case "minimum":
      return `Must be >= ${err.params["limit"] as number}`;
    case "maximum":
      return `Must be <= ${err.params["limit"] as number}`;
    case "minLength":
      return `Must not be empty`;
    case "pattern":
      return `Invalid format`;
    default:
      return err.message ?? `Validation error (${err.keyword})`;
  }
}
