import { createContext, useContext, type ReactNode } from "react";
import type { HostAdapter } from "./HostAdapter";

const HostContext = createContext<HostAdapter | null>(null);

export function HostProvider({
  host,
  children,
}: {
  host: HostAdapter;
  children: ReactNode;
}) {
  return <HostContext.Provider value={host}>{children}</HostContext.Provider>;
}

export function useHost(): HostAdapter {
  const ctx = useContext(HostContext);
  if (!ctx) {
    throw new Error(
      "useHost must be called inside a <HostProvider>. " +
        "Wrap your editor root with <HostProvider host={...}>.",
    );
  }
  return ctx;
}
