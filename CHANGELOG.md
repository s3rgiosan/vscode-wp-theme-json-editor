# Changelog

All notable changes to the WP Theme JSON Editor extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Variation section for the root-level keys a style variation declares — `title`, `slug`, `description`, and `blockTypes`. It appears for files under `styles/` and for any document that already declares one of those keys, and such files now open on it instead of Settings.
- `blockTypes` renders as a block picker: selected blocks show as removable chips, core blocks are searchable, and custom block names can be typed in for third-party blocks.
- Hints at the top of the Variation section state how WordPress will read the file — a block style variation registering on N blocks, or a global variation applying site-wide — and warn when the slug drifts from the file name or when a block style variation defines no styles.

## [1.5.0] - 2026-07-16

### Added

- Core-scan definitions refreshed: `settings.mobile`, `settings.tablet`, `settings.viewport`, `settings.viewport.mobile`, and `settings.viewport.tablet` are now recognized as undocumented theme.json properties and editable in the visual editor ([#22](https://github.com/s3rgiosan/vscode-wp-theme-json-editor/pull/22)).

### Changed

- The "Experimental" and "Undocumented" badge tooltips now explain each category distinctly — experimental means a prefixed `__experimental` core API; undocumented means a property valid in WordPress core but not yet in the published theme.json schema.

### Fixed

- Extension failed to activate (`command 'wpThemeJsonEditor.open' not found`) because the `minimatch` runtime dependency was excluded from the packaged VSIX — `.vscodeignore` ignores `node_modules` and the extension host was shipped unbundled. The extension host is now bundled with esbuild, inlining runtime dependencies so packaging no longer relies on `node_modules` being present (props [@mzilley](https://github.com/mzilley), [#21](https://github.com/s3rgiosan/vscode-wp-theme-json-editor/pull/21)).
- Undocumented properties that are also parents of deeper properties are now typed as objects rather than plain strings, so the editor renders them as nested sections. `settings.viewport` now shows editable `mobile`/`tablet` breakpoint fields instead of a single text input.

## [1.4.1] - 2026-06-29

### Added

- Core-scan definitions refreshed: `styles.textShadow` and `styles.typography.textShadow` are now recognized as undocumented theme.json properties and editable in the visual editor ([#19](https://github.com/s3rgiosan/vscode-wp-theme-json-editor/pull/19)).

## [1.4.0] - 2026-06-19

### Added

- `wpThemeJsonEditor.includePatterns` setting — a glob allowlist (matched against the file path) for the files the editor can open. Lets you edit theme JSON kept outside the defaults, such as partial files compiled into `theme.json` at build time. Defaults cover `theme.json` and `*.json` variations under `styles/`; a file is editable when its path matches any pattern ([#14](https://github.com/s3rgiosan/vscode-wp-theme-json-editor/issues/14)).

### Changed

- File discovery is now glob-based (via `minimatch`) and driven by `includePatterns`. The Command Palette and `Cmd/Ctrl+Shift+T` honor the configured patterns; the keybinding's `when`-clause tracks the active file through a context key rather than a hard-coded path rule.
- Once you define your own `includePatterns`, the Explorer right-click menu widens from `theme.json`/`styles/**` to every `.json` file. The open command re-validates the chosen file against your patterns and shows a warning instead of opening a non-match. Without custom patterns the menu is unchanged.

## [1.3.0] - 2026-06-14

### Added

- Edit theme style variations: the visual editor now opens on `*.json` files located under a theme's `styles/` directory, not only `theme.json`. Matching is recursive (mirroring core's `WP_Theme_JSON_Resolver::get_style_variations()`), so nested variation files are included. Available from the Explorer context menu, `Cmd/Ctrl+Shift+T`, and the command palette ([#14](https://github.com/s3rgiosan/vscode-wp-theme-json-editor/issues/14)).
- The name of the file being edited is shown in the editor header, next to the title. Omitted for non-file sources (e.g. a host's database-backed global styles).

### Changed

- The webview's editing-target switcher — rendered only by hosts that expose more than one target (e.g. the [WP Theme JSON Editor plugin](https://github.com/s3rgiosan/wp-theme-json-editor)) — is now a custom dropdown that lists `theme.json` with its `styles/*.json` variations indented beneath it. It implements the ARIA select-only combobox pattern and is fully keyboard-accessible (Arrow/Home/End to move, Enter/Space to select, Escape to dismiss). VS Code is unchanged: it edits one file per panel and does not show the switcher.

## [1.2.0] - 2026-05-08

### Changed

- Repository restructured as an npm workspace monorepo. The webview lives in `packages/theme-json-editor-ui/` as a reusable package with a public library entry (`mountEditor`, `App`, layout components, `useEditorStore`, `performSave`, `useHostBootstrap`, schema utilities, host abstraction).
- Webview is now host-agnostic. New `HostAdapter` interface (`start`, `save`, `reportDirty` + `HostEvents`) sits between the editor and its embedder; the extension supplies a `vscodeHost` adapter via `HostProvider`. Other runtimes (e.g. a WordPress admin plugin) can implement the same interface to mount the editor.
- Schema resolution and core-scan merging now run in a Web Worker inside the webview. The extension host ships the raw schema and snapshot; the worker merges off the main thread, keeping the UI responsive on first panel open.
- All design tokens migrated from `--vscode-*` to host-neutral `--tje-*`. Defaults still resolve to `var(--vscode-*, fallback)` so the extension behaves identically inside VS Code; alternative hosts override the `--tje-*` vars to retheme. Tailwind colour namespace renamed `vscode.*` → `tje.*`.
- Schema assets (`core-scan-snapshot.json`, `theme.json.fallback`) relocated to `packages/theme-json-editor-ui/assets/` as the single source of truth. Extension `SchemaCoordinator` / `SchemaLoader` and the `scripts/scan-core.ts` GitHub Action workflow read from the new path.
- Secondary button gains a proper border + accent text + dedicated hover states via four new tokens (`--tje-button-secondary-border{,-hover}`, `--tje-button-secondary-{bg,fg}-hover`). `SaveBar` Discard now uses them.
- Accordion-style wrappers (`CollapsibleChildren`, `ArrayField`, `BlockMapField`, `CustomVariablesField`) clip their inner header backgrounds via `overflow-hidden` so rounded corners render cleanly.
- Accordion header height bumped from 28px to 32px.
- `HostAdapter` gains optional `modes` / `getMode` / `setMode` so hosts that expose more than one editing target (e.g. a WP admin plugin choosing between theme.json on disk and user global styles) can render a Toolbar mode switcher. No-op for single-mode hosts; VS Code is unchanged.
- `HostContext` split into `context.ts`, `HostContext.tsx` (provider only), and `useHost.ts` (hook only) to satisfy `react-refresh/only-export-components` and keep fast-refresh boundaries clean.
- `vscodeHost` no longer imports `@shared/messages` — the package now declares its own subset of the postMessage protocol so consumers don't depend on extension-private path aliases.
- `CssField` ref synchronisation moved into `useEffect` (drops the previous `react-hooks/refs` eslint disables).
- CI and Release workflows updated for the npm-workspace layout: a single `npm ci` covers both packages, lint runs via `npm run lint --workspaces --if-present`, and `npm test` exercises the workspace test suites.
- Sidebar items have roomier vertical padding (top-level `py-1.5` → `py-2`, sub-section `py-1` → `py-1.5`) and zero `<li>` margin so host-injected list styles don't add gaps.
- Field containers in `SectionPanel` use `mb-5` (was `mb-3`) for clearer separation between consecutive settings.

### Fixed

- Webview CSP updated to allow `blob:` workers (`script-src ... blob:`, `worker-src blob:`). Without this the schema-merge worker was blocked and the panel hung on "Loading schema...".

## [1.1.2] - 2026-05-05

### Fixed

- Webview font sizes no longer hardcoded in pixels. UI text now inherits VS Code's `--vscode-font-size` and scales with `window.zoomLevel`, addressing accessibility concerns around small description text (props [@kazerniel](https://github.com/kazerniel), [#8](https://github.com/s3rgiosan/vscode-wp-theme-json-editor/issues/8)).
- CodeMirror CSS field now uses `--vscode-editor-font-size` instead of a hardcoded 12px.

### Changed

- Sidebar root navigation and breadcrumbs inherit base body size; hierarchy is conveyed via font weight rather than smaller children.
- Added em-based Tailwind font-size tokens (`secondary`, `tertiary`, `quaternary`) to replace hardcoded `text-[Npx]` classes across the webview.

## [1.1.1] - 2026-04-13

### Added

- ESLint with flat config for both extension and webview (includes `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`).
- `lint:fix` script for auto-fixing ESLint issues in both packages.
- Separate lint and type-check steps in the CI pipeline for clearer failure reporting.

### Changed

- Core scanner now parses `VALID_SETTINGS` and `VALID_STYLES` class constants from PHP source instead of fragile regex matching on variable access patterns.
- Core scanner now scans both WordPress core and Gutenberg plugin repositories for comprehensive coverage.
- Core scanner loads the official theme.json schema to properly distinguish documented vs undocumented properties.
- Refreshed core-scan snapshot: adds `settings.gradient`, `settings.background.gradient`, `styles.background.gradient` to known paths.

### Fixed

- Core scanner script failing in CI due to `ts-node` not resolving `.js` imports under `Node16` module resolution (replaced with `tsx`).
- Core scanner producing false positives for well-known structural keys (`settings`, `styles`, `styles.blocks`, etc.) and CSS display values (`block`, `flex`, `grid`).

## [1.1.0] - 2026-03-18

### Added

- Support for boolean+object schema fields (e.g. `settings.typography.fluid` and `fontSizes[].fluid`). These fields render as a tri-state toggle that expands to show object properties when set to True (props [@kdo](https://github.com/kdo)).
- Empty object pruning at save time — block entries and other empty objects are automatically cleaned up when saved (props [@colinswinney](https://github.com/colinswinney)).
- "Disable defaults" checkbox for `settings.color.duotone`, `gradients`, and `palette` to explicitly set an empty array and disable WordPress defaults.
- Custom variables (`settings.custom`) now support adding name and value in a single step, with a type selector (Value/Group) on the left (props [@kdo](https://github.com/kdo)).
- Automated publishing to Open VSX Registry in the release workflow.

### Changed

- Boolean fields now use a tri-state radio toggle (True / False / Unset) instead of a checkbox. This allows explicitly setting `false` or leaving a value unset at the block level, so block overrides inherit from global settings by default (props [@colinswinney](https://github.com/colinswinney)).

### Fixed

- Removing the last item from an array field no longer leaves a stale empty array in the saved file, unless the empty array was intentionally present in the original data.

## [1.0.0] - 2026-03-16

### Added

- Form-driven visual editor for WordPress `theme.json` files with schema-driven field rendering.
- Schema loading with ETag caching, offline fallback, and version auto-detection from the `$schema` field.
- Core-scan snapshot for experimental and undocumented properties with `x-wpthemejsoneditor-*` flags.
- Section navigation with sidebar, sub-section drill-down, global search, and breadcrumb navigation.
- Field components: TextField, NumberField, ToggleField, SelectField, ColorField, CssField (CodeMirror 6), ArrayField (drag-and-drop), BlockMapField, CustomVariablesField.
- CSS variable autocomplete in text inputs and CodeMirror editors, derived from the current theme.json data.
- CSS variable name preview on preset items and custom variables.
- Keyboard shortcut `Cmd+S` / `Ctrl+S` to save when the editor panel is focused.
- Save bar with Save and Discard buttons, conflict detection when the file changes externally with unsaved edits.
- Validation via ajv with 500ms debounce and inline error display.
- Experimental/undocumented property toggle in the toolbar.
- Extension settings: `defaultLayout`, `showExperimentalByDefault`, `schemaVersion`.
- CI/CD: GitHub Actions for CI, release, and weekly core-scan refresh.

[Unreleased]: https://github.com/s3rgiosan/vscode-wp-theme-json-editor/compare/1.5.0...HEAD
[1.5.0]: https://github.com/s3rgiosan/vscode-wp-theme-json-editor/compare/1.4.1...1.5.0
[1.2.0]: https://github.com/s3rgiosan/vscode-wp-theme-json-editor/compare/1.1.2...1.2.0
[1.1.2]: https://github.com/s3rgiosan/vscode-wp-theme-json-editor/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/s3rgiosan/vscode-wp-theme-json-editor/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/s3rgiosan/vscode-wp-theme-json-editor/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/s3rgiosan/vscode-wp-theme-json-editor/releases/tag/1.0.0
