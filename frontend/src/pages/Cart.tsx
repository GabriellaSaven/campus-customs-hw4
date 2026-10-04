import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { placeOrder } from "../api";
import { useAuth } from "../auth";
import { useCart } from "../cart";

export default function Cart() {
  const { items, total, remove, clear } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    if (!user || !token) {
      navigate("/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Record each cart line as a real order.
      for (const i of items) {
        await placeOrder(token, { product_id: i.product_id, size: i.size, quantity: i.qty });
      }
      clear();
      navigate("/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Your bag</p>
        <h1>Shopping cart</h1>
        <p className="muted">
          {items.length === 0
            ? "Your bag is empty — for now."
            : `${items.length} item${items.length === 1 ? "" : "s"} ready for game day.`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <p>Nothing here yet.</p>
          <Link to="/products" className="btn btn-primary">
            Shop the collection
          </Link>
        </div>
      ) : (
        <div className="cart-wrap">
          <div className="cart-items">
            {items.map((i) => (
              <div className="cart-row" key={`${i.product_id}-${i.size}`}>
                <img src={i.image_url} alt={i.name} />
                <div className="cart-info">
                  <Link to={`/products/${i.product_id}`} className="cart-name">
                    {i.name}
                  </Link>
                  <div className="muted">
                    Size {i.size} · Qty {i.qty}
                  </div>
                </div>
                <div className="cart-price">${(i.price * i.qty).toFixed(0)}</div>
                <button
                  className="cart-remove"
                  onClick={() => remove(i.product_id, i.size)}
                  aria-label={`Remove ${i.name}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h3>Order summary</h3>
            <div className="cart-total-row">
              <span>Subtotal</span>
              <strong>${total.toFixed(0)}</strong>
            </div>
            <p className="muted" style={{ fontSize: "0.82rem" }}>
              Shipping &amp; tax calculated at the (imaginary) register.
            </p>
            {error && <p className="buy-err">{error}</p>}
            <button className="btn btn-primary btn-block" onClick={checkout} disabled={busy}>
              {busy ? "Securing it…" : "Secure the bag"}
            </button>
            {!user && (
              <p className="muted buy-note">
                You'll <Link to="/login">log in</Link> to finish.
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
