# WP Theme JSON Editor

A Visual Studio Code extension that provides a form-driven visual editor for WordPress `theme.json` files. Edit colors, typography, spacing, and more without touching raw JSON.

![WP Theme JSON Editor](https://github.com/s3rgiosan/vscode-wp-theme-json-editor/raw/main/assets/demo.webp)

## Features

- **Schema-driven UI** — Fields are generated from the official WordPress JSON Schema, so the editor stays current with every WP release.
- **Global search** — Search all properties across all sections from the sidebar. Results show breadcrumb paths for quick navigation.
- **Breadcrumb navigation** — Clickable breadcrumb trail at the top of each panel showing the current location in the schema tree.
- **Section navigation** — Sidebar with sub-section drill-down for Settings, Styles, Custom Templates, Template Parts, and Patterns.
- **CSS variable autocomplete** — Text inputs and CSS editors suggest `--wp--preset--*` and `--wp--custom--*` variables derived from the current theme.json data. Triggers on `var(--` or `--wp`.
- **CSS variable name preview** — Preset items (palette, gradients, font sizes, shadows, etc.) display their generated CSS variable name below each entry.
- **Keyboard shortcuts** — `Cmd+S` / `Ctrl+S` saves while the editor panel is focused. `Cmd+Shift+T` / `Ctrl+Shift+T` opens the editor on a `theme.json` file.
- **Color picker** — Native color input for palette entries, duotone colors, and any color-related property.
- **CSS editor** — CodeMirror 6 with syntax highlighting for CSS and JSON fields, plus CSS variable autocomplete. CSS is minified on save and prettified on load. Inline lint errors for JSON syntax issues.
- **Array management** — Add, edit, remove, and drag-to-reorder items in palettes, font families, spacing scales, and more. Context-aware labels ("Palette 1", "Font Family 1").
- **Spacing units** — Toggleable chip selector for CSS units supported by the WordPress block editor (px, em, rem, %, vw, vh, and viewport variants).
- **Block-level overrides** — Accordion-based block editor with search. Core blocks render the full per-block schema; custom blocks get a JSON editor.
- **Style variations** — Free-form variation editor for `styles.variations` with the full styles schema per variation.
- **Custom variables** — Nested accordion editor for `settings.custom` with inline rename, live CSS custom property preview (`--wp--custom--...`) for leaf values, and add/remove for groups and values.
- **Elements editor** — Collapsible accordion for `styles.elements` (button, link, headings, caption, cite) with "configured" indicator.
- **Validation** — Required fields marked with `*`, inline error messages, and full JSON Schema validation via ajv (500ms debounce).
- **Experimental property toggle** — Show or hide experimental and undocumented properties found via the core-scan snapshot.
- **Conflict detection** — If the file changes on disk while you have unsaved edits, a banner lets you reload or keep your changes.
- **Empty state handling** — Sections not yet in your `theme.json` show an "Add section" button.
- **Description formatting** — Schema descriptions render with bullet lists, inline code, and proper line breaks.
- **VSCode theme integration** — The UI uses VSCode CSS variables, so it respects your color theme (light, dark, high contrast).
- **Accessibility** — ARIA tree roles on navigation, `aria-expanded` on accordions, `aria-pressed` on unit toggles, `role="alert"` on validation errors and lint messages.

## Getting Started

### From the Marketplace

Install "WP Theme JSON Editor" from the VS Code Marketplace, then:

1. Open a project containing a `theme.json` file.
2. Right-click the file in the Explorer → **Open in WP Theme JSON Editor**.
3. Or press `Cmd+Shift+T` (Mac) / `Ctrl+Shift+T` (Windows/Linux) while the file is active.

### From Source

```bash
git clone https://github.com/s3rgiosan/vscode-wp-theme-json-editor.git
cd vscode-wp-theme-json-editor

# Install dependencies
npm install

# Build
npm run build

# Launch in Extension Development Host
# Press F5 in VSCode
```

## Commands

| Command | Description |
|---|---|
| `WP Theme JSON: Open in WP Theme JSON Editor` | Opens the editor using your default layout preference |
| `WP Theme JSON: Open in WP Theme JSON Editor (Side Panel)` | Opens as a side panel |
| `WP Theme JSON: Open in WP Theme JSON Editor (Tab)` | Opens as a full editor tab |

## Settings

| Setting | Default | Description |
|---|---|---|
| `wpThemeJsonEditor.defaultLayout` | `tab` | Default layout: `sidePanel` or `tab` |
| `wpThemeJsonEditor.showExperimentalByDefault` | `false` | Show experimental/undocumented properties on open |
| `wpThemeJsonEditor.schemaVersion` | `auto` | Schema version: `auto`, `6.6`, `6.7`, or `trunk` |

## Development

```bash
# Install dependencies
npm install

# Watch both extension and webview simultaneously
npm run dev

# Type-check
npm run lint                # Host type-check (tsc --noEmit)
cd webview && npm run lint  # Webview type-check

# Run tests
npm test                    # Host tests (SchemaResolver, SchemaMerger)
cd webview && npm test      # Webview tests (utilities, validation, CSS, autocomplete)

# Build for packaging
npm run build               # Compiles host (tsc) then webview (vite build)

# Package as .vsix
npm run package             # or: npx vsce package

# Regenerate core-scan snapshot (maintainers only)
npx ts-node scripts/scan-core.ts
```

## CI/CD

- **CI** — Runs on every push and pull request. Type-checks both projects, runs all tests, and builds.
- **Release** — Triggered by pushing a `v*` tag. Runs CI checks, packages the extension, publishes to the VS Code Marketplace, and creates a GitHub Release with the `.vsix` attached.
- **Definitions refresh** — Runs weekly (Monday 06:00 UTC) and on manual dispatch. Re-scans WP core source via the GitHub API and opens a PR if the snapshot changes.

### Releasing

```bash
# 1. Update version in package.json (root and webview)
# 2. Commit
git commit -am "chore: bump version to X.Y.Z"
# 3. Tag
git tag vX.Y.Z
# 4. Push
git push && git push --tags
# The release workflow handles packaging and publishing.
```

## License

GPL-3.0 -- see [LICENSE](LICENSE) for details.
