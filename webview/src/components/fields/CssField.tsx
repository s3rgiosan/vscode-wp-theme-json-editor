import { type ReactNode, useId, useRef, useEffect, useCallback, useState } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { css, cssLanguage } from "@codemirror/lang-css";
import { json, jsonLanguage, jsonParseLinter } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { completeFromList, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { basicSetup } from "codemirror";
import { Description } from "../Description";
import { LABEL_CLASS } from "../styles";
import { useCssVariables } from "../../hooks/useCssVariables";

interface CssFieldProps {
  readonly label: ReactNode;
  readonly description?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Use JSON mode instead of CSS (for free-form object fields). */
  readonly jsonMode?: boolean;
}

/**
 * Multi-line code editor with syntax highlighting via CodeMirror 6.
 * Shows inline lint errors for JSON (parse errors) and CSS (basic syntax checks).
 * Defaults to CSS mode; set `jsonMode` for JSON editing.
 */
export function CssField({
  label,
  description,
  value,
  onChange,
  jsonMode,
}: CssFieldProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const skipNextSync = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cssVariables = useCssVariables();
  const cssVariablesRef = useRef(cssVariables);
  cssVariablesRef.current = cssVariables;

  const createEditor = useCallback(
    (container: HTMLElement, initialDoc: string) => {
      const langExtension = jsonMode ? json() : css();

      // JSON mode: use the built-in JSON parse linter
      // CSS mode: use a basic brace/semicolon checker
      const linterExtension = jsonMode
        ? linter(jsonParseLinter())
        : linter(cssLinter);

      // CSS variable completions — only trigger on `var(` or `--wp` patterns.
      // We wrap completeFromList in a guard function so arbitrary text
      // like "lor" doesn't fuzzy-match "color" in variable names.
      const varList = completeFromList(
        cssVariablesRef.current.map((v) => ({
          label: `var(${v.name})`,
          detail: v.value ? `${v.category}: ${v.value}` : v.category,
          type: "variable" as const,
        })),
      );

      const guardedVarSource = (ctx: CompletionContext): CompletionResult | Promise<CompletionResult | null> | null => {
        // Only activate when the user is typing a var() or --wp pattern
        const varMatch = ctx.matchBefore(/var\(--[a-z0-9-]*/i);
        const wpMatch = ctx.matchBefore(/--wp[a-z0-9-]*/i);
        if (!varMatch && !wpMatch) return null;
        return varList(ctx);
      };

      const lang = jsonMode ? jsonLanguage : cssLanguage;
      const cssVarCompletion = [
        lang.data.of({ autocomplete: guardedVarSource }),
      ];

      const state = EditorState.create({
        doc: initialDoc,
        extensions: [
          basicSetup,
          langExtension,
          oneDark,
          linterExtension,
          lintGutter(),
          ...cssVarCompletion,
          keymap.of([]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              skipNextSync.current = true;
              const doc = update.state.doc.toString();
              onChangeRef.current(doc);

              // Check for errors and show/clear message
              if (jsonMode) {
                try {
                  JSON.parse(doc);
                  setErrorMessage(null);
                } catch (e) {
                  setErrorMessage(e instanceof Error ? e.message : "Invalid JSON");
                }
              } else {
                const cssError = checkCssSyntax(doc);
                setErrorMessage(cssError);
              }
            }
          }),
          EditorView.theme({
            "&": {
              fontSize: "12px",
              minHeight: "200px",
              maxHeight: "500px",
            },
            ".cm-scroller": {
              overflow: "auto",
              minHeight: "200px",
            },
            ".cm-content": {
              fontFamily: "var(--vscode-editor-font-family, monospace)",
              minHeight: "200px",
            },
            ".cm-gutters": {
              minHeight: "200px",
              paddingRight: "4px",
            },
            ".cm-lineNumbers .cm-gutterElement": {
              paddingLeft: "4px",
              paddingRight: "4px",
            },
          }),
        ],
      });

      return new EditorView({ state, parent: container });
    },
    [jsonMode],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const view = createEditor(container, value);
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createEditor]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      {description && <Description text={description} className="mb-1" />}
      <div
        ref={containerRef}
        className="rounded border border-vscode-input-border overflow-hidden"
        role="textbox"
        aria-label={typeof label === "string" ? label : "Code editor"}
        aria-multiline="true"
      />
      {errorMessage && (
        <p className="mt-1 text-[10px] text-vscode-error-fg" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Result of a brace-matching scan over CSS source text.
 * Contains the position of an unmatched closing brace (if any)
 * and the final brace depth (positive means unclosed braces).
 */
interface BraceCheckResult {
  /** Position of the first unexpected `}`, or -1 if none. */
  unmatchedClosePos: number;
  /** Remaining open-brace depth after scanning the entire string. */
  remainingDepth: number;
  /** Total length of the scanned text. */
  length: number;
}

/**
 * Scan CSS text and return brace-matching information.
 * Skips characters inside string literals to avoid false positives.
 */
function checkBraces(code: string): BraceCheckResult {
  let braceDepth = 0;
  let inString = false;
  let stringChar = "";
  let unmatchedClosePos = -1;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];

    if (!inString && (ch === '"' || ch === "'")) {
      inString = true;
      stringChar = ch;
      continue;
    }
    if (inString && ch === stringChar && code[i - 1] !== "\\") {
      inString = false;
      continue;
    }
    if (inString) {
      continue;
    }

    if (ch === "{") {
      braceDepth++;
    } else if (ch === "}") {
      braceDepth--;
      if (braceDepth < 0) {
        if (unmatchedClosePos === -1) {
          unmatchedClosePos = i;
        }
        braceDepth = 0;
      }
    }
  }

  return { unmatchedClosePos, remainingDepth: braceDepth, length: code.length };
}

/**
 * Basic CSS syntax checker. Returns an error message string or null if valid.
 * Checks for mismatched braces and common syntax issues.
 */
function checkCssSyntax(code: string): string | null {
  const result = checkBraces(code);

  if (result.unmatchedClosePos >= 0) {
    return `Unexpected closing brace at position ${result.unmatchedClosePos + 1}`;
  }

  if (result.remainingDepth > 0) {
    return `Missing ${result.remainingDepth} closing brace${result.remainingDepth > 1 ? "s" : ""}`;
  }

  return null;
}

/**
 * CodeMirror linter for CSS that checks for mismatched braces.
 */
function cssLinter(view: EditorView): Diagnostic[] {
  const doc = view.state.doc.toString();
  const result = checkBraces(doc);
  const diagnostics: Diagnostic[] = [];

  if (result.unmatchedClosePos >= 0) {
    diagnostics.push({
      from: result.unmatchedClosePos,
      to: result.unmatchedClosePos + 1,
      severity: "error",
      message: "Unexpected closing brace",
    });
  }

  if (result.remainingDepth > 0) {
    diagnostics.push({
      from: result.length - 1,
      to: result.length,
      severity: "error",
      message: `Missing ${result.remainingDepth} closing brace${result.remainingDepth > 1 ? "s" : ""}`,
    });
  }

  return diagnostics;
}


