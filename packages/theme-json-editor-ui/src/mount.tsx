import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "./App";
import { HostProvider } from "./host/HostContext";
import type { HostAdapter } from "./host/HostAdapter";

/**
 * Mount the theme.json editor into a host-supplied root element.
 * Returns the React `Root` so callers can `unmount()` later if needed.
 */
export function mountEditor(rootEl: HTMLElement, host: HostAdapter): Root {
  const root = createRoot(rootEl);
  root.render(
    <StrictMode>
      <HostProvider host={host}>
        <App />
      </HostProvider>
    </StrictMode>,
  );
  return root;
}
