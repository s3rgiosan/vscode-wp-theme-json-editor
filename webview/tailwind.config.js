/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vscode: {
          // Core backgrounds & foregrounds
          bg: "var(--vscode-editor-background)",
          fg: "var(--vscode-foreground)",
          "disabled-fg": "var(--vscode-disabledForeground)",
          "sidebar-bg": "var(--vscode-sideBar-background)",
          "panel-border": "var(--vscode-panel-border)",

          // Inputs
          "input-bg": "var(--vscode-input-background)",
          "input-fg": "var(--vscode-input-foreground)",
          "input-border": "var(--vscode-input-border)",
          "input-placeholder": "var(--vscode-input-placeholderForeground)",

          // Input validation
          "input-error-bg": "var(--vscode-inputValidation-errorBackground)",
          "input-error-border": "var(--vscode-inputValidation-errorBorder)",
          "input-error-fg": "var(--vscode-inputValidation-errorForeground)",
          "input-warning-bg": "var(--vscode-inputValidation-warningBackground)",
          "input-warning-border": "var(--vscode-inputValidation-warningBorder)",
          "input-warning-fg": "var(--vscode-inputValidation-warningForeground)",

          // Buttons
          "button-bg": "var(--vscode-button-background)",
          "button-fg": "var(--vscode-button-foreground)",
          "button-hover": "var(--vscode-button-hoverBackground)",
          "button-secondary-bg": "var(--vscode-button-secondaryBackground)",
          "button-secondary-fg": "var(--vscode-button-secondaryForeground)",

          // Dropdowns
          "dropdown-bg": "var(--vscode-dropdown-background)",
          "dropdown-fg": "var(--vscode-dropdown-foreground)",
          "dropdown-border": "var(--vscode-dropdown-border)",

          // Checkboxes
          "checkbox-bg": "var(--vscode-checkbox-background)",
          "checkbox-fg": "var(--vscode-checkbox-foreground)",
          "checkbox-border": "var(--vscode-checkbox-border)",

          // Lists & trees
          "list-hover": "var(--vscode-list-hoverBackground)",
          "list-hover-fg": "var(--vscode-list-hoverForeground)",
          "list-active-bg": "var(--vscode-list-activeSelectionBackground)",
          "list-active-fg": "var(--vscode-list-activeSelectionForeground)",
          // Keep old alias for backward compat in Sidebar
          "list-active": "var(--vscode-list-activeSelectionBackground)",

          // Badges
          "badge-bg": "var(--vscode-badge-background)",
          "badge-fg": "var(--vscode-badge-foreground)",

          // Status colors
          "error-fg": "var(--vscode-errorForeground)",
          "warning-fg": "var(--vscode-editorWarning-foreground)",

          // Text
          "description-fg": "var(--vscode-descriptionForeground)",
          "link-fg": "var(--vscode-textLink-foreground)",
          "link-active-fg": "var(--vscode-textLink-activeForeground)",

          // Focus & borders
          "focus-border": "var(--vscode-focusBorder)",
          "contrast-border": "var(--vscode-contrastBorder)",

          // Breadcrumbs
          "breadcrumb-fg": "var(--vscode-breadcrumb-foreground)",
          "breadcrumb-active-fg": "var(--vscode-breadcrumb-activeSelectionForeground)",

          // Scrollbar
          "scrollbar-bg": "var(--vscode-scrollbarSlider-background)",
          "scrollbar-hover-bg": "var(--vscode-scrollbarSlider-hoverBackground)",
        },
      },
      fontSize: {
        "vscode-sm": "var(--vscode-font-size, 13px)",
      },
      fontFamily: {
        vscode: "var(--vscode-font-family, sans-serif)",
      },
    },
  },
  plugins: [],
};
