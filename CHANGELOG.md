# Changelog

All notable changes to the WP Theme JSON Editor extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-03-18

### Added

- Support for boolean+object schema fields (e.g. `settings.typography.fluid` and `fontSizes[].fluid`). These fields render as a tri-state toggle that expands to show object properties when set to True (props @kdo).
- Empty object pruning at save time — block entries and other empty objects are automatically cleaned up when saved (props @colinswinney).
- "Disable defaults" checkbox for `settings.color.duotone`, `gradients`, and `palette` to explicitly set an empty array and disable WordPress defaults.
- Custom variables (`settings.custom`) now support adding name and value in a single step, with a type selector (Value/Group) on the left (props @kdo).
- Automated publishing to Open VSX Registry in the release workflow.

### Changed

- Boolean fields now use a tri-state radio toggle (True / False / Unset) instead of a checkbox. This allows explicitly setting `false` or leaving a value unset at the block level, so block overrides inherit from global settings by default (props @colinswinney).

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

[Unreleased]: https://github.com/s3rgiosan/vscode-wp-theme-json-editor/compare/1.1.0...HEAD
[1.1.0]: https://github.com/s3rgiosan/vscode-wp-theme-json-editor/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/s3rgiosan/vscode-wp-theme-json-editor/releases/tag/1.0.0
