import { useContext } from "react";
import { HostContext } from "./context";
import type { HostAdapter } from "./HostAdapter";

/**
 * Read the current `HostAdapter` from the surrounding `<HostProvider>`.
 * Throws when called outside one — there's no sensible default host.
 */
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
