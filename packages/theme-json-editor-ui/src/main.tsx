import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { HostProvider } from "./host/HostContext";
import { vscodeHost } from "./host/vscodeHost";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <HostProvider host={vscodeHost}>
        <App />
      </HostProvider>
    </StrictMode>,
  );
}
