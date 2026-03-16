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
