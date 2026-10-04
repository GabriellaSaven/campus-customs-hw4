"""Tools the Campus Customs agent uses to answer honestly from the database.

Every price/stock claim the chatbot makes must come from one of these functions,
which read the local SQLite catalogue/inventory (see db.py). Keeping the data logic
here — separate from the agent wiring in agent.py — mirrors the Homework 3 layout.

The functions return typed results (models.ProductLookup / models.AvailabilityResult)
so the agent always sees the same fields and can't invent a price or quantity. They
also hand back the full product dict (with image URL) so the chat route can show the
matching items on the page.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import db
from models import AvailabilityResult, ProductLookup, SizeStock


@dataclass
class ChatDeps:
    """Per-request state passed to the agent (and its tools) for one message.

    - ``customer`` is the signed-in shopper ({id, name, email}) or None for a guest,
      so the agent knows who it's talking to.
    - ``page_product`` is the full product record for the page the shopper is on
      (or None), so "do you have this in pink?" can be resolved to the right item.
    - ``shown`` accumulates the products the tools surfaced during the turn so the
      chat route can display them beside the reply (and avoid duplicates).
    """

    customer: dict | None = None
    page_product: dict | None = None
    run_id: str = ""  # ties a turn's tool calls together in the audit trail
    shown: list[dict] = field(default_factory=list)
    seen_ids: set[str] = field(default_factory=set)

    def add(self, products: list[dict]) -> None:
        for product in products:
            pid = product["product_id"]
            if pid not in self.seen_ids:
                self.seen_ids.add(pid)
                self.shown.append(product)


def to_lookup(product: dict) -> ProductLookup:
    """Convert a full product dict into the typed view the agent gets.

    Splits sizes into in-stock vs. sold-out so the agent can speak plainly about
    availability the way an online retailer would."""
    sizes = [
        SizeStock(size=i["size"], quantity=i["quantity"], in_stock=i["quantity"] > 0)
        for i in product["inventory"]
    ]
    return ProductLookup(
        product_id=product["product_id"],
        name=product["name"],
        garment_type=product["garment_type"],
        colors=product["colors"],
        price=product["price"],
        sizes=sizes,
        sizes_in_stock=[s.size for s in sizes if s.in_stock],
        sizes_sold_out=[s.size for s in sizes if not s.in_stock],
        total_stock=product["total_stock"],
    )


def search_catalogue(query: str, limit: int = 8) -> list[dict]:
    """Keyword search across the catalogue; returns full product dicts."""
    return db.search_products(query, limit=limit)


def get_product_details(product_id: str) -> dict | None:
    """Full record for one product, or None if the id is unknown."""
    return db.get_product(product_id)


def check_availability(product_id: str, size: str) -> tuple[AvailabilityResult, dict | None]:
    """Exact stock for a product in a size.

    Returns (result, full_product). The result carries a ready-to-say ``message``
    that states the price and whether the size is in stock, sold out, or not
    offered — so the agent reports availability clearly, like a normal retailer.
    """
    product = db.get_product(product_id)
    if product is None:
        return (
            AvailabilityResult(
                found=False,
                message=f"No product with id '{product_id}' exists in the catalogue.",
            ),
            None,
        )

    size_norm = size.strip().upper()
    match = next(
        (i for i in product["inventory"] if i["size"].upper() == size_norm), None
    )

    if match is None:
        message = (
            f"{product['name']} (${product['price']:.0f}) is not offered in size "
            f"{size_norm}. Offered sizes: "
            f"{', '.join(i['size'] for i in product['inventory']) or 'none listed'}."
        )
        result = AvailabilityResult(
            found=True,
            product_id=product_id,
            name=product["name"],
            size=size_norm,
            quantity=0,
            in_stock=False,
            price=product["price"],
            message=message,
        )
        return result, product

    qty = match["quantity"]
    if qty > 0:
        message = (
            f"{product['name']} (${product['price']:.0f}) is in stock in size "
            f"{match['size']}: {qty} available."
        )
    else:
        message = (
            f"{product['name']} (${product['price']:.0f}) is sold out in size "
            f"{match['size']}."
        )
    result = AvailabilityResult(
        found=True,
        product_id=product_id,
        name=product["name"],
        size=match["size"],
        quantity=qty,
        in_stock=qty > 0,
        price=product["price"],
        message=message,
    )
    return result, product
