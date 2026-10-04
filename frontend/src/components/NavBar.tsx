import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth";
import { useCart } from "../cart";
import { CATEGORIES } from "../categories";
import { YaleShield } from "./YaleArt";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const close = () => {
    setOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    if (!profileOpen) return;
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

  function handleLogout() {
    logout();
    close();
    navigate("/");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    close();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark">
            <YaleShield size={26} />
          </span>
          <span>
            Campus Customs
            <small>Yale Apparel &amp; Gifts</small>
          </span>
        </Link>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          <NavLink to="/" end onClick={close}>
            Home
          </NavLink>
          <div className="nav-dropdown">
            <NavLink to="/products" onClick={close}>
              Products ▾
            </NavLink>
            <div className="nav-menu">
              <Link to="/products" onClick={close}>
                All Products
              </Link>
              {CATEGORIES.map((c) => (
                <Link key={c.slug} to={`/products#cat-${c.slug}`} onClick={close}>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
          <NavLink to="/about" onClick={close}>
            About Us
          </NavLink>
          {user && (
            <div className="mobile-only">
              <NavLink to="/orders" onClick={close}>
                My Orders
              </NavLink>
              <button className="nav-logout-mobile" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
          {!user && (
            <>
              <NavLink to="/login" onClick={close}>
                Login
              </NavLink>
              <NavLink to="/signup" onClick={close}>
                Create Account
              </NavLink>
            </>
          )}
        </nav>

        <form className="nav-search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="What are you looking for?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">
            ⌕
          </button>
        </form>

        <div className="nav-actions">
          <Link to="/cart" className="cart-btn" aria-label="Cart" onClick={close}>
            <span className="cart-ico">🛍️</span>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>

          {user ? (
            <div className={`profile ${profileOpen ? "open" : ""}`} ref={profileRef}>
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen((v) => !v)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                Hi, {user.first_name || user.name} ▾
              </button>
              <div className="profile-menu" role="menu">
                <Link to="/orders" role="menuitem" onClick={close}>
                  My Orders
                </Link>
                <button role="menuitem" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost nav-login">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary nav-signup">
                Create Account
              </Link>
            </>
          )}
        </div>

        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>
    </header>
  );
}
