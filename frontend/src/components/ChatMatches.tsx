import { useMatches } from "../matches";
import ProductCard from "./ProductCard";

/**
 * Renders the products the chatbot last surfaced as full product cards, right on the
 * page. Appears on every page (below the nav) whenever the agent has returned
 * matches. Each card is the same <ProductCard> used on the Products page, so clicking
 * one opens the single-item detail view built in Problem 3.
 */
export default function ChatMatches() {
  const { matches, query, clear } = useMatches();

  if (matches.length === 0) return null;

  return (
    <section className="chat-matches">
      <div className="container">
        <div className="chat-matches-head">
          <div>
            <p className="eyebrow">From your chat with Blue</p>
            <h2>
              {matches.length} match{matches.length === 1 ? "" : "es"}
              {query ? ` for “${query}”` : ""}
            </h2>
          </div>
          <button className="btn btn-ghost" onClick={clear}>
            Clear
          </button>
        </div>
        <div className="product-grid">
          {matches.map((p) => (
            <ProductCard key={p.product_id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
