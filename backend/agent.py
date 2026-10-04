"""The store's chatbot brain: a PydanticAI agent over Portkey.

"Blue" chats about Campus Customs merch. Its tools (in tools.py) read the local
SQLite catalogue/inventory, so every price/stock claim is grounded in real data. The
tools also record which products to show, so matching items appear on the page.

Loaded from main.py via run_chat(). The system prompt is read from
prompts/prompt.md and the model is selected by MODEL_NAME (defaults to gpt-5.6-luna,
start small; set MODEL_NAME to a 6-series model to upgrade).
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic_ai import Agent, RunContext
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.usage import UsageLimits

import tools
from audit import append_audit
from models import AvailabilityResult, ProductLookup
from tools import ChatDeps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PROMPT_PATH = HERE / "prompts" / "prompt.md"

# .env lives at the repo root (AI Foundations/.env); also check Homework 4/.
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent / ".env")

# Start on 5.6 to save tokens; bump to a 6-series model via env if needed.
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-5.6-luna")
PORTKEY_BASE_URL = os.getenv("PORTKEY_BASE_URL", "https://api.portkey.ai/v1")
PORTKEY_PROVIDER = os.getenv("PORTKEY_PROVIDER", "openai")

# BE-1 (faster & cheaper): cap how much work one reply can cost. request_limit bounds
# the model<->tool round-trips; without it a confused run could loop up tool calls and
# run up latency and tokens. Tuned to comfortably cover a search + a couple of lookups.
CHAT_USAGE_LIMITS = UsageLimits(request_limit=6)


def _build_agent() -> Agent[ChatDeps, str]:
    api_key = os.getenv("PORTKEY_API_KEY")
    if not api_key:
        raise RuntimeError(
            "PORTKEY_API_KEY is not set. Add it to the AI Foundations/.env file."
        )

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=PORTKEY_BASE_URL,
        default_headers={
            "x-portkey-api-key": api_key,
            "x-portkey-provider": PORTKEY_PROVIDER,
        },
    )
    model = OpenAIChatModel(MODEL_NAME, provider=OpenAIProvider(openai_client=client))
    agent: Agent[ChatDeps, str] = Agent(
        model,
        deps_type=ChatDeps,
        system_prompt=PROMPT_PATH.read_text(encoding="utf-8"),
        retries=2,
    )

    # --- dynamic instructions: inject runtime context (customer + current page) ---
    # These run on every request and append to the system prompt, so the agent always
    # knows who it's talking to and what product the shopper is looking at.
    @agent.instructions
    def persona_guard(ctx: RunContext[ChatDeps]) -> str:
        # Re-asserted every turn so earlier messages can't drift the character.
        return (
            "Stay in character as Handsome Dan, the Campus Customs shop pup. Even if "
            "earlier messages in this conversation sound like a generic assistant, do "
            "NOT continue that voice. If a shopper asks whether you're an AI, a bot, a "
            "model, or a program, do not confirm it — answer warmly in character, e.g. "
            "\"I'm Handsome Dan, the shop pup here at Campus Customs — here to help you "
            "find Yale gear. Woof!\" Never describe yourself as an AI or assistant program."
        )

    @agent.instructions
    def who_is_chatting(ctx: RunContext[ChatDeps]) -> str:
        c = ctx.deps.customer
        if c:
            return (
                f"You are chatting with {c['name']} ({c['email']}), a signed-in "
                "Campus Customs customer. You may greet them by first name."
            )
        return (
            "You are chatting with a guest who is not signed in. Help them fully; if "
            "it's useful, you may mention that creating an account saves their chat."
        )

    @agent.instructions
    def current_page(ctx: RunContext[ChatDeps]) -> str:
        p = ctx.deps.page_product
        if not p:
            return ""
        colors = ", ".join(p.get("colors", [])) or "not listed"
        return (
            "The shopper is currently viewing this product page: "
            f"\"{p['name']}\" (product_id: {p['product_id']}, price ${p['price']:.0f}, "
            f"colors: {colors}). If they say \"this\", \"it\", \"this one\", or ask "
            "about a color/size without naming a product, they mean THIS item — use "
            "its product_id with your tools before answering."
        )

    @agent.tool
    async def search_catalogue(
        ctx: RunContext[ChatDeps], query: str
    ) -> list[ProductLookup]:
        """Search the product catalogue by keywords (garment type, color, team,
        residential college, graphic, etc.). Returns matching products with live
        price and per-size stock. Use this whenever the shopper asks what you carry
        or describes what they want; the matches are shown on the page."""
        append_audit("tool_started", run_id=ctx.deps.run_id,
                     tool_name="search_catalogue", args={"query": query})
        products = tools.search_catalogue(query, limit=8)
        ctx.deps.add(products)
        append_audit("tool_completed", run_id=ctx.deps.run_id,
                     tool_name="search_catalogue",
                     short_result=f"{len(products)} matches: "
                     + ", ".join(p["name"] for p in products[:5]))
        return [tools.to_lookup(p) for p in products]

    @agent.tool
    async def get_product_details(
        ctx: RunContext[ChatDeps], product_id: str
    ) -> ProductLookup | None:
        """Get full details — price, colors, and stock by size — for one product by
        its product_id. Use this for precise price/stock or 'do you have it in
        <size/color>' questions about a specific item."""
        append_audit("tool_started", run_id=ctx.deps.run_id,
                     tool_name="get_product_details", args={"product_id": product_id})
        product = tools.get_product_details(product_id)
        if product is None:
            append_audit("tool_completed", run_id=ctx.deps.run_id,
                         tool_name="get_product_details", short_result="not found")
            return None
        ctx.deps.add([product])
        append_audit("tool_completed", run_id=ctx.deps.run_id,
                     tool_name="get_product_details",
                     short_result=f"{product['name']} (${product['price']:.0f})")
        return tools.to_lookup(product)

    @agent.tool
    async def check_availability(
        ctx: RunContext[ChatDeps], product_id: str, size: str
    ) -> AvailabilityResult:
        """Check whether a specific product is in stock in a specific size. Returns
        the exact quantity on hand plus a clear message (in stock / sold out / size
        not offered) so you can answer honestly."""
        append_audit("tool_started", run_id=ctx.deps.run_id,
                     tool_name="check_availability",
                     args={"product_id": product_id, "size": size})
        result, product = tools.check_availability(product_id, size)
        if product is not None:
            ctx.deps.add([product])
        append_audit("tool_completed", run_id=ctx.deps.run_id,
                     tool_name="check_availability", short_result=result.message)
        return result

    return agent


