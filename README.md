# Campus Customs — Yale Apparel Store + "Handsome Dan" Chatbot

A customer-facing storefront for **Campus Customs** (officially-licensed Yale merch in
New Haven) with a helpful shopping assistant, **Handsome Dan**. Shoppers can browse
products, create an account and log in, chat about merch, watch matching items appear on
the page, and get **honest price/stock answers straight from the database**.

- **Frontend:** React + Vite + TypeScript (`frontend/`)
- **Backend:** FastAPI (`backend/main.py`) with a **PydanticAI** agent over **Portkey → OpenAI**
- **Data:** a local SQLite database + product images (the **data pack**, not committed)

---

## Project layout

```
hw4/
├── AI_prompts.md          # log of the prompts used to build this
├── requirements.txt       # backend Python dependencies
├── .env.example           # copy to .env and add your PORTKEY_API_KEY
├── .gitignore
├── README.md
├── frontend/              # Vite React TypeScript app
├── backend/
│   ├── main.py            # FastAPI app — run with: uvicorn main:app --reload --port 8000
│   ├── agent.py           # PydanticAI agent (builds agent, tools, audit, run_chat)
│   ├── models.py          # Pydantic request/response + tool-result types
│   ├── tools.py           # DB-backed tools + per-request state
│   ├── auth.py            # signup/login (PBKDF2) + JWT sessions
│   ├── audit.py           # append-only audit trail
│   └── prompts/
│       └── prompt.md      # the agent's system prompt (voice + safety rules)
└── output/
    ├── harness.md         # how the system works (full reference)
    ├── design.md          # styling decisions
    ├── usability.md       # usability improvements
    ├── app_check.html     # live-site test report (open in a browser)
    └── app_check_images/  # screenshots linked from app_check.html
```

**Local-only data pack (NOT in git) — place it before running:**

```
data/
├── campus_customs.db      # catalogue, inventory, users, chat history, orders
└── products/              # product images referenced by the catalogue
```

Put the provided `campus_customs.db` and `products/` folder inside a `data/` directory
at the repo root (i.e. `hw4/data/`). The backend reads the database and serves images
from there. (You can override the locations with the env vars `CAMPUS_CUSTOMS_DB` and
`CAMPUS_CUSTOMS_PRODUCTS`.)

---

## Setup

### 0. Environment variable
```bash
cp .env.example .env
# edit .env and set PORTKEY_API_KEY=...
```

### 1. Backend (FastAPI, port 8000)
From the **repo root**:
```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r requirements.txt
```
Then run it **from the `backend/` folder**:
```bash
cd backend
uvicorn main:app --reload --port 8000
```
API docs: http://127.0.0.1:8000/docs

### 2. Frontend (Vite, port 5173)
In a second terminal, from the `frontend/` folder:
```bash
cd frontend
npm install
npm run dev
```
Open **http://127.0.0.1:5173**. The Vite dev server proxies `/api` and `/media` to the
backend on port 8000, so start the backend first.

---

## What you can do
- **Browse** 102 Yale products (grouped by type, with filters, sort, and a per-tile
  size/stock dropdown).
- **Create an account / log in** (passwords stored only as salted PBKDF2 hashes).
- **Chat with Handsome Dan** — ask "what hoodies do you have?" and matching product
  cards appear on the page; ask about price/size and get answers grounded in the
  database (the agent never invents prices or stock).
- **Add to bag → "Secure the bag"** to record a real order, then see it under
  **My Orders** (in the profile menu).

See `output/harness.md` for the full system reference (tools, model fields, safety
rules, limits) and `output/app_check.html` for a screenshot walkthrough.

---

*A Yale student project for MGT 409. Not affiliated with the official Yale Bookstore.*
