# Architecture

## How It Works

1. **Handshake** — The webview sends `WEBVIEW_READY` when mounted. The host responds with `INIT_DATA`, `SETTINGS`, and `SCHEMA_READY`, ensuring the message listener is set up before any data is sent.
2. **Schema loading** — The extension fetches the official WP schema from `schemas.wp.org` (cached with ETags in `globalState`). Falls back to a bundled copy offline.
3. **Schema resolution** — `$ref` and `allOf` are resolved inline. Per-block sub-trees are stubbed with metadata (block names, shared per-block schema) to keep the resolved schema at ~1.2MB instead of 40MB+.
4. **Core-scan merging** — A committed snapshot (`core-scan-snapshot.json`) flags experimental and undocumented properties with `x-wpthemejsoneditor-*` markers.
5. **Webview rendering** — A React + Tailwind UI walks the resolved schema and renders the appropriate field component for each property type (priority: array → block map → object → boolean → enum → color → CSS → number → string). Each field subscribes to its own slice of the store for efficient re-renders.
6. **CSS handling** — CSS fields are prettified on load (minified → formatted) and minified on save (formatted → compact). Prettification is idempotent — `prettify(prettify(x)) === prettify(x)`.
7. **File I/O** — All reads and writes go through `ThemeJsonManager` using `vscode.workspace.fs`. The file is watched for external changes with a 500ms write guard to prevent self-notification.

## File Structure

```
src/                           # Extension host (Node.js)
├── extension.ts               # Entry point, command registration
├── panel/
│   ├── PanelManager.ts        # Webview panel lifecycle + message routing
│   ├── WebviewHtmlRenderer.ts # CSP-secured HTML with crypto nonce
│   └── messages.ts            # Re-exports shared message types
├── schema/
│   ├── SchemaLoader.ts        # Fetch + ETag cache + bundled fallback
│   ├── SchemaResolver.ts      # Resolve $ref, allOf; stub per-block trees
│   ├── SchemaMerger.ts        # Inject experimental/undocumented flags
│   └── SchemaCoordinator.ts   # Orchestrates the full schema pipeline
├── scanner/
│   └── CoreScanner.ts         # GitHub API scanner for WP core properties
├── file/
│   └── ThemeJsonManager.ts    # File read/write/watch with write guard
└── shared/
    └── messages.ts            # Typed discriminated union message protocol

webview/src/                   # Webview UI (React 18 + Tailwind CSS)
├── App.tsx                    # Root component with layout shell
├── vscode.ts                  # acquireVsCodeApi singleton wrapper
├── store/
│   └── editorStore.ts         # Zustand store with CSS prettify/minify
├── hooks/
│   ├── useFieldValue.ts       # Per-field store selectors (useFieldValue, useFieldExists)
│   ├── useCssVariables.ts     # Context-provided CSS variable list from themeJson
│   ├── CssVariablesContext.tsx # Provider for CSS variable extraction (runs once)
│   └── useMessageListener.ts  # WEBVIEW_READY handshake + message dispatch
├── utils/
│   ├── css.ts                 # CSS minify/prettify (idempotent)
│   ├── cssVariables.ts        # Extract CSS variables from themeJson
│   ├── formatLabel.ts         # camelCase → human-readable labels + singularize
│   ├── nested.ts              # Immutable nested get/set helpers
│   ├── searchSchema.ts        # Recursive schema property search
│   └── validate.ts            # ajv JSON Schema validation (cached compile)
└── components/
    ├── SectionPanel.tsx       # Schema-driven form renderer
    ├── fieldRenderer.tsx      # Type-to-component mapping (single source of truth)
    ├── ConnectedFields.tsx    # Store-connected field wrappers (per-field subscriptions)
    ├── CollapsibleChildren.tsx # Accordion layout for complex child objects
    ├── SectionOverview.tsx    # Overview cards for Settings/Styles top-level
    ├── Autocomplete.tsx       # CSS variable autocomplete dropdown + TextInputWithAutocomplete
    ├── styles.ts              # Shared Tailwind class constants
    ├── Sidebar.tsx            # Global search + section tree navigation
    ├── Breadcrumbs.tsx        # Clickable breadcrumb trail
    ├── Toolbar.tsx            # Schema badge + experimental toggle
    ├── SaveBar.tsx            # Save (with CSS minify) / discard
    ├── ConflictBanner.tsx     # External change warning + reload
    ├── Description.tsx        # Schema description formatter (lists, code)
    ├── ValidationErrors.tsx   # Inline ajv error display
    ├── ExperimentalBadge.tsx  # Experimental/undocumented marker
    └── fields/
        ├── ArrayField.tsx     # Sortable items with drag-and-drop
        ├── BlockMapField.tsx  # Block accordion + core/custom detection
        ├── ColorField.tsx     # Color picker + text input
        ├── CssField.tsx       # CodeMirror 6 with CSS/JSON highlighting + lint
        ├── CustomVariablesField.tsx  # Nested accordion editor with rename
        ├── ItemPropertyField.tsx     # Per-property field within array items
        ├── UnitsSelector.tsx  # CSS unit chip selector
        ├── NumberField.tsx    # Number/integer input
        ├── SelectField.tsx    # Enum dropdown
        ├── TextField.tsx      # Text input
        └── ToggleField.tsx    # Boolean checkbox

.github/workflows/
├── ci.yml                     # Type-check, test, build on push/PR
├── release.yml                # Publish to Marketplace + GitHub Release on tag
└── refresh-definitions.yml    # Weekly core-scan snapshot refresh via PR
```
