import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import { fetchProducts } from "../api";
import type { Product } from "../types";
import ProductCard from "../components/ProductCard";
import { CATEGORIES, categoryOf, groupByCategory } from "../categories";

const PRICE_BANDS: Record<string, (p: number) => boolean> = {
  all: () => true,
  under40: (p) => p < 40,
  "40to70": (p) => p >= 40 && p <= 70,
  over70: (p) => p > 70,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("cat") ?? "all");
  const [color, setColor] = useState("all");
  const [priceBand, setPriceBand] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("type"); // default: grouped by type

  const location = useLocation();

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError("We couldn't load the catalogue. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  // Jump to a category section when arriving via the nav dropdown (/products#cat-...).
  // Keyed off the product load + navigation so the grouped sections exist first.
  useEffect(() => {
    if (products.length === 0) return;
    const hash = location.hash || window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
    return () => clearTimeout(timer);
  }, [products, location.key, location.hash, sort, category]);

  const colors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.colors.forEach((c) => set.add(c.toLowerCase())));
    return ["all", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    // Match on each word independently so "harvard game" finds the Harvard-Yale tee
    // (its tags contain both words, just not as one contiguous phrase).
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const inCategory = category === "all" || categoryOf(p.garment_type).slug === category;
      const inColor = color === "all" || p.colors.some((c) => c.toLowerCase() === color);
      const inPrice = PRICE_BANDS[priceBand](p.price);
      const inStock = !inStockOnly || p.total_stock > 0;
      const hay = [
        p.name,
        p.description,
        p.garment_type,
        p.search_tags.join(" "),
        p.colors.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = terms.every((t) => hay.includes(t));
      return inCategory && inColor && inPrice && inStock && matchesQuery;
    });
  }, [products, query, category, color, priceBand, inStockOnly]);

  const sortedFlat = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "name-asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "stock-desc":
        return list.sort((a, b) => b.total_stock - a.total_stock);
      default:
        return list;
    }
  }, [filtered, sort]);

  const grouped = sort === "type";

  return (
    <>
      <div className="container page-head">
        <p className="eyebrow">The collection</p>
        <h1>Shop Campus Customs</h1>
        <p className="muted">
          {loading ? "Loading…" : `${filtered.length} of ${products.length} Yale pieces`}
        </p>
      </div>

      <div className="container">
        <div className="toolbar">
          <input
            type="search"
            placeholder="What are you looking for?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
          <select value={color} onChange={(e) => setColor(e.target.value)} aria-label="Color">
            {colors.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All colors" : c}
              </option>
            ))}
          </select>
          <select value={priceBand} onChange={(e) => setPriceBand(e.target.value)} aria-label="Price">
            <option value="all">Any price</option>
            <option value="under40">Under $40</option>
            <option value="40to70">$40–$70</option>
            <option value="over70">Over $70</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="type">Sort: By type</option>
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock-desc">Most in stock</option>
          </select>
          <label className="toolbar-check">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            In stock only
          </label>
        </div>

        {error && <div className="empty">{error}</div>}

        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton sk-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">No products match your filters.</div>
        ) : grouped ? (
          groupByCategory(filtered).map(({ category: cat, items }) => (
            <section key={cat.slug} id={`cat-${cat.slug}`} className="cat-section">
              <h2 className="cat-head">
                {cat.label} <span className="cat-count">{items.length}</span>
              </h2>
              <div className="product-grid">
                {items.map((p) => (
                  <ProductCard key={p.product_id} product={p} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="product-grid">
            {sortedFlat.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
