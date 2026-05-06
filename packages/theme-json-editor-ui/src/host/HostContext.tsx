import type { ReactNode } from "react";
import { HostContext } from "./context";
import type { HostAdapter } from "./HostAdapter";

export function HostProvider({
  host,
  children,
}: {
  host: HostAdapter;
  children: ReactNode;
}) {
  return <HostContext.Provider value={host}>{children}</HostContext.Provider>;
}
