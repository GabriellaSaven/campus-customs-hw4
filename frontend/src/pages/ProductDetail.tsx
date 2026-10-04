import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { fetchProduct, fetchRelated } from "../api";
import { useCart } from "../cart";
import type { Product } from "../types";
import ProductCard from "../components/ProductCard";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setRelated([]);
    setSelectedSize(null);
    setAdded(false);
    fetchProduct(id)
      .then(setProduct)
      .catch(() => setError("We couldn't find that product."))
      .finally(() => setLoading(false));
    fetchRelated(id)
      .then(setRelated)
      .catch(() => setRelated([]));
  }, [id]);

  function handleAddToCart() {
    if (!product || !selectedSize) return;
    add({
      product_id: product.product_id,
      name: product.name,
      image_url: product.image_url,
      price: product.price,
      size: selectedSize,
    });
    setAdded(true);
  }

  if (loading) {
    return (
      <div className="container detail">
        <div className="skeleton" style={{ aspectRatio: "1 / 1" }} />
        <div>
          <div className="skeleton" style={{ height: 36, marginBottom: 14 }} />
          <div className="skeleton" style={{ height: 120 }} />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container empty">
        <p>{error ?? "Product not found."}</p>
        <Link to="/products" className="btn btn-primary">
          Back to products
        </Link>
      </div>
    );
  }

  const sizes = [...product.inventory].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size),
  );

  return (
    <div className="container">
      <div className="detail">
        <div className="detail-media">
          <img src={product.image_url} alt={product.name} />
        </div>

        <div className="detail-info">
          <p className="card-type">{product.garment_type}</p>
          <h1>{product.name}</h1>
          <div className="detail-price">${product.price.toFixed(2)}</div>
          <p className="detail-desc">{product.description}</p>

          {product.colors.length > 0 && (
            <div className="spec">
              <h4>Colors</h4>
              <div className="chips">
                {product.colors.map((c) => (
                  <span key={c} className="chip">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="spec">
            <h4>Select a size</h4>
            {sizes.length === 0 ? (
              <p className="muted">Availability not listed.</p>
            ) : (
              <div className="size-grid">
                {sizes.map((s) => {
                  const soldOut = s.quantity === 0;
                  const selected = selectedSize === s.size;
                  return (
                    <button
                      key={s.size}
                      type="button"
                      disabled={soldOut}
                      onClick={() => setSelectedSize(s.size)}
                      className={`size-box ${soldOut ? "soldout" : ""} ${selected ? "selected" : ""}`}
                    >
                      <span className="s">{s.size}</span>
                      <span className="q">
                        {soldOut ? "Sold out" : `${s.quantity} left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add to cart — checkout ("Secure the bag") happens in the cart */}
          <div className="buy-box">
            {product.total_stock === 0 ? (
              <p className="muted">This one's sold out — check the picks below.</p>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleAddToCart}
                  disabled={!selectedSize}
                >
                  {selectedSize
                    ? `Add to bag — ${selectedSize} · $${product.price.toFixed(0)}`
                    : "Select a size"}
                </button>
                {added && (
                  <p className="buy-ok">
                    In your bag! <Link to="/cart">Secure the bag →</Link>
                  </p>
                )}
              </>
            )}
          </div>

          <Link to="/products" className="back-link">
            ← Back to all products
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related-section">
          <div className="section-head">
            <p className="eyebrow">
              {product.total_stock === 0 ? "Sold out? Try these" : "You might also like"}
            </p>
            <h2>Similar Yale pieces</h2>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
