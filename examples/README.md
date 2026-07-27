# Example themes

Sample theme JSON for exercising the editor by hand. Nothing here is used by
the test suite or shipped in the VSIX — it exists so a human can open real
files and see how the editor behaves.

## Running

Press <kbd>F5</kbd> in VS Code. The Extension Development Host launches with
this folder as its workspace (see `.vscode/launch.json`), so every example
below is one click away in the Explorer.

Open any file with **Open in WP Theme JSON Editor** from the Explorer context
menu, or <kbd>Cmd/Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>T</kbd> while it is active.

## What each file is for

### `theme-minimal/`

| File | Exercises |
|---|---|
| `theme.json` | The smallest useful document. Most sections are absent, so it shows the "Add section" empty states. It has no `styles/` directory — a good target for the **New Block Style Variation** command, which creates one. |

### `theme-full/`

| File | Exercises |
|---|---|
| `theme.json` | Every top-level section at once: presets (palette, gradients, duotone, font families and sizes, spacing sizes and units), `settings.custom` nesting, `settings.blocks`, `styles.elements` including a `:hover` state, `styles.blocks`, `styles.variations`, a raw `css` field, plus `customTemplates`, `templateParts` and `patterns`. Also the source of the CSS-variable autocomplete offered in the variation files. |
| `styles/primary.json` | A block style variation on two blocks. The Variation section shows the block picker with `core/group` and `core/column` selected, and the hints report a block style variation. |
| `styles/dark.json` | A global style variation — no `blockTypes`, and it overrides `settings` as well as `styles`. Hints should describe it as applying to the whole site. |
| `styles/section/blue.json` | A variation nested one directory deeper, confirming the `styles/` scan recurses the way core's does. |
| `styles/no-slug.json` | No `slug`. The Variations list falls back to the kebab-cased title (`soft-contrast`), matching what WordPress derives. |
| `styles/brand.json` | `slug` is `primary-brand` but the file is `brand.json` — the slug/file-name drift warning. |
| `styles/registered-only.json` | `blockTypes` with no `styles` at all: registers the style, changes nothing. Warns accordingly. |
| `styles/broken.json` | **Deliberately invalid JSON.** The Variations list must skip it silently rather than failing to render. Opening it directly is expected to error — that is the point. Leave it malformed. |

### `theme-partial-build/`

For the `wpThemeJsonEditor.includePatterns` setting. `src/theme-json/primary.json`
is a variation kept outside `styles/`, as a build step might. It is not
editable until you add a pattern that covers it:

```jsonc
"wpThemeJsonEditor.includePatterns": [
  "**/theme.json",
  "**/styles/**/*.json",
  "**/src/theme-json/**/*.json"
]
```

Because it declares `blockTypes`, the Variation section still appears once the
file opens, even though its path is not under `styles/`.

## Things worth checking

- The **Variation** section is the landing section for any file under
  `styles/`, and absent on `theme-minimal/theme.json`.
- The **Variations** section lists siblings from `theme-full/theme.json` and is
  hidden while editing one of the variations themselves. Refresh picks up files
  added on disk.
- Saving a file rewrites only what you changed — the raw `css` field in
  `theme-full/theme.json` is prettified on load and minified again on save.
