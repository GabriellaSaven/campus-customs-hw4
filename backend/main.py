"""Campus Customs API.

Problem 3 scope: a small read-only API that serves the product catalogue and the
product images so the React storefront has something to show. In Problem 5 this
same app grows accounts and the chatbot agent endpoint.

Run from Homework 4/:
    backend/.venv/bin/python -m uvicorn main:app --app-dir backend --port 8000
Docs: http://127.0.0.1:8000/docs
"""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import agent
import auth
import db
from models import (
    AuthResponse,
    ChatRequest,
    ChatResponse,
    ChatTurn,
    LoginRequest,
    Order,
    OrderCreate,
    Product,
    SignupRequest,
    UserOut,
)

HERE = Path(__file__).resolve().parent
# Product images come from the local data pack (<repo>/data/products), not committed.
PRODUCTS_DIR = Path(
    os.getenv("CAMPUS_CUSTOMS_PRODUCTS", str(HERE.parent / "data" / "products"))
)

app = FastAPI(title="Campus Customs", version="0.1.0")

# The Vite dev server proxies /api and /media, but allow CORS too so the API can be
# called directly during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    # Warm the catalogue cache (BE-1) and ensure the orders table exists (BE-2).
    # No seeding — orders are only ever created by real purchases.
    db.all_products()
    db.init_orders()


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "products": len(db.all_products())}


# ---------------------------------------------------------------- accounts
@app.post("/api/signup", response_model=AuthResponse)
def signup(body: SignupRequest) -> dict:
    """Create an account and return a session token."""
    try:
        user = auth.create_user(
            body.first_name, body.last_name, str(body.email), body.password
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"token": auth.create_token(user), "user": user}


@app.post("/api/login", response_model=AuthResponse)
def login(body: LoginRequest) -> dict:
    """Verify credentials and return a session token."""
    user = auth.authenticate(str(body.email), body.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    return {"token": auth.create_token(user), "user": user}


def optional_user(authorization: str | None = Header(default=None)) -> dict | None:
    """Resolve the logged-in user from a Bearer token if present, else None.

    Used by routes that work for guests too (like chat)."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    return auth.decode_token(authorization.split(" ", 1)[1].strip())


def current_user(authorization: str | None = Header(default=None)) -> dict:
    """Resolve the logged-in user from a Bearer token, or 401."""
    user = optional_user(authorization)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@app.get("/api/me", response_model=UserOut)
def me(user: dict = Depends(current_user)) -> dict:
    """Return the current user; the frontend uses this to restore a session."""
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "first_name": user["name"].split(" ")[0] if user["name"] else "",
        "last_name": " ".join(user["name"].split(" ")[1:]) if user["name"] else "",
    }


@app.get("/api/products", response_model=list[Product])
def list_products() -> list[dict]:
    """All products with price and per-size stock, sorted by name."""
    return db.all_products()


@app.get("/api/products/{product_id}", response_model=Product)
def product_detail(product_id: str) -> dict:
    """One product by id, for the single-item page."""
    product = db.get_product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.get("/api/products/{product_id}/related", response_model=list[Product])
def related(product_id: str, limit: int = 4) -> list[dict]:
    """Similar products (in-stock first) for the detail page's suggestions row."""
    if db.get_product(product_id) is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db.related_products(product_id, limit=limit)


# ---------------------------------------------------------------- chatbot
@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest, user: dict | None = Depends(optional_user)
) -> dict:
    """Send a shopper message to the Blue agent and return its reply plus any products
    the agent surfaced. For signed-in users, prior chat history is loaded for memory
    and this turn is saved; guests chat normally but nothing is persisted."""
    # Resolve the product on the shopper's current page, if any.
    page_product = None
    if body.page and body.page.product_id:
        page_product = db.get_product(body.page.product_id)

    # Load prior history (logged-in only) so the agent remembers the conversation.
    history = db.get_chat_history(user["id"]) if user else None

    result = await agent.run_chat(
        body.message,
        customer=user,
        page_product=page_product,
        history=history,
    )

    # Persist this turn for signed-in users.
    if user:
        db.save_chat_message(user["id"], "user", body.message)
        db.save_chat_message(
            user["id"], "assistant", result["reply"], result["products"]
        )

    return result


@app.get("/api/chat/history", response_model=list[ChatTurn])
def chat_history(user: dict = Depends(current_user)) -> list[dict]:
    """Return the signed-in user's saved chat transcript so the widget can reload it."""
    return db.get_chat_history(user["id"])


# ---------------------------------------------------------------- orders
@app.get("/api/orders", response_model=list[Order])
def orders(user: dict = Depends(current_user)) -> list[dict]:
    """The signed-in user's real past purchases (Previously purchased page)."""
    return db.get_orders(user["id"])


@app.post("/api/orders", response_model=Order)
def place_order(body: OrderCreate, user: dict = Depends(current_user)) -> dict:
    """Record a genuine purchase for the signed-in user."""
    try:
        return db.add_order(user["id"], body.product_id, body.size, body.quantity)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# Serve product images at /media/products/<file>.jpg (referenced by image_url).
if PRODUCTS_DIR.exists():
    app.mount("/media/products", StaticFiles(directory=PRODUCTS_DIR), name="products")


if __name__ == "__main__":
    import uvicorn

    # reload=False so one edit doesn't spawn multiple servers.
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
