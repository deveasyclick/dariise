"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CreatedApiKey } from "@dariise/contracts";

interface CreatedApiKeyStore {
  created: CreatedApiKey | null;
  setCreated: (key: CreatedApiKey | null) => void;
}

const CreatedApiKeyContext = createContext<CreatedApiKeyStore | null>(null);

/**
 * Holds the one response that carries a secret across the navigation from the
 * create screen back to the list. It lives in memory only, so a reload loses it.
 */
export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const [created, setCreated] = useState<CreatedApiKey | null>(null);

  const store = useMemo<CreatedApiKeyStore>(
    () => ({ created, setCreated }),
    [created],
  );

  return (
    <CreatedApiKeyContext.Provider value={store}>
      {children}
    </CreatedApiKeyContext.Provider>
  );
}

export function useCreatedApiKey(): CreatedApiKeyStore {
  const store = useContext(CreatedApiKeyContext);

  if (!store) {
    throw new Error("useCreatedApiKey must be used within ApiKeysProvider.");
  }

  return store;
}
