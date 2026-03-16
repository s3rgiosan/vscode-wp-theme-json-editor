import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useEditorStore } from "../store/editorStore";
import { extractCssVariables, type CssVariable } from "../utils/cssVariables";

const CssVariablesContext = createContext<CssVariable[]>([]);

/**
 * Provides the extracted CSS variables to the entire component tree.
 * Runs `extractCssVariables` once per themeJson change, not per input.
 */
export function CssVariablesProvider({ children }: { readonly children: ReactNode }) {
  const themeJson = useEditorStore((s) => s.themeJson);
  const variables = useMemo(() => extractCssVariables(themeJson), [themeJson]);

  return (
    <CssVariablesContext.Provider value={variables}>
      {children}
    </CssVariablesContext.Provider>
  );
}

/**
 * Returns the list of CSS variables from the nearest CssVariablesProvider.
 * Must be used within a CssVariablesProvider.
 */
export function useCssVariables(): CssVariable[] {
  return useContext(CssVariablesContext);
}
