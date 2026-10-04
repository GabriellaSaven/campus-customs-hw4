import { useState } from "react";
import { Link } from "react-router-dom";

import type { Product } from "../types";
import { STAFF_PICKS } from "../categories";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

function stockLabel(product: Product) {
  if (product.total_stock === 0) return { text: "Sold out", cls: "out-stock" };
  if (product.sizes_in_stock.length <= 2) return { text: "Low stock", cls: "low-stock" };
  return { text: "In stock", cls: "in-stock" };
}

// A short, human one-liner from the product's own description (first sentence).
function shortBlurb(description: string): string {
  const first = description.split(/(?<=[.!?])\s/)[0] ?? description;
  return first.length > 90 ? first.slice(0, 87).trimEnd() + "…" : first;
}

export default function ProductCard({ product }: { product: Product }) {
  const [showSizes, setShowSizes] = useState(false);
  const stock = stockLabel(product);
  const sizes = [...product.inventory].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size),
  );

  // Toggle the size panel without following the card's link.
  function toggleSizes(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowSizes((v) => !v);
  }

  const staffPick = STAFF_PICKS[product.product_id];

  return (
    <Link to={`/products/${product.product_id}`} className="card">
      <div className="card-media">
        <img src={product.image_url} alt={product.name} loading="lazy" />
      </div>
      <div className="card-body">
        <div className="card-topline">
          <span className="card-type">{product.garment_type}</span>
          {staffPick && <span className="staff-stamp">{staffPick}</span>}
        </div>
        <span className="card-name">{product.name}</span>
        <p className="card-blurb">{shortBlurb(product.description)}</p>
        <div className="card-foot">
          <span className="price">${product.price.toFixed(0)}</span>
          <span className={`stock-dot ${stock.cls}`}>{stock.text}</span>
        </div>

        {sizes.length > 0 && (
          <div className="card-sizes">
            <button
              type="button"
              className="card-sizes-toggle"
              onClick={toggleSizes}
              aria-expanded={showSizes}
            >
              Sizes &amp; stock {showSizes ? "▴" : "▾"}
            </button>
            {showSizes && (
              <div className="card-sizes-list">
                {sizes.map((s) => (
                  <span
                    key={s.size}
                    className={`size-pill ${s.quantity === 0 ? "soldout" : ""}`}
                    title={s.quantity === 0 ? "Sold out" : `${s.quantity} in stock`}
                  >
                    {s.size}
                    <em>{s.quantity === 0 ? "—" : s.quantity}</em>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
