import { createContext, useContext, useMemo, useState } from "react";

import type { Product } from "./types";

/**
 * Shared state for the products the chatbot surfaces. This is the frontend half of
 * the chat-search API contract: the agent returns structured `Product[]` from
 * /api/chat, the ChatWidget drops them here, and <ChatMatches> renders them as
 * product cards on the page — so a question like "what t-shirts do you have?"
 * dynamically updates the storefront, not just the chat panel.
 */
interface MatchesState {
  matches: Product[];
  query: string;
  setMatches: (products: Product[], query: string) => void;
  clear: () => void;
}

const MatchesContext = createContext<MatchesState | null>(null);

export function MatchesProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatchesState] = useState<Product[]>([]);
  const [query, setQuery] = useState("");

  const value = useMemo<MatchesState>(
    () => ({
      matches,
      query,
      setMatches: (products, q) => {
        setMatchesState(products);
        setQuery(q);
      },
      clear: () => {
        setMatchesState([]);
        setQuery("");
      },
    }),
    [matches, query],
  );

  return <MatchesContext.Provider value={value}>{children}</MatchesContext.Provider>;
}

export function useMatches(): MatchesState {
  const ctx = useContext(MatchesContext);
  if (!ctx) throw new Error("useMatches must be used within MatchesProvider");
  return ctx;
}
