"""SQLite helpers for the Campus Customs store.

The database (campus_customs.db) ships with the assignment and holds the product
catalogue, per-size inventory, users (with hashed passwords), and chat history.
Everything the agent tells a shopper about price and stock comes from here.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
# The data pack (DB + product images) lives in <repo>/data/ and is NOT committed to
# git — graders drop it in after cloning. Override with CAMPUS_CUSTOMS_DB if needed.
DB_PATH = Path(
    os.getenv("CAMPUS_CUSTOMS_DB", str(HERE.parent / "data" / "campus_customs.db"))
)

# Words that carry no product meaning — stripped before matching so "what t-shirts do
# you have?" doesn't match "Double Knit" on the word "do". (BONUS: tighter search)
_STOPWORDS = {
    "a", "an", "and", "any", "are", "can", "do", "does", "for", "get", "got", "have",
    "hello", "hey", "hi", "how", "i", "in", "is", "it", "like", "looking", "me",
    "much", "my", "need", "of", "on", "or", "please", "see", "show", "some", "the",
    "their", "there", "they", "to", "want", "we", "what", "which", "with", "you",
    "your", "stock", "price", "cost", "available", "size", "sizes", "do", "you",
}

# Fold common shopper words into catalogue vocabulary (after hyphen removal +
# singularization, so "tees"/"tee" -> "tshirt", matching the "T-shirt" garment type).
_SYNONYMS = {
    "tee": "tshirt",
    "tshirt": "tshirt",
    "sweater": "sweatshirt",
    "qzip": "quarterzip",
    "hoody": "hoodie",
    "crew": "crewneck",
    "jumper": "sweatshirt",
}


def _normalize_tokens(text: str) -> list[str]:
    """Lowercase, drop hyphens (so 't-shirt' -> 'tshirt'), split on non-word chars,
    remove stopwords, singularize simple plurals, and apply synonyms."""
    text = text.lower().replace("-", "")
    tokens: list[str] = []
    for tok in re.split(r"[^a-z0-9]+", text):
        if not tok or tok in _STOPWORDS:
            continue
        if len(tok) > 3 and tok.endswith("s"):  # crude singularize: hoodies -> hoodie
            tok = tok[:-1]
        tokens.append(_SYNONYMS.get(tok, tok))
    return tokens


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _parse_json_list(value: Any) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else [str(parsed)]
    except (json.JSONDecodeError, TypeError):
        return [part.strip() for part in str(value).split(",") if part.strip()]


def _row_to_product(row: sqlite3.Row, inventory: list[sqlite3.Row]) -> dict:
    image_file = row["image_file_path"]
    # stored as "products/<file>.jpg"; expose a URL the frontend can load
    image_name = image_file.split("/")[-1]
    inv = [{"size": r["size"], "quantity": r["quantity"]} for r in inventory]
    return {
        "product_id": row["product_id"],
        "name": row["name"],
        "garment_type": row["garment_type"],
        "description": row["description"],
        "colors": _parse_json_list(row["colors"]),
        "search_tags": _parse_json_list(row["search_tags"]),
        "image_url": f"/media/products/{image_name}",
        "price": float(row["price"]),
        "inventory": inv,
        "total_stock": sum(item["quantity"] for item in inv),
        "sizes_in_stock": [item["size"] for item in inv if item["quantity"] > 0],
    }


# --- In-memory catalogue cache (BE-1: faster & cheaper) ---------------------
# The catalogue + inventory are static at runtime, so we load and parse them once
# instead of hitting SQLite on every product request and every agent tool call.
_cache_products: list[dict] | None = None
_cache_by_id: dict[str, dict] | None = None


def _load_catalogue() -> None:
    global _cache_products, _cache_by_id
    conn = connect()
    try:
        catalogue = conn.execute("SELECT * FROM catalogue ORDER BY name").fetchall()
        inv_rows = conn.execute("SELECT * FROM inventory").fetchall()
    finally:
        conn.close()
    by_product: dict[str, list[sqlite3.Row]] = {}
    size_order = {"XS": 0, "S": 1, "M": 2, "L": 3, "XL": 4, "XXL": 5}
    for r in inv_rows:
        by_product.setdefault(r["product_id"], []).append(r)
    for rows in by_product.values():
        rows.sort(key=lambda r: size_order.get(r["size"], 99))
    products = [
        _row_to_product(row, by_product.get(row["product_id"], [])) for row in catalogue
    ]
    _cache_products = products
    _cache_by_id = {p["product_id"]: p for p in products}


def _ensure_cache() -> None:
    if _cache_products is None:
        _load_catalogue()


def reload_catalogue() -> None:
    """Force a reload of the in-memory catalogue (e.g. if the DB changes)."""
    _load_catalogue()


def all_products() -> list[dict]:
    _ensure_cache()
    # Return a shallow copy so callers can sort/filter without reordering the cache.
    return list(_cache_products or [])


def get_product(product_id: str) -> dict | None:
    _ensure_cache()
    return (_cache_by_id or {}).get(product_id)


def search_products(query: str, limit: int = 8) -> list[dict]:
    """Keyword search across name, type, colors, description, and tags.

    Normalizes the query (stopwords removed, hyphens dropped, simple plurals and
    synonyms folded) and matches on whole word tokens — not raw substrings — so
    "what t-shirts do you have?" returns actual T-shirts and not a hoodie that merely
    contains the letters "do". Returns full product dicts (with live price/stock).

    Scoring: a query token matching the product's name or garment type scores 2 (a
    strong, on-type hit); matching only colors/description/tags scores 1. When any
    product has a strong hit, incidental-only matches are dropped, so a color word
    like "navy" in "navy hoodie" can't drag in off-type items.
    """
    q_tokens = _normalize_tokens(query)
    products = all_products()
    if not q_tokens:
        return products[:limit]

    scored: list[tuple[int, dict]] = []
    for product in products:
        strong = set(
            _normalize_tokens(product["name"])
            + _normalize_tokens(product["garment_type"])
        )
        weak = set(
            _normalize_tokens(product["description"])
            + _normalize_tokens(" ".join(product["colors"]))
            + _normalize_tokens(" ".join(product["search_tags"]))
        )
        score = 0
        for tok in q_tokens:
            if tok in strong:
                score += 2
            elif tok in weak:
                score += 1
        if score:
            scored.append((score, product))

    if not scored:
        return []

    max_score = max(score for score, _ in scored)
    threshold = 2 if max_score >= 2 else 1
    scored = [(s, p) for s, p in scored if s >= threshold]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [product for _score, product in scored[:limit]]


def related_products(product_id: str, limit: int = 4) -> list[dict]:
    """Products similar to the given one, in-stock first (BONUS: powers the detail-page
    "You might also like" row). Scored by same garment type, shared tags, and a close
    price — so a shopper who hits a sold-out item is steered to a real alternative.
    """
    target = get_product(product_id)
    if target is None:
        return []
    target_tags = {t.lower() for t in target["search_tags"]}
    scored: list[tuple[float, dict]] = []
    for product in all_products():
        if product["product_id"] == product_id:
            continue
        score = 0.0
        if product["garment_type"] == target["garment_type"]:
            score += 3
        score += len(target_tags & {t.lower() for t in product["search_tags"]})
        if abs(product["price"] - target["price"]) <= 15:
            score += 1
        if product["total_stock"] > 0:
            score += 0.5  # prefer items the shopper can actually buy
        if score > 0:
            scored.append((score, product))
    scored.sort(key=lambda pair: (pair[0], pair[1]["total_stock"]), reverse=True)
    return [product for _score, product in scored[:limit]]


# ---------------------------------------------------------------- chat history
# Persisted only for logged-in users, in the seed `chat_messages` table
# (user_id, role, content, products_json, created_at). Guests are never written.


def save_chat_message(
    user_id: int, role: str, content: str, products: list[dict] | None = None
) -> None:
    """Append one chat turn for a logged-in user."""
    products_json = json.dumps(products) if products else None
    conn = connect()
    try:
        conn.execute(
            "INSERT INTO chat_messages (user_id, role, content, products_json) "
            "VALUES (?, ?, ?, ?)",
            (user_id, role, content, products_json),
        )
        conn.commit()
    finally:
        conn.close()


def get_chat_history(user_id: int, limit: int = 50) -> list[dict]:
    """Return a user's most recent chat turns in chronological order.

    Each turn is {role, content, products} where products is the list the assistant
    showed (parsed from products_json), so the widget can rebuild the transcript.
    """
    conn = connect()
    try:
        rows = conn.execute(
            "SELECT role, content, products_json FROM chat_messages "
            "WHERE user_id = ? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    finally:
        conn.close()
    turns: list[dict] = []
    for row in reversed(rows):  # oldest first
        try:
            products = json.loads(row["products_json"]) if row["products_json"] else []
        except (json.JSONDecodeError, TypeError):
            products = []
        turns.append(
            {"role": row["role"], "content": row["content"], "products": products}
        )
    return turns


# ---------------------------------------------------------------- orders (BE-2)
# A real log of purchases a customer actually made. Rows are created only when a
# signed-in shopper places an order (see add_order / POST /api/orders) — nothing is
# fabricated or seeded, so "Previously purchased" always reflects genuine orders.


def init_orders() -> None:
    """Create the orders table if it doesn't exist. No seeding — real orders only."""
    conn = connect()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id TEXT NOT NULL,
                size TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                unit_price REAL NOT NULL,
                ordered_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES catalogue(product_id)
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def add_order(user_id: int, product_id: str, size: str, quantity: int = 1) -> dict:
    """Record a genuine purchase for a signed-in user.

    Validates the product exists and the size is actually offered and in stock; raises
    ValueError otherwise. Returns the created order (enriched for display).
    """
    product = get_product(product_id)
    if product is None:
        raise ValueError("That product doesn't exist.")
    size_norm = size.strip().upper()
    match = next(
        (i for i in product["inventory"] if i["size"].upper() == size_norm), None
    )
    if match is None:
        raise ValueError(f"Size {size_norm} isn't offered for this item.")
    if match["quantity"] <= 0:
        raise ValueError(f"Sorry, {product['name']} is sold out in size {match['size']}.")
    quantity = max(1, int(quantity))

    conn = connect()
    try:
        conn.execute(
            "INSERT INTO orders (user_id, product_id, size, quantity, unit_price) "
            "VALUES (?, ?, ?, ?, ?)",
            (user_id, product_id, match["size"], quantity, product["price"]),
        )
        conn.commit()
    finally:
        conn.close()
    return {
        "product_id": product_id,
        "name": product["name"],
        "image_url": product["image_url"],
        "size": match["size"],
        "quantity": quantity,
        "unit_price": product["price"],
        "ordered_at": "just now",
    }


def get_orders(user_id: int) -> list[dict]:
    """A user's past purchases, most recent first, enriched with product info."""
    conn = connect()
    try:
        rows = conn.execute(
            "SELECT product_id, size, quantity, unit_price, ordered_at "
            "FROM orders WHERE user_id = ? ORDER BY ordered_at DESC, id DESC",
            (user_id,),
        ).fetchall()
    finally:
        conn.close()
    orders: list[dict] = []
    for r in rows:
        product = get_product(r["product_id"])
        orders.append(
            {
                "product_id": r["product_id"],
                "name": product["name"] if product else r["product_id"],
                "image_url": product["image_url"] if product else "",
                "size": r["size"],
                "quantity": r["quantity"],
                "unit_price": r["unit_price"],
                "ordered_at": r["ordered_at"],
            }
        )
    return orders
