import { createContext } from "react";
import type { HostAdapter } from "./HostAdapter";

export const HostContext = createContext<HostAdapter | null>(null);