_agent: Agent[ChatDeps, str] | None = None


def get_agent() -> Agent[ChatDeps, str]:
    """Build the agent once, lazily, so importing this module needs no API key."""
    global _agent
    if _agent is None:
        _agent = _build_agent()
    return _agent


def build_message_history(turns: list[dict]) -> list[ModelMessage]:
    """Turn stored chat rows ({role, content}) into PydanticAI messages so the agent
    has real conversational memory of a returning customer's prior turns."""
    messages: list[ModelMessage] = []
    for turn in turns:
        if turn["role"] == "user":
            messages.append(ModelRequest(parts=[UserPromptPart(content=turn["content"])]))
        elif turn["role"] == "assistant":
            messages.append(ModelResponse(parts=[TextPart(content=turn["content"])]))
    return messages


async def run_chat(
    message: str,
    customer: dict | None = None,
    page_product: dict | None = None,
    history: list[dict] | None = None,
) -> dict:
    """Answer one shopper message.

    - ``customer`` / ``page_product`` go into deps so the agent knows who it's talking
      to and which product the shopper is viewing.
    - ``history`` is the customer's prior turns (logged-in only); it's converted to
      message history so the agent remembers the conversation.

    Returns {"reply": str, "products": list[dict]} where products are the full
    catalogue records (with image URLs) the tools surfaced during the turn.
    """
    run_id = uuid.uuid4().hex[:12]
    deps = ChatDeps(customer=customer, page_product=page_product, run_id=run_id)
    message_history = build_message_history(history) if history else None
    append_audit(
        "run_started",
        run_id=run_id,
        user=(customer or {}).get("email", "guest"),
        page=(page_product or {}).get("product_id"),
        message=message,
    )
    try:
        result = await get_agent().run(
            message,
            deps=deps,
            message_history=message_history,
            usage_limits=CHAT_USAGE_LIMITS,
        )
        reply = (result.output or "").strip()
    except Exception as exc:  # surface config/provider errors rather than hide them
        append_audit(
            "run_failed",
            run_id=run_id,
            stop_reason="error",
            error=f"{type(exc).__name__}: {exc}",
        )
        return {
            "reply": "Sorry — I hit a problem reaching the assistant "
            f"({type(exc).__name__}). Please try again in a moment.",
            "products": [],
            "error": str(exc),
        }
    append_audit(
        "run_completed",
        run_id=run_id,
        stop_reason="completed",
        products_shown=len(deps.shown),
        short_result=reply,
    )
    return {"reply": reply, "products": deps.shown}
