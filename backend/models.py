"""Request/response schemas shared by the API and the frontend."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    first_name: str = ""
    last_name: str = ""


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class PageContext(BaseModel):
    """What the shopper is looking at when they send a message. Lets the agent resolve
    'do you have this in pink?' to the product on the current page."""

    product_id: str | None = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    page: PageContext | None = None


class ProductInventory(BaseModel):
    size: str
    quantity: int


class Product(BaseModel):
    product_id: str
    name: str
    garment_type: str
    description: str
    colors: list[str] = Field(default_factory=list)
    search_tags: list[str] = Field(default_factory=list)
    image_url: str
    price: float
    inventory: list[ProductInventory] = Field(default_factory=list)
    total_stock: int = 0
    # Defaulted so chat history saved before this field existed still validates.
    sizes_in_stock: list[str] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    products: list[Product] = Field(default_factory=list)


# ---------------------------------------------------------------- tool results
# Structured types the lookup tools return to the agent. Giving the tools typed
# outputs (instead of loose dicts) keeps the data the model sees consistent and
# makes it hard for the agent to "miss" a field like stock when answering.


class SizeStock(BaseModel):
    """Stock for one size of a product."""

    size: str
    quantity: int  # exact units on hand, straight from the inventory table
    in_stock: bool  # quantity > 0, precomputed so the agent never has to infer it


class ProductLookup(BaseModel):
    """What a product/price/stock lookup returns to the agent.

    Deliberately trimmed to the fields needed to answer a shopper's price and
    availability questions — no image paths or search tags, which the model doesn't
    need to talk about an item.
    """

    product_id: str  # stable id, so the agent can call other tools on the same item
    name: str  # how the agent refers to the product
    garment_type: str  # e.g. "pullover hoodie" — helps phrase the answer
    colors: list[str]  # to answer "do you have it in <color>?" honestly
    price: float  # the one true price; the agent must quote this, not guess
    sizes: list[SizeStock]  # per-size quantities (the source of truth for stock)
    sizes_in_stock: list[str]  # convenience: sizes with quantity > 0
    sizes_sold_out: list[str]  # convenience: sizes offered but at 0, for clear "sold out"
    total_stock: int  # units across all sizes; 0 means the item is fully sold out


class AvailabilityResult(BaseModel):
    """What the per-size availability check returns to the agent."""

    found: bool  # False only when the product_id doesn't exist
    product_id: str | None = None
    name: str | None = None
    size: str | None = None  # the size checked (normalized, e.g. "L")
    quantity: int = 0  # exact units of that size on hand
    in_stock: bool = False  # quantity > 0
    price: float | None = None
    message: str = ""  # a ready-to-say summary, incl. clear sold-out / not-offered notes


class ChatTurn(BaseModel):
    role: str
    content: str
    products: list[Product] = Field(default_factory=list)


class Order(BaseModel):
    """A past purchase for the 'Previously purchased' page."""

    product_id: str
    name: str
    image_url: str = ""
    size: str
    quantity: int
    unit_price: float
    ordered_at: str


class OrderCreate(BaseModel):
    """A real purchase being placed by a signed-in shopper."""

    product_id: str
    size: str
    quantity: int = Field(default=1, ge=1, le=20)
