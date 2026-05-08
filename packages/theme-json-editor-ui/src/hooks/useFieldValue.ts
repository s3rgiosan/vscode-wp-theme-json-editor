import { useRef, useCallback, useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import { getNestedValue } from "../utils/nested";

/**
 * Subscribe to a single value at `path` inside themeJson.
 * Uses a stable selector (via useRef for the path) so Zustand
 * doesn't re-subscribe on every render.
 *
 * Re-renders only when the value at this specific path changes.
 */
export function useFieldValue(path: string[]): unknown {
  const pathRef = useRef(path);
  useEffect(() => {
    pathRef.current = path;
  });

  const selector = useCallback(
    (state: { themeJson: Record<string, unknown> }) =>
      getNestedValue(state.themeJson, pathRef.current),
    [],
  );

  return useEditorStore(selector);
}

/**
 * Returns true if the value at `path` is defined (not undefined/null).
 * Because this returns a boolean, it only triggers re-renders on the
 * undefined→defined transition, not on every nested change.
 */
export function useFieldExists(path: string[]): boolean {
  const pathRef = useRef(path);
  useEffect(() => {
    pathRef.current = path;
  });

  const selector = useCallback(
    (state: { themeJson: Record<string, unknown> }) => {
      const val = getNestedValue(state.themeJson, pathRef.current);
      return val !== undefined && val !== null;
    },
    [],
  );

  return useEditorStore(selector);
}

/**
 * Returns true if the value at `path` is not undefined.
 * Used by CollapsibleChildren for the "configured" badge.
 */
export function useHasNestedData(path: string[]): boolean {
  const pathRef = useRef(path);
  useEffect(() => {
    pathRef.current = path;
  });

  const selector = useCallback(
    (state: { themeJson: Record<string, unknown> }) =>
      getNestedValue(state.themeJson, pathRef.current) !== undefined,
    [],
  );

  return useEditorStore(selector);
}
