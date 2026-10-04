import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { fetchOrders, type OrderItem } from "../api";
import { useAuth } from "../auth";

function formatDate(s: string): string {
  const d = new Date(s.replace(" ", "T"));
  return isNaN(d.getTime())
    ? s
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function Orders() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      navigate("/login");
      return;
    }
    fetchOrders(token)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, token, authLoading, navigate]);

  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Your account</p>
        <h1>Previously purchased</h1>
        <p className="muted">
          {loading ? "Loading…" : `${orders.length} past order${orders.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {!loading && orders.length === 0 ? (
        <div className="empty">
          <p>You haven't purchased anything yet.</p>
          <Link to="/products" className="btn btn-primary">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((o, i) => (
            <Link to={`/products/${o.product_id}`} key={`${o.product_id}-${i}`} className="order-row">
              <img src={o.image_url} alt={o.name} />
              <div className="order-info">
                <div className="order-name">{o.name}</div>
                <div className="muted">
                  Size {o.size} · Qty {o.quantity} · {formatDate(o.ordered_at)}
                </div>
              </div>
              <div className="order-price">${(o.unit_price * o.quantity).toFixed(0)}</div>
              <span className="order-reorder">Buy again →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
