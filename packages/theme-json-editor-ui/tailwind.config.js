/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tje: {
          // Core backgrounds & foregrounds
          bg: "var(--tje-bg)",
          fg: "var(--tje-fg)",
          "disabled-fg": "var(--tje-disabled-fg)",
          "sidebar-bg": "var(--tje-sidebar-bg)",
          "panel-border": "var(--tje-panel-border)",

          // Inputs
          "input-bg": "var(--tje-input-bg)",
          "input-fg": "var(--tje-input-fg)",
          "input-border": "var(--tje-input-border)",
          "input-placeholder": "var(--tje-input-placeholder)",

          // Input validation
          "input-error-bg": "var(--tje-input-error-bg)",
          "input-error-border": "var(--tje-input-error-border)",
          "input-error-fg": "var(--tje-input-error-fg)",
          "input-warning-bg": "var(--tje-input-warning-bg)",
          "input-warning-border": "var(--tje-input-warning-border)",
          "input-warning-fg": "var(--tje-input-warning-fg)",

          // Buttons
          "button-bg": "var(--tje-button-bg)",
          "button-fg": "var(--tje-button-fg)",
          "button-hover": "var(--tje-button-hover)",
          "button-secondary-bg": "var(--tje-button-secondary-bg)",
          "button-secondary-fg": "var(--tje-button-secondary-fg)",
          "button-secondary-border": "var(--tje-button-secondary-border)",
          "button-secondary-bg-hover": "var(--tje-button-secondary-bg-hover)",
          "button-secondary-fg-hover": "var(--tje-button-secondary-fg-hover)",
          "button-secondary-border-hover": "var(--tje-button-secondary-border-hover)",

          // Dropdowns
          "dropdown-bg": "var(--tje-dropdown-bg)",
          "dropdown-fg": "var(--tje-dropdown-fg)",
          "dropdown-border": "var(--tje-dropdown-border)",

          // Checkboxes
          "checkbox-bg": "var(--tje-checkbox-bg)",
          "checkbox-fg": "var(--tje-checkbox-fg)",
          "checkbox-border": "var(--tje-checkbox-border)",

          // Lists & trees
          "list-hover": "var(--tje-list-hover)",
          "list-hover-fg": "var(--tje-list-hover-fg)",
          "list-active-bg": "var(--tje-list-active-bg)",
          "list-active-fg": "var(--tje-list-active-fg)",
          "list-active": "var(--tje-list-active-bg)",

          // Badges
          "badge-bg": "var(--tje-badge-bg)",
          "badge-fg": "var(--tje-badge-fg)",

          // Status colors
          "error-fg": "var(--tje-error-fg)",
          "warning-fg": "var(--tje-warning-fg)",

          // Text
          "description-fg": "var(--tje-description-fg)",
          "link-fg": "var(--tje-link-fg)",
          "link-active-fg": "var(--tje-link-active-fg)",

          // Focus & borders
          "focus-border": "var(--tje-focus-border)",
          "contrast-border": "var(--tje-contrast-border)",

          // Breadcrumbs
          "breadcrumb-fg": "var(--tje-breadcrumb-fg)",
          "breadcrumb-active-fg": "var(--tje-breadcrumb-active-fg)",

          // Scrollbar
          "scrollbar-bg": "var(--tje-scrollbar-bg)",
          "scrollbar-hover-bg": "var(--tje-scrollbar-hover-bg)",
        },
      },
      fontSize: {
        "tje-base": "var(--tje-font-size)",
        secondary: "1em",
        tertiary: "0.92em",
        quaternary: "0.85em",
      },
      fontFamily: {
        tje: "var(--tje-font-family)",
      },
    },
  },
  plugins: [],
};
