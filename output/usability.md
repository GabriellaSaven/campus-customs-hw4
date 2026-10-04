# Usability Improvements (Problem 9)

Two front-end and two back-end usability improvements are the graded requirement
(marked **[OFFICIAL]** below); the extras we built for the real product are marked
**[BONUS]**. For each: what we added and why it helps the shopper or the business.

---

## Front-end

### [OFFICIAL] FE-1 — Richer Products page (filter, sort, size-at-a-glance, grouped by type)
**What:** More filters (category, color, price band, in-stock-only) and more sorts
(by type, name A–Z / Z–A, price low/high, most in stock); each product tile gets a
"Sizes & stock" dropdown showing per-size quantities *before* you click through; the
page defaults to all products **grouped by type** (T-Shirts, Hoodies, Crewnecks,
Quarter-Zips, Jackets, …).
**Why it helps:** Shoppers find the right item faster and can check their size without
an extra page load — fewer clicks, less bounce. Grouping by type makes a 102-item
catalogue scannable.
**Verified:** 102 pieces group correctly (T-Shirts 25, Hoodies 27, Crewnecks 28,
Quarter-Zips 11, Jackets 8, Long Sleeves 2, Sweaters 1); size dropdown expands inline
without navigating; filters/sorts switch to a flat sorted grid.

### [OFFICIAL] FE-2 — Yale visual identity
**What:** A Yale-style serif font (Crimson Pro, close to the proprietary Yale
typeface) for headings; a drawn-in-code **Handsome Dan** bulldog chat icon with a
"Chat with Handsome Dan" speech bubble (the agent persona renamed to match); an
**elm-tree** motif fixed along the bottom of the site (New Haven = the Elm City); a
Yale **shield** logo in the nav; and a **"Products ▾" hover dropdown** listing item
categories, each linking to that category's section on the Products page.
**Why it helps:** The store looks and feels authentically Yale, which builds trust and
brand affinity (shoppers buy licensed gear partly for the identity). The nav dropdown
is a faster path to the category a shopper wants.
**Verified:** Fonts/shield/elm trees/Handsome Dan all render; the dropdown lists all 7
categories and jumping to `/products#cat-<slug>` scrolls to that section. (Per
project rules, all art is SVG drawn in code — no image files or generation. Image
background removal was intentionally skipped.)

### [BONUS] Similar / suggested products on the detail page
**What:** A "You might also like" row at the bottom of each product page showing
related, in-stock items (heading becomes "Sold out? Try these" when the item itself is
sold out). Powered by the `/related` endpoint.
**Why it helps:** If an item (or a size) is sold out, the shopper is steered to a
close alternative instead of leaving — directly protects/recovers sales.
**Verified:** Basic Hoodie detail shows 4 similar in-stock hoodies.

---

## Back-end

### [OFFICIAL] BE-1 — Faster & cheaper agent
**What:** Cache the catalogue in memory so tools/pages don't re-read and re-parse
SQLite on every call; cap the agent's tool-call rounds and output length; keep the
tool payloads trimmed to the fields the model needs.
**Why it helps:** Lower latency = snappier chat for shoppers; fewer/smaller model
calls = lower token spend for the business. Same answers, less time and money.

### [OFFICIAL] BE-2 — Order history ("Previously purchased")
**What:** A new `orders` table that logs **only real purchases**. A signed-in shopper
places an order from the product page (pick an in-stock size → "Buy now"), which
`POST /api/orders` records; `GET /api/orders` + the "Previously purchased" page show
exactly those genuine orders. Nothing is seeded or fabricated — the purchase is
validated server-side (product exists, size offered, in stock) before it's logged.
**Why it helps:** Repeat shoppers can re-find and re-order past items quickly, and the
business gets a truthful purchase log — a foundation for reorder prompts and
personalization.
**Verified:** Orders start empty; buying the Basic Hoodie (XS) through the UI creates
one real row (user 4, $68, actual timestamp) that appears on My Orders; sold-out sizes
→ 400, guests → 401.

### [BONUS] Tighter catalogue search
**What:** Normalize queries (strip stopwords, fold plurals/synonyms like
"tees"→"t-shirt"), match on whole words not accidental substrings, and rank
name/type hits above incidental color/tag hits.
**Why it helps:** "What t-shirts do you have?" returns actual t-shirts, so the right
product cards land on the page — the headline chat feature works reliably.

### [BONUS] `/related` similar-products endpoint
**What:** Server-side "similar products" (same type/tags/price band, in stock first).
**Why it helps:** Powers the detail-page suggestions above and keeps that logic in one
place the agent could also use later.
