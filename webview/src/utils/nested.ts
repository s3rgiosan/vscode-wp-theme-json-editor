/**
 * Immutably set a value at a nested path in an object.
 *
 * @param obj - The source object (not mutated).
 * @param path - Array of keys representing the nested path.
 * @param value - The value to set at the path.
 * @returns A new object with the value set at the given path.
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): Record<string, unknown> {
  if (path.length === 0) {
    return obj;
  }

  const [head, ...rest] = path;
  if (!head) {
    return obj;
  }

  const result = { ...obj };

  if (rest.length === 0) {
    result[head] = value;
  } else {
    const child =
      typeof result[head] === "object" && result[head] !== null
        ? (result[head] as Record<string, unknown>)
        : {};
    result[head] = setNestedValue(child, rest, value);
  }

  return result;
}

/**
 * Immutably remove a value at a nested path in an object.
 * Only the target key is removed; parent objects are preserved even if empty
 * (empty objects are meaningful in theme.json, e.g. block overrides).
 *
 * @param obj - The source object (not mutated).
 * @param path - Array of keys representing the nested path.
 * @returns A new object with the value removed at the given path.
 */
export function removeNestedValue(
  obj: Record<string, unknown>,
  path: string[],
): Record<string, unknown> {
  if (path.length === 0) {
    return obj;
  }

  const [head, ...rest] = path;
  if (!head) {
    return obj;
  }

  const result = { ...obj };

  if (rest.length === 0) {
    delete result[head];
  } else {
    const child = result[head];
    if (typeof child !== "object" || child === null) {
      return obj;
    }
    result[head] = removeNestedValue(
      child as Record<string, unknown>,
      rest,
    );
  }

  return result;
}

/**
 * Recursively remove empty plain objects from a tree.
 * Arrays and non-object values are left untouched.
 * If pruning a child makes its parent empty, the parent is pruned too.
 *
 * @param obj - The source object (not mutated).
 * @returns A new object with all empty-object branches removed,
 *          or `undefined` if the entire object is empty after pruning.
 */
export function pruneEmptyObjects(
  obj: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      result[key] = value;
    } else if (typeof value === "object" && value !== null) {
      const pruned = pruneEmptyObjects(value as Record<string, unknown>);
      if (pruned !== undefined) {
        result[key] = pruned;
      }
    } else {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Get a value at a nested path in an object.
 *
 * @param obj - The source object.
 * @param path - Array of keys representing the nested path.
 * @returns The value at the path, or `undefined` if any segment is missing.
 */
export function getNestedValue(
  obj: Record<string, unknown>,
  path: string[],
): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
